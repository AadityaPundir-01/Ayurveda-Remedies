from fastapi import APIRouter
from app.config import settings
from app.services.vector_store import get_qdrant_client

router = APIRouter(prefix="/api/health", tags=["Health"])


@router.get("")
def health_check():
    """Checks the health of the API and Qdrant vector database (cloud or local)."""
    qdrant_status = "disconnected"
    collection_count = 0
    is_cloud = settings.is_cloud_qdrant()
    display_target = settings.get_qdrant_url() or f"{settings.QDRANT_HOST}:{settings.QDRANT_PORT}"
    
    try:
        client = get_qdrant_client()
        collections = client.get_collections().collections
        qdrant_status = "connected"
        collection_count = len(collections)
    except Exception as e:
        qdrant_status = f"error: {str(e)}"
        
    return {
        "status": "healthy",
        "llm_provider": settings.LLM_PROVIDER,
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "qdrant": {
            "status": qdrant_status,
            "mode": "cloud" if is_cloud else "local",
            "target": display_target,
            "host": settings.QDRANT_HOST,
            "port": settings.QDRANT_PORT,
            "collections_found": collection_count
        }
    }
