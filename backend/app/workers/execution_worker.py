import uuid
import logging
from datetime import datetime, timezone
from typing import Any

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

# Registry of step type → handler function
STEP_REGISTRY: dict[str, Any] = {}


def register_step(step_type: str):
    """Decorator to register a step handler."""
    def decorator(fn):
        STEP_REGISTRY[step_type] = fn
        return fn
    return decorator


@register_step("http_request")
def handle_http_request(step_config: dict, context: dict) -> dict:
    import httpx
    resp = httpx.request(
        method=step_config.get("method", "GET"),
        url=step_config["url"],
        headers=step_config.get("headers", {}),
        json=step_config.get("body"),
        timeout=30,
    )
    return {"status_code": resp.status_code, "body": resp.text}


@register_step("condition")
def handle_condition(step_config: dict, context: dict) -> dict:
    # Very simple evaluator — extend with a proper expression engine
    field = step_config.get("field", "")
    op = step_config.get("operator", "eq")
    value = step_config.get("value")
    actual = context.get(field)
    result = (actual == value) if op == "eq" else (actual != value)
    return {"result": result, "branch": "true" if result else "false"}


@celery_app.task(bind=True, max_retries=3, name="occ.execute_step")
def execute_step(self, step_id: str, step_config: dict, context: dict) -> dict:
    """Execute a single workflow step with retry support."""
    try:
        step_type = step_config.get("type", "unknown")
        handler = STEP_REGISTRY.get(step_type)
        if not handler:
            return {"status": "skipped", "reason": f"No handler for type '{step_type}'"}
        result = handler(step_config, context)
        return {"status": "success", "output": result}
    except Exception as exc:
        logger.error("Step %s failed: %s", step_id, exc)
        raise self.retry(exc=exc, countdown=30)


def publish_step_update(execution_id: str, step_id: str, result: Any) -> None:
    """Publish step status to Redis pub/sub for WebSocket relay."""
    try:
        import redis
        r = redis.from_url("redis://localhost:6379/0")
        import json
        r.publish(
            f"occ:exec:{execution_id}",
            json.dumps({"step_id": step_id, "result": result}),
        )
    except Exception as exc:
        logger.warning("Could not publish step update: %s", exc)


@celery_app.task(name="occ.run_workflow")
def run_workflow(execution_id: str, workflow_def: dict, trigger_data: dict) -> dict:
    """Orchestrate a full workflow execution — runs steps sequentially."""
    context: dict = {"trigger": trigger_data, "execution_id": execution_id}
    results = []

    for step in workflow_def.get("steps", []):
        step_id = step.get("id", str(uuid.uuid4()))
        task_result = execute_step.apply(args=[step_id, step, context])
        step_output = task_result.get(timeout=120)
        context[step_id] = step_output
        results.append({"step_id": step_id, **step_output})
        publish_step_update(execution_id, step_id, step_output)

    return {"execution_id": execution_id, "results": results}
