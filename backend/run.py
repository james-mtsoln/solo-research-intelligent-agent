#!/usr/bin/env python3
"""RID entry point — run the FastAPI application with uvicorn."""

from __future__ import annotations

import sys

import uvicorn

from rid.config import settings


def main() -> None:
    try:
        uvicorn.run(
            "rid.main:app",
            host=settings.host,
            port=settings.port,
            reload=settings.reload,
            log_level=settings.log_level.lower(),
        )
    except SystemExit as exc:
        if exc.code != 0:
            print(f"Server exited with code {exc.code}. Is port {settings.port} already in use?")
        raise


if __name__ == "__main__":
    main()
