import logging
from langchain_core.language_models.chat_models import BaseChatModel
from app.config import settings

logger = logging.getLogger(__name__)


def get_llm() -> BaseChatModel:
    """Instantiates and returns the configured LLM (Groq or Google Gemini)

    with automatic fallbacks and robust key sanitization.
    """
    provider = settings.LLM_PROVIDER.lower()
    
    if provider == "groq":
        groq_key = settings.GROQ_API_KEY.strip('"').strip("'").strip()
        if not groq_key:
            raise ValueError(
                "GROQ_API_KEY is not set in .env! "
                "Please add your free Groq API key or switch to LLM_PROVIDER=gemini."
            )
        from langchain_groq import ChatGroq
        
        # Determine model
        model = settings.GROQ_MODEL
        if "llama-3.3-70b" in model:
            # Default to high-performance open model available on Groq
            model = "openai/gpt-oss-120b"
            
        logger.info(f"Initializing ChatGroq with model: {model}")
        return ChatGroq(
            api_key=groq_key,
            model_name=model,
            temperature=0.2
        )
        
    elif provider == "gemini":
        gemini_key = settings.GEMINI_API_KEY.strip('"').strip("'").strip()
        if not gemini_key:
            raise ValueError(
                "GEMINI_API_KEY is not set in .env! "
                "Please add your free Gemini API key (from https://aistudio.google.com/) or switch to LLM_PROVIDER=groq."
            )
        from langchain_google_genai import ChatGoogleGenerativeAI
        
        model = settings.GEMINI_MODEL
        if model in ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"]:
            model = "gemini-3.6-flash"
            
        logger.info(f"Initializing ChatGoogleGenerativeAI with model: {model}")
        return ChatGoogleGenerativeAI(
            google_api_key=gemini_key,
            model=model,
            temperature=0.2
        )
        
    else:
        raise ValueError(
            f"Unsupported LLM_PROVIDER '{settings.LLM_PROVIDER}'. Must be 'groq' or 'gemini'."
        )
