import Router from 'koa-router';
import { Context } from 'koa';
import { AsyncDatabaseConnection } from '../../database';
import { getenv } from '../../env';

const router = new Router();

interface WillEditPost {
  content: string;
}

router.patch('/api/letters/:letter_id/edit', async (ctx: Context) => {
  const token = ctx.headers['authorization'] || '';
  const letterId = parseInt(ctx.params.letter_id);
  const letter: WillEditPost = ctx.request.body;

  if (!letterId) {
    ctx.throw(400, 'Invalid letter ID');
  }

  const dsn = getenv('dsn');
  if (!dsn) {
    ctx.throw(500, 'Database connection string not found');
  }

  const ipaddr = ctx.headers['x-forwarded-for']?.split(',')[0] || ctx.ip;

  await new AsyncDatabaseConnection(dsn).use(async (conn) => {
    const ipbanned = await conn.fetchrow('SELECT * FROM ban WHERE ipaddr = $1', [ipaddr]);
    if (ipbanned) {
      ctx.throw(403, `IP address banned: ${ipbanned['reason']} (${ipbanned['banned_at']})`);
    }

    const userId = await conn.fetchval('SELECT userid FROM token WHERE token = $1', [token]);
    if (!userId) {
      ctx.throw(401, 'Login Required');
    }

    const letterExists = await conn.fetchval(
      'SELECT EXISTS(SELECT 1 FROM letters WHERE id = $1 AND userid = $2)',
      [letterId, userId]
    );
    if (!letterExists) {
      ctx.throw(403, 'The specified letter is not yours or does not exist');
    }

    await conn.execute(
      'UPDATE letters SET content = $1, edited_at = now() WHERE id = $2 AND userid = $3',
      [letter.content, letterId, userId]
    );
  });

  ctx.body = { detail: 'Edited' };
});

export default router;
