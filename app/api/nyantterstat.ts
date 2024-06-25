import Router from 'koa-router';
import { Context } from 'koa';
import { getenv } from '../env';
import { AsyncDatabaseConnection } from '../database';

const router = new Router();

router.get('/api/stat', async (ctx: Context) => {
  const dsn = getenv('dsn');
  if (!dsn) {
    ctx.throw(500, 'Database connection string not found');
  }

  await new AsyncDatabaseConnection(dsn).use(async (conn) => {
    const users = await conn.fetchval('SELECT COUNT(*) FROM users');
    const letters = await conn.fetchval('SELECT COUNT(*) FROM letters');

    ctx.body = {
      users,
      letters,
    };
  });
});

export default router;
