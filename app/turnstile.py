from .env import getenv
import aiohttp

async def verify_captcha(*, token: str, ipaddr: str) -> bool:
    data = {
        "secret": getenv("turnstile"),
        "response": token,
        "ip": ipaddr
    }

    async with aiohttp.ClientSession() as session:
        async with session.post("https://challenges.cloudflare.com/turnstile/v0/siteverify", data=data) as response:
            return (await response.json()).get("success", False)