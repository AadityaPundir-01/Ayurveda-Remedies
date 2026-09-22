import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY", "").strip('"').strip("'")
llm = ChatGoogleGenerativeAI(google_api_key=api_key, model="gemini-3.6-flash")
res = llm.invoke("Hello, answer in 3 words")
print("Gemini 3.6-flash response:", res.content)
