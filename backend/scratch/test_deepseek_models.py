import aiohttp
import asyncio
import os
import json
from dotenv import load_dotenv

load_dotenv()

async def list_deepseek_models():
    api_key = os.getenv("DEEPSEEK_API_KEY")
    url = "https://api.deepseek.com/models"
    headers = { "Authorization": f"Bearer {api_key}" }
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            result = await response.json()
            print(f"Status: {response.status}")
            print(json.dumps(result, indent=2))

asyncio.run(list_deepseek_models())
