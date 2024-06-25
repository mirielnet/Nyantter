import Router from '@koa/router';
import { Context } from 'koa';
import { getenv } from '../../env';
import AsyncDatabaseConnection from '../../database';

const router = new Router();

router.delete('/api/auth/logout', async (ctx: Context) => {
    const token = ctx.headers['authorization'];

    const db = new AsyncDatabaseConnection(getenv("dsn") as string);
    await db.connect();
    try {
        const userId = await db.connection.oneOrNone('SELECT userid FROM token WHERE token = $1', token);
        if (!userId) {
            ctx.throw(401, "Login Required");
        }

        await db.connection.none('DELETE FROM token WHERE token = $1', token);

        ctx.status = 200;
        ctx.body = { detail: "deleted" };
    } finally {
        await db.close();
    }
});

export default router;
