"""Pipeline execution router."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from rid.agents.orchestrator import PipelineStep, ResearchPipeline
from rid.auth import get_current_active_user, get_current_user, require_editor
from rid.database import get_db
from rid.models import User

router = APIRouter()

# Shared pipeline instance
_pipeline: Optional[ResearchPipeline] = None


def _get_pipeline() -> ResearchPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = ResearchPipeline()
    return _pipeline


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PipelineRunRequest(BaseModel):
    weekly_plan_id: int
    step: Optional[str] = None  # null = full pipeline


class PipelineStatusResponse(BaseModel):
    weekly_plan_id: int
    running: bool
    current_step: Optional[str]
    last_run: Optional[str]
    errors: list
    result_summary: dict


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/run", dependencies=[require_editor])
async def run_pipeline(
    data: PipelineRunRequest,
    current_user: User = Depends(get_current_user),
):
    """Run the full pipeline or a specific step for a weekly plan."""
    pipeline = _get_pipeline()

    if data.step:
        try:
            step = PipelineStep(data.step)
        except ValueError:
            valid = [s.value for s in PipelineStep]
            raise HTTPException(status_code=400, detail=f"Invalid step. Valid: {valid}")
        result = await pipeline.run_step(data.weekly_plan_id, step)
        return {
            "weekly_plan_id": data.weekly_plan_id,
            "step": data.step,
            "result": result,
        }
    else:
        result = await pipeline.run_full(data.weekly_plan_id)
        return {
            "weekly_plan_id": data.weekly_plan_id,
            "step": "full",
            "result": result,
        }


@router.get("/status/{weekly_plan_id}", response_model=PipelineStatusResponse)
async def get_pipeline_status(weekly_plan_id: int):
    """Get pipeline status for a weekly plan."""
    pipeline = _get_pipeline()
    status = pipeline.get_status(weekly_plan_id)
    if status is None:
        return {
            "weekly_plan_id": weekly_plan_id,
            "running": False,
            "current_step": None,
            "last_run": None,
            "errors": [],
            "result_summary": {},
        }
    return status


@router.get("/steps")
async def list_steps():
    """List available pipeline steps."""
    return {
        "steps": [
            {"id": s.value, "name": s.name, "description": _step_desc(s)}
            for s in PipelineStep
        ]
    }


def _step_desc(step: PipelineStep) -> str:
    descriptions = {
        PipelineStep.FETCH_NEWS: "Fetch latest news articles for the topic",
        PipelineStep.RUN_ANALYSIS: "Run AI analysis on fetched articles",
        PipelineStep.GENERATE_PLAN: "Generate business plan from analysis results",
    }
    return descriptions.get(step, "")
