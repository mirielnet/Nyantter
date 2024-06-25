import Router from 'koa-router';
import { Context } from 'koa';
import { AsyncDatabaseConnection } from '../../database';
import { getenv } from '../../env';

const router = new Router();

router.get('/api/users/@:name', async (ctx: Context) => {
  const name = ctx.params.name;

  if (name.length < 1 || name.length > 14) {
    ctx.throw(400, 'Username length must be between 1 and 14 characters');
  }

  const dsn = getenv('dsn');
  if (!dsn) {
    ctx.throw(500, 'Database connection string not found');
  }

  await new AsyncDatabaseConnection(dsn).use(async (conn) => {
    const _user = await conn.fetchrow('SELECT * FROM users WHERE name = $1', [name]);

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
