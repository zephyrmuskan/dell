import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"Key starts with: {api_key[:10] if api_key else 'None'}...")

try:
    client = genai.Client(api_key=api_key)
    print("Testing model: gemini-2.5-flash with google-genai client...")
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Say hello in one word."
    )
    print(f"[+] Success! Response: {response.text.strip()}")
except Exception as e:
    print(f"[-] Failed with google-genai: {e}")


