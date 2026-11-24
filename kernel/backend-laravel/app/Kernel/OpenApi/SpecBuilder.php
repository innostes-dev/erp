<?php

namespace App\Kernel\OpenApi;

use App\Http\Requests\KernelFormRequest;
use Illuminate\Routing\Route as LaravelRoute;
use Illuminate\Support\Facades\Route;
use ReflectionMethod;
use ReflectionNamedType;

/**
 * Generates the OpenAPI 3.1 document from the registered kernel routes and their FormRequest rules,
 * so the published spec cannot drift from the implementation (`php artisan kernel:openapi`).
 */
class SpecBuilder
{
    private const TAGS = [
        'setup' => 'Setup', 'auth' => 'Authentication', 'users' => 'User management', 'tenants' => 'Tenancy',
    ];

    private const CREATED = ['setup_execute_install', 'auth_create_api_key', 'tenants_create', 'users_create_user'];

    /**
     * @return array<string, mixed>
     */
    public function build(): array
    {
        $paths = [];
        foreach (Route::getRoutes()->getRoutes() as $route) {
            $name = $route->getName();
            if ($name === null || $name === 'system_openapi') {
                continue;
            }
            $path = '/'.ltrim(preg_replace('/\{(\w+)\??\}/', '{$1}', $route->uri()) ?? '', '/');
            foreach ($route->methods() as $method) {
                if ($method === 'HEAD') {
                    continue;
                }
                $paths[$path][strtolower($method)] = $this->operation($route, $name);
            }
        }
        ksort($paths);

        return [
            'openapi' => '3.1.0',
            'info' => [
                'title' => (string) config('kernel.name'),
                'version' => (string) config('kernel.version'),
                'description' => 'Platform kernel API (Laravel implementation). Behaviourally identical to the FastAPI kernel.',
            ],
            'paths' => $paths,
            'components' => [
                'securitySchemes' => [
                    'BearerAuth' => ['type' => 'http', 'scheme' => 'bearer', 'description' => 'JWT access token or inno_live_ API key.'],
                    'SetupToken' => ['type' => 'apiKey', 'in' => 'header', 'name' => 'X-Setup-Token'],
                ],
                'schemas' => [
                    'ErrorResponse' => [
                        'type' => 'object', 'required' => ['detail'],
                        'properties' => ['detail' => ['type' => 'string'], 'code' => ['type' => ['string', 'null']]],
                    ],
                    'HTTPValidationError' => [
                        'type' => 'object',
                        'properties' => ['detail' => ['type' => 'array', 'items' => [
                            'type' => 'object', 'required' => ['loc', 'msg', 'type'],
                            'properties' => ['loc' => ['type' => 'array', 'items' => ['type' => ['string', 'integer']]], 'msg' => ['type' => 'string'], 'type' => ['type' => 'string']],
                        ]]],
                    ],
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function operation(LaravelRoute $route, string $operationId): array
    {
        $uri = $route->uri();
        $segment = explode('/', trim($uri, '/'))[0];
        $tag = match (true) {
            $uri === '/' || $uri === 'config' => 'General',
            $uri === 'health' => 'Observability',
            default => self::TAGS[$segment] ?? 'General',
        };
        $middleware = $route->gatherMiddleware();
        $security = in_array('kernel.auth', $middleware, true) ? [['BearerAuth' => []]]
            : (in_array('setup.guard', $middleware, true) ? [['SetupToken' => []]] : []);

        $parameters = [];
        foreach ($route->parameterNames() as $param) {
            $parameters[] = ['name' => $param, 'in' => 'path', 'required' => true, 'schema' => ['type' => 'string']];
        }
        if ($tag === 'Tenancy' || $operationId === 'auth_get_me') {
            $parameters[] = ['name' => 'X-Tenant-ID', 'in' => 'header', 'required' => false, 'schema' => ['type' => 'string', 'format' => 'uuid']];
        }

        $op = [
            'tags' => [$tag],
            'summary' => ucfirst(str_replace('_', ' ', $operationId)),
            'operationId' => $operationId,
            'security' => $security,
        ];

        $request = $this->formRequest($route);
        if ($request !== null) {
            $schema = $this->schemaFromRules($request->rules());
            if ($request->isQuery) {
                foreach ($schema['properties'] as $name => $property) {
                    $parameters[] = ['name' => $name, 'in' => 'query', 'required' => false, 'schema' => $property];
                }
            } else {
                $op['requestBody'] = ['required' => true, 'content' => ['application/json' => ['schema' => $schema]]];
            }
        }
        if ($parameters !== []) {
            $op['parameters'] = $parameters;
        }

        $success = in_array($operationId, self::CREATED, true) ? '201' : '200';
        $responses = [$success => ['description' => 'Successful response', 'content' => ['application/json' => ['schema' => ['type' => 'object']]]]];
        if ($security !== []) {
            $responses['401'] = $this->error('Missing, invalid or expired credentials');
        }
        if ($request !== null || $route->parameterNames() !== []) {
            $responses['422'] = ['description' => 'Validation error', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/HTTPValidationError']]]];
        }
        if (in_array($operationId, ['system_health', 'setup_get_status'], true)) {
            $responses['503'] = $this->error('Service unavailable');
        }
        $op['responses'] = $responses;

        return $op;
    }

    /**
     * @return array<string, mixed>
     */
    private function error(string $description): array
    {
        return ['description' => $description, 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/ErrorResponse']]]];
    }

    private function formRequest(LaravelRoute $route): ?object
    {
        $action = $route->getActionName();
        if (! str_contains($action, '@')) {
            return null;
        }
        [$class, $method] = explode('@', $action);
        if (! method_exists($class, $method)) {
            return null;
        }
        foreach ((new ReflectionMethod($class, $method))->getParameters() as $parameter) {
            $type = $parameter->getType();
            if ($type instanceof ReflectionNamedType && is_subclass_of($type->getName(), KernelFormRequest::class)) {
                $instance = new ($type->getName());
                $isQuery = (new ReflectionMethod($instance, 'location'))->invoke($instance) === 'query';

                return new class($instance, $isQuery)
                {
                    public function __construct(private readonly KernelFormRequest $request, public readonly bool $isQuery) {}

                    /** @return array<string, mixed> */
                    public function rules(): array
                    {
                        return $this->request->rules();
                    }
                };
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $rules
     * @return array<string, mixed>
     */
    private function schemaFromRules(array $rules): array
    {
        $schema = ['type' => 'object', 'properties' => [], 'required' => []];
        foreach ($rules as $field => $fieldRules) {
            if (str_contains($field, '*')) {
                continue;
            }
            $fieldRules = array_map(fn ($r) => is_string($r) ? $r : '', (array) $fieldRules);
            $property = $this->property($fieldRules);
            $required = (bool) array_intersect($fieldRules, ['required', 'present']);

            $target = &$schema;
            $parts = explode('.', $field);
            $leaf = array_pop($parts);
            foreach ($parts as $part) {
                if (! isset($target['properties'][$part])) {
                    $target['properties'][$part] = ['type' => 'object', 'properties' => [], 'required' => []];
                }
                $target = &$target['properties'][$part];
            }
            $target['properties'][$leaf] = array_merge($target['properties'][$leaf] ?? [], $property);
            if ($required) {
                $target['required'][] = $leaf;
            }
            unset($target);
        }

        return $this->prune($schema);
    }

    /**
     * @param  list<string>  $rules
     * @return array<string, mixed>
     */
    private function property(array $rules): array
    {
        $numeric = in_array('integer', $rules, true);
        $property = ['type' => match (true) {
            $numeric => 'integer',
            in_array('boolean', $rules, true) => 'boolean',
            in_array('array', $rules, true) => 'array',
            default => 'string',
        }];
        foreach ($rules as $rule) {
            if (str_starts_with($rule, 'min:')) {
                $property[$numeric ? 'minimum' : 'minLength'] = (int) substr($rule, 4);
            } elseif (str_starts_with($rule, 'max:')) {
                $property[$numeric ? 'maximum' : 'maxLength'] = (int) substr($rule, 4);
            } elseif (str_starts_with($rule, 'regex:') && ! str_contains($rule, '@[^@')) {
                $property['pattern'] = trim(substr($rule, 6), '/');
            } elseif (str_starts_with($rule, 'in:')) {
                $property['enum'] = explode(',', substr($rule, 3));
            } elseif (str_starts_with($rule, 'email')) {
                $property['format'] = 'email';
            }
        }
        if (in_array('nullable', $rules, true)) {
            $property['type'] = [$property['type'], 'null'];
        }

        return $property;
    }

    /**
     * @param  array<string, mixed>  $schema
     * @return array<string, mixed>
     */
    private function prune(array $schema): array
    {
        if (($schema['required'] ?? null) === []) {
            unset($schema['required']);
        }
        foreach ($schema['properties'] ?? [] as $name => $child) {
            if (is_array($child) && ($child['type'] ?? null) === 'object') {
                $schema['properties'][$name] = $this->prune($child);
            }
        }

        return $schema;
    }
}
