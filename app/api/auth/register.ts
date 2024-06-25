import Router from '@koa/router';
import { Context } from 'koa';
import bcrypt from 'bcrypt';
import { randomText } from '../../generator';
import { getenv } from '../../env';
import { verifyCaptcha } from '../../turnstile';
import AsyncDatabaseConnection from '../../database';

const router = new Router();

interface WillRegistUser {
    name: string;
    password: string;
    password_confirm: string;
    turnstile: string;
}

function nameCheck(username: string): boolean {
    const pattern = /[^a-zA-Z0-9_.-]/;
    return pattern.test(username);
}

router.post('/api/auth/register', async (ctx: Context) => {
    const user: WillRegistUser = ctx.request.body;
    const forwardedFor = ctx.headers['x-forwarded-for'];
    const ipaddr = forwardedFor ? forwardedFor.split(',')[0] : ctx.request.ip;

    if (nameCheck(user.name)) {
        ctx.throw(400, "Username contains invalid characters");
    }

    if (user.name.length < 1 || user.name.length > 14) {
        ctx.throw(400, "Username must be at least 1 and no more than 14 characters long");
    }

    if (user.password !== user.password_confirm) {
        ctx.throw(400, "Passwords don't match");
    }

    if (!await verifyCaptcha(user.turnstile)) {
        ctx.throw(400, "Failed to verify captcha");
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(user.password, salt);

    const db = new AsyncDatabaseConnection(getenv("dsn") as string);
    await db.connect();
    try {
        const ipbanned = await db.connection.oneOrNone('SELECT * FROM ban WHERE ipaddr = $1', ipaddr);
        if (ipbanned) {
            ctx.throw(403, `IP address banned: ${ipbanned.reason} (${ipbanned.banned_at})`);
        }

        const userExists = await db.connection.oneOrNone('SELECT 1 FROM users WHERE name = $1', user.name);
        if (userExists) {
            ctx.throw(400, "User exists");
        }

        const userId = Date.now();  // Simulating Snowflake ID generation

        await db.connection.none('INSERT INTO users (id, name, password) VALUES ($1, $2, $3)', [userId, user.name, hashedPassword]);

        const token = randomText(46);

        await db.connection.none('INSERT INTO token (token, userid) VALUES ($1, $2)', [token, userId]);

        ctx.body = { detail: "Registered", token, userid: String(userId) };
    } finally {
        await db.close();
    }
});

export default router;
