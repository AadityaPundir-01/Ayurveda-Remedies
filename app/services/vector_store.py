import os
import logging
from typing import Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from langchain_qdrant import QdrantVectorStore

# Disable noisy symlink warnings on Windows
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

from app.config import settings

logger = logging.getLogger(__name__)

_embeddings_instance = None
_qdrant_client_instance = None


def get_embeddings():
    """Initializes and returns a singleton Hugging Face embedding model.

    Uses fast, ONNX-optimized sentence-transformers/all-MiniLM-L6-v2.
    """
    global _embeddings_instance
    if _embeddings_instance is None:
        logger.info(f"Loading Hugging Face embedding model: {settings.EMBEDDING_MODEL_NAME}")
        try:
            from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
            _embeddings_instance = FastEmbedEmbeddings(
                model_name=settings.EMBEDDING_MODEL_NAME
            )
            logger.info("FastEmbed Hugging Face embeddings initialized.")
        except Exception as e:
            logger.warning(f"FastEmbed initialization note: {e}. Falling back to standard HuggingFaceEmbeddings.")
            from langchain_huggingface import HuggingFaceEmbeddings
            _embeddings_instance = HuggingFaceEmbeddings(
                model_name=settings.EMBEDDING_MODEL_NAME,
                model_kwargs={"device": "cpu"}
            )
    return _embeddings_instance


def reset_qdrant_client():
    """Resets the singleton QdrantClient instance (e.g. after config changes)."""
    global _qdrant_client_instance
    _qdrant_client_instance = None


def get_qdrant_client(force_reload: bool = False) -> QdrantClient:
    """Returns a singleton QdrantClient connection.
    
    Automatically connects to Hosted / Cloud Qdrant if a cloud URL or API key
    is configured in .env, otherwise connects to local Qdrant (Docker).
    """
    global _qdrant_client_instance
    if _qdrant_client_instance is None or force_reload:
        url = settings.get_qdrant_url()
        api_key = settings.get_qdrant_api_key()

        if url:
            masked_key = f"{api_key[:6]}...{api_key[-4:]}" if api_key and len(api_key) > 10 else ("Provided" if api_key else "None")
            logger.info(f"Connecting to Hosted/Cloud Qdrant at: {url} (API Key: {masked_key})")
            _qdrant_client_instance = QdrantClient(
                url=url,
                api_key=api_key,
                timeout=30.0
            )
        else:
            host = settings.QDRANT_HOST or "localhost"
            port = settings.QDRANT_PORT or 6333
            logger.info(f"Connecting to Local Qdrant at {host}:{port}")
            _qdrant_client_instance = QdrantClient(
                host=host,
                port=port,
                api_key=api_key,
                timeout=15.0
            )
    return _qdrant_client_instance


def ensure_collection_exists(client: Optional[QdrantClient] = None, collection_name: Optional[str] = None):
    """Ensures that the target Qdrant collection exists with proper vector dimension."""
    client = client or get_qdrant_client()
    col_name = collection_name or settings.QDRANT_COLLECTION_NAME
    
    try:
        collections = client.get_collections().collections
        collection_names = [col.name for col in collections]
        
        if col_name not in collection_names:
            embeddings = get_embeddings()
            sample_vector = embeddings.embed_query("health check probe")
            dim = len(sample_vector)
            mode_desc = "Cloud" if settings.is_cloud_qdrant() else "Local"
            logger.info(f"Creating {mode_desc} Qdrant collection '{col_name}' with vector size {dim}")
            client.create_collection(
                collection_name=col_name,
                vectors_config=qmodels.VectorParams(
                    size=dim,
                    distance=qmodels.Distance.COSINE
                )
            )
            logger.info(f"Collection '{col_name}' created successfully on Qdrant.")
        else:
            logger.info(f"Qdrant collection '{col_name}' is ready.")
    except Exception as e:
        logger.error(f"Error checking/creating Qdrant collection '{col_name}': {e}")
        raise


def get_vector_store() -> QdrantVectorStore:
    """Returns a LangChain QdrantVectorStore instance."""
    client = get_qdrant_client()
    ensure_collection_exists(client, settings.QDRANT_COLLECTION_NAME)
    embeddings = get_embeddings()
    return QdrantVectorStore(
        client=client,
        collection_name=settings.QDRANT_COLLECTION_NAME,
        embedding=embeddings
    )
