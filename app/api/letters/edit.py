from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import html
from ...env import getenv
from ...database import AsyncDatabaseConnection

router = APIRouter()

class Post(BaseModel):
    id: int
    content: str

@router.post("/api/letters/edit", response_class=JSONResponse)
async def edit_letter(request: Request, letter: Post):
    token = request.headers.get("Authorization", "")

    async with AsyncDatabaseConnection(getenv("dsn")) as conn:
        # トークンの認証とユーザーIDの取得
        user_id = await conn.fetchval('SELECT userid FROM token WHERE token = $1', token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Login Required")

        # レターの存在と所有権の確認
        letter_exists = await conn.fetchval(
            'SELECT EXISTS(SELECT 1 FROM letters WHERE id = $1 AND userid = $2)', letter.id, user_id)
        if not letter_exists:
            raise HTTPException(status_code=403, detail="The specified letter is not yours or does not exist")

        # レターの編集
        await conn.execute(
            """
            UPDATE letters
            SET content = $1, edited_at = now()
            WHERE id = $2 AND userid = $3
            """,
            html.escape(letter.content), letter.id, user_id
        )

    return JSONResponse(
        {"detail": "Edited"},
        200
    )
