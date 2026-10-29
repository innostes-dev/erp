"""HTTP errors raised by services and routers.

Services must not build HTTP responses, so they raise these errors. Each class
declares its HTTP status once, as a `fastapi.status` constant. A single handler
(`kernel.core.http.register_error_handlers`) turns any of them into a
`{"detail": ...}` response with that status (and headers), so routers never
map errors to status codes by hand.

There is one class per HTTP 4xx/5xx status, named after its official phrase:

    ServiceError                 base (500)
    ├── ClientError              4xx base (400)
    │   ├── BadRequestError      400
    │   ├── UnauthorizedError    401
    │   ├── ...
    │   └── UnavailableForLegalReasonsError  451
    └── ServerError              5xx base (500)
        ├── InternalServerError  500
        ├── ...
        └── NetworkAuthenticationRequiredError  511

Features subclass the closest one with a clear name and message:

    class SlugTakenError(ConflictError):
        def __init__(self, slug: str) -> None:
            super().__init__(f"Slug '{slug}' is already in use")

Every error can be raised without a message (the class description is used):

    raise ForbiddenError()
    raise TooManyRequestsError("Slow down", retry_after=30)
"""

from collections.abc import Mapping

from fastapi import status


class ErrorCode:
    """Centralised machine-readable error codes returned in ErrorResponse.code."""

    # Authentication & Accounts
    INVALID_CREDENTIALS = "invalid_credentials"
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_SUSPENDED = "account_suspended"
    TEMPORARY_PASSWORD_EXPIRED = "temporary_password_expired"
    DEVICE_WIPED = "device_wiped"
    INVALID_TOKEN = "invalid_token"
    PASSWORD_RECENTLY_USED = "password_recently_used"

    # Setup & System Lifecycle
    ALREADY_INSTALLED = "already_installed"
    DATABASE_UNAVAILABLE = "database_unavailable"
    SETUP_NOT_AVAILABLE = "setup_not_available"
    INVALID_SETUP_TOKEN = "invalid_setup_token"
    SETUP_REQUIRED = "setup_required"

    # Tenancy & Permissions
    TENANT_NOT_FOUND = "tenant_not_found"
    SLUG_TAKEN = "slug_taken"
    PERMISSION_DENIED = "permission_denied"

    # User Management
    EMAIL_ALREADY_EXISTS = "email_already_exists"
    USER_NOT_FOUND = "user_not_found"
    DEVICE_NOT_FOUND = "device_not_found"

    # Validation & General
    VALIDATION_ERROR = "validation_error"


class ServiceError(Exception):
    """Base class for every error that maps to an HTTP error response.

    Attributes:
        status_code: HTTP status returned to API clients for this error.
        description: Short text for this status, used as the default message
            and in the API docs.
        code: Optional machine-readable error id sent as `code` in the body
            (e.g. "setup_required"), so clients can react without parsing text.
        message: Human-readable explanation, safe to show to API clients.
        headers: Extra response headers (e.g. `Retry-After`).
    """

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    description: str = "Internal server error"
    code: str | None = None

    def __init__(self, message: str | None = None, *, headers: Mapping[str, str] | None = None) -> None:
        """Create the error.

        Args:
            message: Explanation safe to show to API clients. Defaults to the
                class `description`.
            headers: Extra response headers.
        """
        self.message = message or self.description
        self.headers: dict[str, str] = dict(headers or {})
        super().__init__(self.message)


class ClientError(ServiceError):
    """Base for 4xx errors: the request was wrong."""

    status_code = status.HTTP_400_BAD_REQUEST
    description = "Bad request"


class ServerError(ServiceError):
    """Base for 5xx errors: the server or a dependency failed."""

    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    description = "Internal server error"


def _retry_after(headers: Mapping[str, str] | None, retry_after: int | None) -> dict[str, str]:
    """Merge a `Retry-After` header (seconds) into `headers`."""
    merged = dict(headers or {})
    if retry_after is not None:
        merged["Retry-After"] = str(retry_after)
    return merged


# ---- 4xx: client errors ---------------------------------------------------


class BadRequestError(ClientError):
    """The request is malformed or invalid."""

    status_code = status.HTTP_400_BAD_REQUEST
    description = "Bad request"


class UnauthorizedError(ClientError):
    """Authentication is missing or invalid. Sends `WWW-Authenticate: Bearer`."""

    status_code = status.HTTP_401_UNAUTHORIZED
    description = "Not authenticated"

    def __init__(self, message: str | None = None, *, headers: Mapping[str, str] | None = None) -> None:
        """Create the error; adds `WWW-Authenticate: Bearer` unless given."""
        super().__init__(message, headers={"WWW-Authenticate": "Bearer", **(headers or {})})


class PaymentRequiredError(ClientError):
    """The action needs a paid plan or payment."""

    status_code = status.HTTP_402_PAYMENT_REQUIRED
    description = "Payment required"


class ForbiddenError(ClientError):
    """Authenticated, but not allowed to do this."""

    status_code = status.HTTP_403_FORBIDDEN
    description = "Not allowed"


class NotFoundError(ClientError):
    """The requested record does not exist (or is soft-deleted)."""

    status_code = status.HTTP_404_NOT_FOUND
    description = "Resource not found"


class MethodNotAllowedError(ClientError):
    """The HTTP method is not supported for this resource."""

    status_code = status.HTTP_405_METHOD_NOT_ALLOWED
    description = "Method not allowed"


class NotAcceptableError(ClientError):
    """No response format matching the `Accept` header is available."""

    status_code = status.HTTP_406_NOT_ACCEPTABLE
    description = "Not acceptable"


class ProxyAuthenticationRequiredError(ClientError):
    """The client must authenticate with a proxy."""

    status_code = status.HTTP_407_PROXY_AUTHENTICATION_REQUIRED
    description = "Proxy authentication required"


class RequestTimeoutError(ClientError):
    """The client took too long to send the request."""

    status_code = status.HTTP_408_REQUEST_TIMEOUT
    description = "Request timeout"


class ConflictError(ClientError):
    """The request conflicts with existing data (duplicate, already done, ...)."""

    status_code = status.HTTP_409_CONFLICT
    description = "Conflict with existing data"


class GoneError(ClientError):
    """The resource existed but was permanently removed."""

    status_code = status.HTTP_410_GONE
    description = "Resource no longer available"


class LengthRequiredError(ClientError):
    """A `Content-Length` header is required."""

    status_code = status.HTTP_411_LENGTH_REQUIRED
    description = "Length required"


class PreconditionFailedError(ClientError):
    """A request precondition (e.g. `If-Match` version) did not hold."""

    status_code = status.HTTP_412_PRECONDITION_FAILED
    description = "Precondition failed"


class ContentTooLargeError(ClientError):
    """The request body or upload is too large."""

    status_code = status.HTTP_413_CONTENT_TOO_LARGE
    description = "Content too large"


class UriTooLongError(ClientError):
    """The request URL is too long."""

    status_code = status.HTTP_414_URI_TOO_LONG
    description = "URI too long"


class UnsupportedMediaTypeError(ClientError):
    """The request body format (`Content-Type`) is not supported."""

    status_code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
    description = "Unsupported media type"


class RangeNotSatisfiableError(ClientError):
    """The requested byte range can't be served."""

    status_code = status.HTTP_416_RANGE_NOT_SATISFIABLE
    description = "Range not satisfiable"


class ExpectationFailedError(ClientError):
    """The `Expect` header can't be met."""

    status_code = status.HTTP_417_EXPECTATION_FAILED
    description = "Expectation failed"


class ImATeapotError(ClientError):
    """RFC 2324. Included for completeness."""

    status_code = status.HTTP_418_IM_A_TEAPOT
    description = "I'm a teapot"


class MisdirectedRequestError(ClientError):
    """The request was sent to a server that can't answer it."""

    status_code = status.HTTP_421_MISDIRECTED_REQUEST
    description = "Misdirected request"


class UnprocessableContentError(ClientError):
    """Well-formed request that breaks a business validation rule.

    FastAPI already returns this status for schema validation errors; raise
    it for rules the schema can't express.
    """

    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    description = "Unprocessable content"


class LockedError(ClientError):
    """The resource is locked (e.g. a closed accounting period)."""

    status_code = status.HTTP_423_LOCKED
    description = "Resource locked"


class FailedDependencyError(ClientError):
    """The action failed because an earlier action in the same request failed."""

    status_code = status.HTTP_424_FAILED_DEPENDENCY
    description = "Failed dependency"


class TooEarlyError(ClientError):
    """The server won't process a request that might be replayed."""

    status_code = status.HTTP_425_TOO_EARLY
    description = "Too early"


class UpgradeRequiredError(ClientError):
    """The client must switch to a different protocol."""

    status_code = status.HTTP_426_UPGRADE_REQUIRED
    description = "Upgrade required"


class PreconditionRequiredError(ClientError):
    """The request must be conditional (e.g. send `If-Match`)."""

    status_code = status.HTTP_428_PRECONDITION_REQUIRED
    description = "Precondition required"


class TooManyRequestsError(ClientError):
    """Rate limit exceeded. Pass `retry_after` (seconds) to send `Retry-After`."""

    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    description = "Too many requests"

    def __init__(
        self,
        message: str | None = None,
        *,
        retry_after: int | None = None,
        headers: Mapping[str, str] | None = None,
    ) -> None:
        """Create the error.

        Args:
            message: Explanation safe to show to API clients.
            retry_after: Seconds the client should wait before retrying.
            headers: Extra response headers.
        """
        super().__init__(message, headers=_retry_after(headers, retry_after))


class RequestHeaderFieldsTooLargeError(ClientError):
    """The request headers are too large."""

    status_code = status.HTTP_431_REQUEST_HEADER_FIELDS_TOO_LARGE
    description = "Request header fields too large"


class UnavailableForLegalReasonsError(ClientError):
    """The resource can't be served for legal reasons."""

    status_code = status.HTTP_451_UNAVAILABLE_FOR_LEGAL_REASONS
    description = "Unavailable for legal reasons"


# ---- 5xx: server errors ---------------------------------------------------


class InternalServerError(ServerError):
    """An unexpected failure on the server."""

    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    description = "Internal server error"


class NotImplementedServiceError(ServerError):
    """The feature is not implemented yet.

    Named `...ServiceError` because `NotImplementedError` is a Python built-in.
    """

    status_code = status.HTTP_501_NOT_IMPLEMENTED
    description = "Not implemented"


class BadGatewayError(ServerError):
    """An upstream service returned an invalid response."""

    status_code = status.HTTP_502_BAD_GATEWAY
    description = "Bad gateway"


class ServiceUnavailableError(ServerError):
    """A dependency (database, external service) is down or overloaded.

    Pass `retry_after` (seconds) to send `Retry-After`.
    """

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    description = "A required service (e.g. the database) is unavailable"

    def __init__(
        self,
        message: str | None = None,
        *,
        retry_after: int | None = None,
        headers: Mapping[str, str] | None = None,
    ) -> None:
        """Create the error.

        Args:
            message: Explanation safe to show to API clients.
            retry_after: Seconds the client should wait before retrying.
            headers: Extra response headers.
        """
        super().__init__(message, headers=_retry_after(headers, retry_after))


class GatewayTimeoutError(ServerError):
    """An upstream service did not answer in time."""

    status_code = status.HTTP_504_GATEWAY_TIMEOUT
    description = "Gateway timeout"


class HttpVersionNotSupportedError(ServerError):
    """The HTTP version of the request is not supported."""

    status_code = status.HTTP_505_HTTP_VERSION_NOT_SUPPORTED
    description = "HTTP version not supported"


class VariantAlsoNegotiatesError(ServerError):
    """Server content-negotiation misconfiguration."""

    status_code = status.HTTP_506_VARIANT_ALSO_NEGOTIATES
    description = "Variant also negotiates"


class InsufficientStorageError(ServerError):
    """The server can't store what is needed to complete the request."""

    status_code = status.HTTP_507_INSUFFICIENT_STORAGE
    description = "Insufficient storage"


class LoopDetectedError(ServerError):
    """The server detected an infinite loop while processing."""

    status_code = status.HTTP_508_LOOP_DETECTED
    description = "Loop detected"


class NotExtendedError(ServerError):
    """Further extensions to the request are required."""

    status_code = status.HTTP_510_NOT_EXTENDED
    description = "Not extended"


class NetworkAuthenticationRequiredError(ServerError):
    """The client must authenticate to gain network access."""

    status_code = status.HTTP_511_NETWORK_AUTHENTICATION_REQUIRED
    description = "Network authentication required"


# ---- lookup ---------------------------------------------------------------

ERRORS_BY_STATUS: dict[int, type[ServiceError]] = {
    cls.status_code: cls
    for cls in (
        BadRequestError,
        UnauthorizedError,
        PaymentRequiredError,
        ForbiddenError,
        NotFoundError,
        MethodNotAllowedError,
        NotAcceptableError,
        ProxyAuthenticationRequiredError,
        RequestTimeoutError,
        ConflictError,
        GoneError,
        LengthRequiredError,
        PreconditionFailedError,
        ContentTooLargeError,
        UriTooLongError,
        UnsupportedMediaTypeError,
        RangeNotSatisfiableError,
        ExpectationFailedError,
        ImATeapotError,
        MisdirectedRequestError,
        UnprocessableContentError,
        LockedError,
        FailedDependencyError,
        TooEarlyError,
        UpgradeRequiredError,
        PreconditionRequiredError,
        TooManyRequestsError,
        RequestHeaderFieldsTooLargeError,
        UnavailableForLegalReasonsError,
        InternalServerError,
        NotImplementedServiceError,
        BadGatewayError,
        ServiceUnavailableError,
        GatewayTimeoutError,
        HttpVersionNotSupportedError,
        VariantAlsoNegotiatesError,
        InsufficientStorageError,
        LoopDetectedError,
        NotExtendedError,
        NetworkAuthenticationRequiredError,
    )
}
"""The exception class for each HTTP error status, e.g. `ERRORS_BY_STATUS[404] is NotFoundError`."""


def error_for_status(status_code: int) -> type[ServiceError]:
    """Return the exception class for an HTTP status.

    Unknown 4xx codes give `ClientError`, unknown 5xx codes `ServerError`.

    Args:
        status_code: An HTTP status code (4xx or 5xx).

    Returns:
        The matching `ServiceError` subclass.

    Raises:
        ValueError: The code is not an error status (below 400 or above 599).
    """
    if not 400 <= status_code <= 599:
        raise ValueError(f"{status_code} is not an HTTP error status")
    return ERRORS_BY_STATUS.get(status_code, ClientError if status_code < 500 else ServerError)
