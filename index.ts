import Koa from 'koa';
import Router from '@koa/router';
import serve from 'koa-static';
import bodyParser from 'koa-bodyparser';
import { Context, Next } from 'koa';
import dotenv from 'dotenv';

// ログ機能のセットアップ
import * as log from 'console';

// 各種APIのインポート
import { registerRouter, loginRouter, logoutRouter } from './app/api/auth';
import { postRouter, editRouter, deleteRouter } from './app/api/letters';
import { latestRouter, officialRouter } from './app/api/timeline';
import { getUserByNameRouter, getUserByIDRouter, meRouter } from './app/api/users';
import { nyantterstatRouter } from './app/api/nyantterstat';
import { frontendRouter } from './app/frontend';

// 環境変数の読み込み
dotenv.config();

log.info("Nyantter is loading now...");

const app = new Koa();
const router = new Router();

app.use(bodyParser());

async function lifespan(ctx: Context, next: Next) {
    log.info("Nyantter was loaded!");
    await next();
    log.info("Nyantter is stopping...");
}

// ミドルウェアとしてlifespanを使用
app.use(lifespan);

// Staticファイルの配信設定
app.use(serve('static'));

// 各種ルータの設定
router.use('/api/stat', nyantterstatRouter.routes());

router.use('/api/auth/register', registerRouter.routes());
router.use('/api/auth/login', loginRouter.routes());
router.use('/api/auth/logout', logoutRouter.routes());

router.use('/api/letters/post', postRouter.routes());
router.use('/api/letters/edit', editRouter.routes());
router.use('/api/letters/delete', deleteRouter.routes());

router.use('/api/timeline/latest', latestRouter.routes());
router.use('/api/timeline/official', officialRouter.routes());

router.use('/api/users/@', getUserByNameRouter.routes());
router.use('/api/users/id', getUserByIDRouter.routes());
router.use('/api/users/me', meRouter.routes());

router.use('/', frontendRouter.routes());

app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    log.info(`Server running on http://localhost:${PORT}`);
});
