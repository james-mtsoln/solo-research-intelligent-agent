"""RID API routers."""

from rid.routers.agents import router as agents
from rid.routers.analysis import router as analysis
from rid.routers.auth import router as auth
from rid.routers.invitations import router as invitations
from rid.routers.news import router as news
from rid.routers.pipeline import router as pipeline
from rid.routers.plans import router as plans
from rid.routers.settings import router as settings_router
from rid.routers.users import router as users
from rid.routers.weekly_plans import router as weekly_plans

__all__ = [
    "agents",
    "analysis",
    "auth",
    "invitations",
    "news",
    "pipeline",
    "plans",
    "settings_router",
    "users",
    "weekly_plans",
]
