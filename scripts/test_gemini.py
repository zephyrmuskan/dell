import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"Key starts with: {api_key[:10] if api_key else 'None'}...")
genai.configure(api_key=api_key)

models_to_test = [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-2.5-pro"
]

for model_name in models_to_test:
    try:
        print(f"Testing model: {model_name}...")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Say hello in one word.")
        print(f"[+] Success with {model_name}! Response: {response.text.strip()}")
        break
    except Exception as e:
        print(f"[-] Failed with {model_name}: {e}")
