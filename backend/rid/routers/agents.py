"""Agent / Plugin management router."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from rid.auth import get_current_active_user, get_current_user, require_admin
from rid.database import get_db
from rid.models import AgentPlugin, User

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PluginCreate(BaseModel):
    name: str
    description: str = ""
    module_path: str = Field(..., pattern=r"^[a-zA-Z0-9_.]+$")
    config_schema: str = "{}"
    is_enabled: bool = False


class PluginUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_enabled: Optional[bool] = None
    config_schema: Optional[str] = None


class PluginResponse(BaseModel):
    id: int
    name: str
    description: str
    module_path: str
    config_schema: str
    is_enabled: bool
    installed_at: Optional[str] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=List[PluginResponse])
async def list_plugins(
    enabled_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    """List all registered plugins."""
    query = select(AgentPlugin)
    if enabled_only:
        query = query.where(AgentPlugin.is_enabled == True)
    result = await db.execute(query)
    rows = result.scalars().all()
    return [r.to_dict() for r in rows]


@router.post("", response_model=PluginResponse, status_code=201, dependencies=[require_admin])
async def create_plugin(
    data: PluginCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register a new plugin."""
    # Validate module_path points to an existing module inside rid/plugins/
    import importlib.util
    import sys
    from pathlib import Path

    allowed_prefix = "rid.plugins."
    if not data.module_path.startswith(allowed_prefix):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"module_path must start with '{allowed_prefix}'",
        )

    module_name = data.module_path
    try:
        spec = importlib.util.find_spec(module_name)
    except (ModuleNotFoundError, ValueError):
        spec = None
    if spec is None or spec.origin is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Module '{data.module_path}' not found in the plugins directory",
        )
    # Ensure the module file is actually inside the plugins directory
    plugin_pkg = importlib.import_module("rid.plugins")
    plugin_dir = Path(plugin_pkg.__file__).parent.resolve()
    module_path = Path(spec.origin).resolve()
    if not str(module_path).startswith(str(plugin_dir)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="module_path resolves outside the allowed plugins directory",
        )

    plugin = AgentPlugin(
        name=data.name,
        description=data.description,
        module_path=data.module_path,
        config_schema=data.config_schema,
        is_enabled=data.is_enabled,
    )
    db.add(plugin)
    await db.commit()
    await db.refresh(plugin)
    return plugin.to_dict()


@router.get("/{plugin_id}", response_model=PluginResponse)
async def get_plugin(plugin_id: int, db: AsyncSession = Depends(get_db)):
    """Get a plugin by ID."""
    plugin = await db.get(AgentPlugin, plugin_id)
    if not plugin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plugin not found")
    return plugin.to_dict()


@router.patch("/{plugin_id}", response_model=PluginResponse, dependencies=[require_admin])
async def update_plugin(
    plugin_id: int,
    data: PluginUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a plugin (enable/disable etc.)."""
    plugin = await db.get(AgentPlugin, plugin_id)
    if not plugin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plugin not found")
    if data.name is not None:
        plugin.name = data.name
    if data.description is not None:
        plugin.description = data.description
    if data.is_enabled is not None:
        plugin.is_enabled = data.is_enabled
    if data.config_schema is not None:
        plugin.config_schema = data.config_schema
    await db.commit()
    await db.refresh(plugin)
    return plugin.to_dict()


@router.delete("/{plugin_id}", dependencies=[require_admin])
async def delete_plugin(
    plugin_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Unregister a plugin."""
    plugin = await db.get(AgentPlugin, plugin_id)
    if not plugin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plugin not found")
    await db.delete(plugin)
    await db.commit()
    return {"detail": "Plugin unregistered", "id": plugin_id}
