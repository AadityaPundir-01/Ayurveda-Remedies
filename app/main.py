import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health_router, admin_router, consult_router
from app.services.vector_store import get_qdrant_client, ensure_collection_exists

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown events."""
    logger.info("Initializing Agentic AI Medical Backend...")
    target_desc = settings.get_qdrant_url() or f"{settings.QDRANT_HOST}:{settings.QDRANT_PORT}"
    mode_desc = "Hosted/Cloud" if settings.is_cloud_qdrant() else "Local Docker"
    try:
        client = get_qdrant_client()
        ensure_collection_exists(client)
        logger.info(f"Qdrant ({mode_desc}) connected at {target_desc} and collection '{settings.QDRANT_COLLECTION_NAME}' verified.")
    except Exception as e:
        logger.warning(
            f"Could not connect to Qdrant ({mode_desc} at {target_desc}): {e}. "
            "If using Hosted/Cloud Qdrant, check QDRANT_URL and QDRANT_API_KEY in .env. "
            "If using Local Qdrant, ensure Docker Desktop is running."
        )
    yield
    logger.info("Shutting down Agentic AI Medical Backend...")


app = FastAPI(
    title="Agentic AI Medical & Home Remedies Assistant",
    description=(
        "An Agentic RAG system built with FastAPI, LangChain, and LangGraph. "
        "Allows administrators to ingest verified home remedies and provides patients "
        "with symptom-matched remedies, precise dosages, and strict safety/contraindication guardrails."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware to allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(health_router)
app.include_router(admin_router)
app.include_router(consult_router)


@app.get("/")
def root():
    return {
        "service": "Agentic AI Medical & Home Remedies API",
        "status": "online",
        "docs_url": "/docs",
        "active_llm_provider": settings.LLM_PROVIDER,
        "embedding_model": settings.EMBEDDING_MODEL_NAME
    }
