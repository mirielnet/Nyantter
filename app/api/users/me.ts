import Router from 'koa-router';
import { Context } from 'koa';
import { AsyncDatabaseConnection } from '../../database';
import { getenv } from '../../env';

const router = new Router();

router.get('/api/users/me', async (ctx: Context) => {
  const token = ctx.headers['authorization'] || '';

  const dsn = getenv('dsn');
  if (!dsn) {
    ctx.throw(500, 'Database connection string not found');
  }

  await new AsyncDatabaseConnection(dsn).use(async (conn) => {
    const user_id = await conn.fetchval('SELECT userid FROM token WHERE token = $1', [token]);

    if (!user_id) {
      ctx.throw(401, 'Login Required');
    }

    const _user = await conn.fetchrow('SELECT * FROM users WHERE id = $1', [user_id]);

    if (_user) {
      const user = {
        ..._user,
        detail: 'success',
      };
      delete user.password;
      ctx.body = user;
    } else {
      ctx.body = { detail: 'failed' };
    }
  });
});

export default router;
