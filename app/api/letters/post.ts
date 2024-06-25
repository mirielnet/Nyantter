import Router from 'koa-router';
import { Context } from 'koa';
import { AsyncDatabaseConnection } from '../../database';
import { getenv } from '../../env';
import { random_text } from '../../generator';
import { SnowflakeGenerator } from 'snowflake-generator';
import { removeNonVisibleChars } from '../../utils';

const router = new Router();

interface WillPostLetter {
  content: string;
  replyed_to?: number | string;
  relettered_to?: number | string;
}

router.post('/api/letters', async (ctx: Context) => {
  const token = ctx.headers['authorization'] || '';
  const letter: WillPostLetter = ctx.request.body;

  if (!letter.content && !letter.relettered_to) {
    ctx.throw(400, 'Content Required');
  }

  if (letter.replyed_to && letter.relettered_to) {
    ctx.throw(400, 'What is "Relettered Reply"?');
  }

  if (letter.content.length > 222) {
    ctx.throw(413, 'Content too large');
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

    const userExists = await conn.fetchval('SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)', [userId]);
    if (!userExists) {
      ctx.throw(401, 'User not found');
    }

    const replyedTo = letter.replyed_to ? parseInt(letter.replyed_to.toString()) : null;
    const reletteredTo = letter.relettered_to ? parseInt(letter.relettered_to.toString()) : null;

    if (replyedTo) {
      const letterExists = await conn.fetchval('SELECT EXISTS(SELECT 1 FROM letters WHERE id = $1)', [replyedTo]);
      if (!letterExists) {
        ctx.throw(401, 'Letter not found');
      }
    }

    if (reletteredTo) {
      const letterExists = await conn.fetchval('SELECT EXISTS(SELECT 1 FROM letters WHERE id = $1)', [reletteredTo]);
      if (!letterExists) {
        ctx.throw(401, 'Letter not found');
      }
    }

    const gen = new SnowflakeGenerator(1, Math.floor(Date.now() / 1000));
    const letterId = gen.nextId();

    let content = letter.content;
    content = removeNonVisibleChars(content);
    content = content.replace(/\r\n|\r|\n/g, '<br>\n');
    content = content.replace(/\$\[ruby\|([^|]+)\|(.+)\]/gi, '<ruby>$1<rp>(</rp><rt>$2</rt><rp>)</rp></ruby>');
    content = content.replace(/\$\[color=([^|]+)\|(.+)\]/gi, '<span style="color: $1">$2</span>');
    content = content.replace(/\$\[bgColor=([^|]+)\|(.+)\]/gi, '<span style="background-color: $1">$2</span>');
    content = content.replace(/\*\*([^\*]+)\*\*/g, '<b>$1</b>');
    content = content.replace(/__([^_]+)__/g, '<u>$1</u>');
    content = content.replace(/\*([^\*]+)\*/g, '<i>$1</i>');
    content = content.replace(/~~([^~]+)~~/g, '<s>$1</s>');

    await conn.execute(
      'INSERT INTO letters (id, userid, content, replyed_to, relettered_to) VALUES ($1, $2, $3, $4, $5)',
      [letterId, userId, content, replyedTo, reletteredTo]
    );
  });

  ctx.body = { detail: 'Posted', id: letterId.toString() };
});

export default router;
