"""Contract testing utilities for OpenAPI spec verification."""

import copy
import json
from typing import Any
import uuid

import jsonschema
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012

from app.main import app

_spec = app.openapi()
_resource = Resource.from_contents(_spec, default_specification=DRAFT202012)
_registry = Registry().with_resource(uri="spec", resource=_resource)


def get_spec() -> dict[str, Any]:
    """Return in-memory OpenAPI specification generated from application code."""
    return _spec


def validate_response_contract(
    response_data: Any,
    path: str,
    method: str,
    status_code: int,
) -> None:
    """Validate that response data matches the schema defined in OpenAPI spec."""
    spec = get_spec()
    path_item = spec.get("paths", {}).get(path, {})
    operation = path_item.get(method.lower(), {})
    responses = operation.get("responses", {})

    status_str = str(status_code)
    if status_str not in responses:
        raise AssertionError(
            f"Undocumented status code {status_code} for {method.upper()} {path}. Documented: {list(responses.keys())}"
        )

    resp_def = responses[status_str]
    content = resp_def.get("content", {})
    if not content:
        return

    json_schema = content.get("application/json", {}).get("schema")
    if not json_schema:
        return

    # Update $ref to point to registered spec resource
    def rewrite_ref(obj: Any) -> Any:
        if isinstance(obj, dict):
            new_obj = {}
            for k, v in obj.items():
                if k == "$ref" and isinstance(v, str) and v.startswith("#/"):
                    new_obj[k] = f"spec{v}"
                else:
                    new_obj[k] = rewrite_ref(v)
            return new_obj
        if isinstance(obj, list):
            return [rewrite_ref(item) for item in obj]
        return obj

    schema_to_validate = rewrite_ref(copy.deepcopy(json_schema))

    try:
        jsonschema.validate(instance=response_data, schema=schema_to_validate, registry=_registry)
    except jsonschema.ValidationError as err:
        raise AssertionError(
            f"Response contract violation for {method.upper()} {path} (HTTP {status_code}): {err.message}\n"
            f"Schema: {json.dumps(json_schema, indent=2)}\n"
            f"Instance: {json.dumps(response_data, indent=2)}"
        ) from err
