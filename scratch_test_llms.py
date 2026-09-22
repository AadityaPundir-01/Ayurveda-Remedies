import os
from dotenv import load_dotenv

load_dotenv()

print("--- Testing Groq ---")
try:
    from langchain_groq import ChatGroq
    # Test available Groq chat model
    for model_name in ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "groq/compound"]:
        try:
            llm = ChatGroq(
                api_key=os.getenv("GROQ_API_KEY", "").strip('"'),
                model_name=model_name
            )
            res = llm.invoke("Hi")
            print(f"Groq Model '{model_name}' SUCCESS: {res.content[:30]}")
            break
        except Exception as e:
            print(f"Groq Model '{model_name}' Failed: {e}")
except Exception as e:
    print(f"Groq error: {e}")

print("\n--- Testing Gemini ---")
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    for gem_model in ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-2.5-flash"]:
        try:
            llm = ChatGoogleGenerativeAI(
                google_api_key=os.getenv("GEMINI_API_KEY", "").strip('"'),
                model=gem_model
            )
            res = llm.invoke("Hi")
            print(f"Gemini Model '{gem_model}' SUCCESS: {res.content[:30]}")
            break
        except Exception as e:
            print(f"Gemini Model '{gem_model}' Failed: {e}")
except Exception as e:
    print(f"Gemini error: {e}")
