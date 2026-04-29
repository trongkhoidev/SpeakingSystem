
import aiohttp
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def check_openai():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("No OpenAI API key")
        return
    
    url = "https://api.openai.com/v1/models"
    headers = {"Authorization": f"Bearer {api_key}"}
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            if resp.status == 200:
                print("OpenAI API key is valid")
            else:
                text = await resp.text()
                print(f"OpenAI API error {resp.status}: {text}")

asyncio.run(check_openai())
