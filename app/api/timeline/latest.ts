import Router from 'koa-router';
import { Context } from 'koa';
import { AsyncDatabaseConnection } from '../../database';
import { getenv } from '../../env';

const router = new Router();

router.get('/api/letters/timeline/latest', async (ctx: Context) => {
  const page = parseInt(ctx.query.page as string) || 0;

  const dsn = getenv('dsn');
  if (!dsn) {
    ctx.throw(500, 'Database connection string not found');
  }

  await new AsyncDatabaseConnection(dsn).use(async (conn) => {
    const _letters = await conn.fetch(
      'SELECT * FROM letters ORDER BY created_at DESC LIMIT 20 OFFSET $1',
      [page * 20]
    );

    const letters = {
      letters: _letters.map((letter: any) => ({
        ...letter,
        id: letter.id.toString(),
        userid: letter.userid.toString(),
      })),
      next: `https://nyantter.f5.si/api/timeline/latest?page=${page + 1}`,
    };

    ctx.body = letters;
  });
});

export default router;
