"""Imports every kernel table so Alembic can see them.

When you add a new feature with tables, import its models here.
"""

from kernel.tenancy.models import *  # noqa: F401,F403
from kernel.setup.models import *  # noqa: F401,F403
from kernel.user.models import *  # noqa: F401,F403
