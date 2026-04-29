import os
import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def test_deepseek():
    api_key = os.getenv("DEEPSEEK_API_KEY")
    client = AsyncOpenAI(api_key=api_key, base_url="https://api.deepseek.com")
    
    try:
        response = await client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[{"role": "user", "content": "Hello"}],
            stream=False,
            # extra_body={"thinking": {"type": "enabled"}}
        )
        print("Success!")
        print(response.choices[0].message.content)
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_deepseek())
