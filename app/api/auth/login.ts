import Router from '@koa/router';
import { Context } from 'koa';
import bcrypt from 'bcrypt';
import { randomText } from '../../generator';
import { getenv } from '../../env';
import AsyncDatabaseConnection from '../../database';

const router = new Router();

interface WillLoginUser {
    name: string;
    password: string;
}

router.post('/api/auth/login', async (ctx: Context) => {
    const user: WillLoginUser = ctx.request.body;
    const forwardedFor = ctx.headers['x-forwarded-for'];

    const ipaddr = forwardedFor ? forwardedFor.split(',')[0] : ctx.request.ip;

    const db = new AsyncDatabaseConnection(getenv("dsn") as string);
    await db.connect();
    try {
        const ipbanned = await db.connection.oneOrNone('SELECT * FROM ban WHERE ipaddr = $1', ipaddr);
        if (ipbanned) {
            ctx.throw(403, `IP address banned: ${ipbanned.reason} (${ipbanned.banned_at})`);
        }

        const userExists = await db.connection.oneOrNone('SELECT id, password, isfreezing FROM users WHERE name = $1', user.name);
        if (!userExists || !bcrypt.compareSync(user.password, userExists.password)) {
            ctx.throw(403, "Username or password incorrect");
        }

        if (userExists.isfreezing) {
            ctx.throw(403, "Account is freezing");
        }

        const token = randomText(46);

        await db.connection.none('INSERT INTO token (token, userid) VALUES ($1, $2)', [token, userExists.id]);

        ctx.body = { detail: "Logged in", token, userid: String(userExists.id) };
    } finally {
        await db.close();
    }
});

export default router;
