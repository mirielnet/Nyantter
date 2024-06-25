import Router from 'koa-router';
import { Context } from 'koa';
import { AsyncDatabaseConnection } from '../../database';
import { getenv } from '../../env';

const router = new Router();

router.get('/api/users/:id', async (ctx: Context) => {
  const id = parseInt(ctx.params.id);

  const dsn = getenv('dsn');
  if (!dsn) {
    ctx.throw(500, 'Database connection string not found');
  }

  await new AsyncDatabaseConnection(dsn).use(async (conn) => {
    const _user = await conn.fetchrow('SELECT * FROM users WHERE id = $1', [id]);

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
