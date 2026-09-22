from fastapi import APIRouter
from app.config import settings
from app.services.vector_store import get_qdrant_client

router = APIRouter(prefix="/api/health", tags=["Health"])


@router.get("")
def health_check():
    """Checks the health of the API and Qdrant vector database."""
    qdrant_status = "disconnected"
    collection_count = 0
    
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
            "host": settings.QDRANT_HOST,
            "port": settings.QDRANT_PORT,
            "collections_found": collection_count
        }
    }
