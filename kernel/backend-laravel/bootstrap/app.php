<?php

use App\Http\Middleware\AuthenticateKernel;
use App\Http\Middleware\EnsureSetupComplete;
use App\Http\Middleware\ForceJson;
use App\Http\Middleware\GuardSetup;
use App\Http\Middleware\RequestContext;
use App\Kernel\Exceptions\RequestValidationException;
use App\Kernel\Exceptions\ServiceException;
use App\Kernel\Services\SetupState;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Illuminate\Foundation\Http\Middleware\TrimStrings;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

$json = static fn (array $body, int $status, array $headers = []): JsonResponse => response()->json(
    $body, $status, $headers, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
);

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        using: function (): void {
            // Kernel routes live at the root (no /api prefix), matching the FastAPI kernel.
            Route::middleware('kernel.http')->group(base_path('routes/kernel.php'));
        },
        commands: __DIR__.'/../routes/console.php',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // pydantic never trims or null-coerces input; neither do we.
        $middleware->remove([TrimStrings::class, ConvertEmptyStringsToNull::class]);
        $middleware->prepend(RequestContext::class);
        $middleware->group('kernel.http', [ForceJson::class, EnsureSetupComplete::class]);
        $middleware->alias([
            'kernel.auth' => AuthenticateKernel::class,
            'setup.guard' => GuardSetup::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) use ($json): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request, Throwable $e): bool => true);
        $exceptions->dontReport([ServiceException::class, RequestValidationException::class]);

        $exceptions->render(fn (ServiceException $e, Request $r) => $json($e->body(), $e->status, $e->headers));

        $exceptions->render(fn (RequestValidationException $e, Request $r) => $json(['detail' => $e->errors], 422));

        $exceptions->render(function (ValidationException $e, Request $r) use ($json) {
            $items = [];
            foreach ($e->validator->errors()->messages() as $field => $messages) {
                $items[] = ['loc' => ['body', ...explode('.', $field)], 'msg' => $messages[0], 'type' => 'value_error'];
            }

            return $json(['detail' => $items], 422);
        });

        $exceptions->render(function (QueryException $e, Request $r) use ($json) {
            $state = (string) ($e->errorInfo[0] ?? '');
            // Class 08 = connection exception, 57P = operator intervention (shutdown), 53 = insufficient resources.
            if (str_starts_with($state, '08') || str_starts_with($state, '57P') || str_starts_with($state, '53') || $state === '') {
                report($e);

                return $json(SetupState::databaseUnavailable()->body(), 503, ['Retry-After' => '5']);
            }

            return null;
        });

        $exceptions->render(function (Throwable $e, Request $r) use ($json) {
            if ($e instanceof ThrottleRequestsException) {
                return $json(['detail' => 'Too many requests'], 429, $e->getHeaders());
            }
            if ($e instanceof NotFoundHttpException) {
                return $json(['detail' => 'Not Found'], 404);
            }
            if ($e instanceof MethodNotAllowedHttpException) {
                return $json(['detail' => 'Method Not Allowed'], 405, $e->getHeaders());
            }
            if ($e instanceof PostTooLargeException) {
                return $json(['detail' => 'Request entity too large'], 413);
            }
            if ($e instanceof HttpExceptionInterface) {
                return $json(['detail' => $e->getMessage() !== '' ? $e->getMessage() : 'Error'], $e->getStatusCode(), $e->getHeaders());
            }
            if ($e instanceof PDOException && ! $e instanceof QueryException) {
                report($e);

                return $json(SetupState::databaseUnavailable()->body(), 503, ['Retry-After' => '5']);
            }

            report($e);

            return $json(['detail' => 'Internal server error'], 500);
        });
    })->create();
