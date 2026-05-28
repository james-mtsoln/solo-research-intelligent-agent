"""RID Plugin System.

Plugins are Python modules inside this package that subclass :class:`BasePlugin`.
They are auto-discovered at startup and their ``activate`` / ``deactivate``
lifecycle methods are called when the plugin is enabled or disabled.

Example::

    from rid.agents.base import BasePlugin

    class MyPlugin(BasePlugin):
        name = "my_plugin"
        description = "Does something useful"

        async def activate(self):
            ...

        async def deactivate(self):
            ...
"""

from __future__ import annotations

import asyncio
import importlib
import inspect
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Type

from rid.agents.base import BasePlugin

logger = logging.getLogger(__name__)


class PluginLoader:
    """Discovers and manages plugins from ``rid/plugins/``."""

    def __init__(self, package: str = "rid.plugins") -> None:
        self.package = package
        self._discovered: Dict[str, Type[BasePlugin]] = {}
        self._active: Dict[str, BasePlugin] = {}

    # ------------------------------------------------------------------
    # Discovery
    # ------------------------------------------------------------------

    def discover(self) -> List[str]:
        """Scan the plugin directory and return a list of discovered plugin names."""
        try:
            pkg = importlib.import_module(self.package)
            pkg_file = getattr(pkg, "__file__", None)
            if pkg_file is None:
                # namespace package — use importlib.resources
                try:
                    from importlib.resources import files
                    pkg_dir = Path(files(self.package))
                except ImportError:
                    logger.warning("Cannot discover plugins: namespace package without __file__")
                    return []
            else:
                pkg_dir = Path(pkg_file).parent
        except (ImportError, AttributeError) as exc:
            logger.warning("Cannot discover plugins: %s", exc)
            return []

        discovered: List[str] = []
        for py_file in sorted(pkg_dir.glob("*.py")):
            if py_file.name.startswith("_"):
                continue
            module_name = f"{self.package}.{py_file.stem}"
            try:
                module = importlib.import_module(module_name)
            except Exception as exc:
                logger.warning("Failed to import %s: %s", module_name, exc)
                continue

            for _name, obj in inspect.getmembers(module):
                if (
                    inspect.isclass(obj)
                    and issubclass(obj, BasePlugin)
                    and obj is not BasePlugin
                    and getattr(obj, "name", "abstract") != "abstract_plugin"
                ):
                    self._discovered[obj.name] = obj
                    discovered.append(obj.name)
                    logger.info("Discovered plugin: %s (%s)", obj.name, module_name)

        return discovered

    # ------------------------------------------------------------------
    # Activation
    # ------------------------------------------------------------------

    async def activate(self, name: str, config: Optional[Dict[str, Any]] = None) -> bool:
        """Activate a plugin by name."""
        if name in self._active:
            logger.info("Plugin '%s' is already active.", name)
            return True

        cls = self._discovered.get(name)
        if not cls:
            logger.error("Plugin '%s' not found. Run discover() first.", name)
            return False

        try:
            instance = cls()
            await instance.activate()
            self._active[name] = instance
            logger.info("Plugin '%s' activated.", name)
            return True
        except Exception as exc:
            logger.error("Failed to activate plugin '%s': %s", name, exc, exc_info=True)
            return False

    async def deactivate(self, name: str) -> bool:
        """Deactivate a plugin."""
        instance = self._active.pop(name, None)
        if instance is None:
            return False
        try:
            await instance.deactivate()
            logger.info("Plugin '%s' deactivated.", name)
            return True
        except Exception as exc:
            logger.error("Error deactivating plugin '%s': %s", name, exc)
            return False

    async def deactivate_all(self) -> None:
        """Deactivate all active plugins."""
        names = list(self._active.keys())
        for name in names:
            await self.deactivate(name)

    # ------------------------------------------------------------------
    # Introspection
    # ------------------------------------------------------------------

    def list_discovered(self) -> List[str]:
        return list(self._discovered.keys())

    def list_active(self) -> List[str]:
        return list(self._active.keys())

    def get_plugin_info(self, name: str) -> Optional[Dict[str, Any]]:
        cls = self._discovered.get(name)
        if not cls:
            return None
        return {
            "name": cls.name,
            "description": getattr(cls, "description", ""),
            "version": getattr(cls, "version", "0.1.0"),
            "active": name in self._active,
        }
