import aiohttp
import asyncio
import os
import json
from dotenv import load_dotenv

load_dotenv()

async def test_openai():
    api_key = os.getenv("OPENAI_API_KEY")
    url = "https://api.openai.com/v1/chat/completions"
    headers = { "Authorization": f"Bearer {api_key}", "Content-Type": "application/json" }
    payload = {
        "model": "gpt-4o-mini",  # Using mini to save cost/check basic access
        "messages": [{"role": "user", "content": "Return JSON: {\"hello\": \"world\"}"}],
        "response_format": { "type": "json_object" },
        "temperature": 0.3
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=payload) as response:
            result = await response.json()
            print(f"Status: {response.status}")
            print(json.dumps(result, indent=2))

asyncio.run(test_openai())
