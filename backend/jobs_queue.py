import asyncio
import logging
from datetime import datetime, timezone
import uuid

logger = logging.getLogger("jobs_queue")

# Stateful in-memory job registry for administration audits
JOBS_REGISTRY = {}
jobs_queue = asyncio.Queue()

async def add_job(task_type: str, payload: dict) -> str:
    """
    Enqueues a background job into the worker task queue.
    """
    job_id = str(uuid.uuid4())
    job_record = {
        "id": job_id,
        "type": task_type,
        "payload": payload,
        "status": "pending",
        "progress": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "started_at": None,
        "completed_at": None,
        "error": None,
        "retries": 0
    }
    JOBS_REGISTRY[job_id] = job_record
    await jobs_queue.put(job_id)
    logger.info(f"Enqueued background job {job_id} [Type: {task_type}]")
    return job_id

async def job_worker_loop():
    """
    Continuous background loop extracting and executing enqueued worker tasks.
    """
    logger.info("Background tasks worker queue started successfully.")
    while True:
        try:
            job_id = await jobs_queue.get()
            if job_id not in JOBS_REGISTRY:
                jobs_queue.task_done()
                continue
            
            job = JOBS_REGISTRY[job_id]
            job["status"] = "running"
            job["started_at"] = datetime.now(timezone.utc).isoformat()
            logger.info(f"Worker processing job {job_id} [Type: {job['type']}]")

            try:
                # Polymorphic handler based on task type
                if job["type"] == "send_email":
                    # Simulate HTML email template processing & SMTP handshakes
                    await asyncio.sleep(2)  # Network latency
                    job["progress"] = 100
                    logger.info(f"Successfully processed transactional email to {job['payload'].get('to')}")
                    
                elif job["type"] == "render_custom_preview":
                    # Simulate 3D texture mapping, silhouette rendering and static asset cache uploading
                    await asyncio.sleep(3.5) # GPU/Server drawing overhead
                    job["progress"] = 100
                    logger.info(f"Rendered custom shoe mockup preview for {job['payload'].get('submodel')}")
                    
                elif job["type"] == "process_refund":
                    # Simulate gateway handshake, transaction audit logs, and notification dispatch
                    await asyncio.sleep(3)
                    job["progress"] = 100
                    logger.info(f"Processed merchant gateway refund of INR {job['payload'].get('amount')} for order {job['payload'].get('order_id')}")
                    
                elif job["type"] == "order_workflow_escalation":
                    # Simulate inventory materials checks, supervisor registers, and status updates
                    await asyncio.sleep(1.5)
                    job["progress"] = 100
                    logger.info(f"Executed order operational status transition checks for order {job['payload'].get('order_id')}")
                    
                else:
                    raise ValueError(f"Unknown task type: {job['type']}")
                
                job["status"] = "completed"
                job["completed_at"] = datetime.now(timezone.utc).isoformat()
                
            except Exception as ex:
                logger.error(f"Error executing background job {job_id}: {ex}")
                job["status"] = "failed"
                job["error"] = str(ex)
                
            finally:
                jobs_queue.task_done()
                
        except asyncio.CancelledError:
            logger.info("Background task worker loop cancelled.")
            break
        except Exception as e:
            logger.error(f"Critical error in job worker loop: {e}")
            await asyncio.sleep(1)

# Global background task runner instance
worker_task = None

def start_worker():
    global worker_task
    if worker_task is None:
        worker_task = asyncio.create_task(job_worker_loop())
