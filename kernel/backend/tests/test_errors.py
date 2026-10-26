"""Tests for the HTTP error classes and the shared handler."""

from http import HTTPStatus
import unittest

from fastapi import FastAPI, status
from fastapi.testclient import TestClient

from kernel.core import services
from kernel.core.http import register_error_handlers
from kernel.core.schemas import ErrorResponse, error_responses
from kernel.core.services import (
    ERRORS_BY_STATUS,
    ClientError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ServerError,
    ServiceError,
    ServiceUnavailableError,
    TooManyRequestsError,
    UnauthorizedError,
    error_for_status,
)


class TestErrorClasses(unittest.TestCase):
    def test_every_http_error_status_has_a_class(self) -> None:
        expected = {s.value for s in HTTPStatus if 400 <= s.value <= 599} - {
            # Non-standard / not in fastapi.status
            420, 430, 509,
        }
        missing = {code for code in expected if code not in ERRORS_BY_STATUS}
        self.assertFalse(missing, f"no exception class for {sorted(missing)}")

    def test_classes_are_grouped_and_exported(self) -> None:
        for code, cls in ERRORS_BY_STATUS.items():
            self.assertEqual(cls.status_code, code)
            parent = ClientError if code < 500 else ServerError
            self.assertTrue(issubclass(cls, parent), cls.__name__)
            self.assertIn(cls.__name__, services.__all__)
            self.assertTrue(cls.description)

    def test_message_defaults_to_description(self) -> None:
        self.assertEqual(ForbiddenError().message, ForbiddenError.description)
        self.assertEqual(ForbiddenError("No access to payroll").message, "No access to payroll")

    def test_headers(self) -> None:
        self.assertEqual(UnauthorizedError().headers, {"WWW-Authenticate": "Bearer"})
        self.assertEqual(TooManyRequestsError(retry_after=30).headers, {"Retry-After": "30"})
        self.assertEqual(ServiceUnavailableError(retry_after=5).headers, {"Retry-After": "5"})
        self.assertEqual(ConflictError().headers, {})

    def test_error_for_status(self) -> None:
        self.assertIs(error_for_status(status.HTTP_404_NOT_FOUND), NotFoundError)
        self.assertIs(error_for_status(499), ClientError)
        self.assertIs(error_for_status(599), ServerError)
        with self.assertRaises(ValueError):
            error_for_status(status.HTTP_200_OK)

    def test_base_is_a_server_error(self) -> None:
        self.assertEqual(ServiceError.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class TestErrorHandler(unittest.TestCase):
    def setUp(self) -> None:
        app = FastAPI()
        register_error_handlers(app)

        @app.get("/conflict")
        def conflict() -> None:
            raise ConflictError("Already there")

        @app.get("/limited")
        def limited() -> None:
            raise TooManyRequestsError(retry_after=10)

        self.client = TestClient(app)

    def test_status_and_detail(self) -> None:
        res = self.client.get("/conflict")
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(res.json(), {"detail": "Already there"})

    def test_code_is_added_when_set(self) -> None:
        class LockedPeriodError(ConflictError):
            code = "period_locked"

        app = FastAPI()
        register_error_handlers(app)

        @app.get("/locked")
        def locked() -> None:
            raise LockedPeriodError("Period is closed")

        res = TestClient(app).get("/locked")
        self.assertEqual(res.json(), {"detail": "Period is closed", "code": "period_locked"})
        self.assertNotIn("code", self.client.get("/conflict").json())

    def test_headers_are_sent(self) -> None:
        res = self.client.get("/limited")
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(res.headers["Retry-After"], "10")
        self.assertEqual(res.json(), {"detail": TooManyRequestsError.description})


class TestErrorResponses(unittest.TestCase):
    def test_built_from_error_classes_and_constants(self) -> None:
        docs = error_responses(NotFoundError, ConflictError, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(
            set(docs),
            {status.HTTP_404_NOT_FOUND, status.HTTP_409_CONFLICT, status.HTTP_401_UNAUTHORIZED},
        )
        self.assertEqual(docs[status.HTTP_404_NOT_FOUND]["description"], NotFoundError.description)
        self.assertEqual(docs[status.HTTP_401_UNAUTHORIZED]["description"], "Unauthorized")
        self.assertIs(docs[status.HTTP_409_CONFLICT]["model"], ErrorResponse)


if __name__ == "__main__":
    unittest.main()
