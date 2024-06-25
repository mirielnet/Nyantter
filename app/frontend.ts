import Router from '@koa/router';
import views from 'koa-views';
import Koa from 'koa';
import { getenv } from './env';

const router = new Router();
const app = new Koa();

app.use(views(__dirname + '/../templates', { extension: 'html' }));

router.get('/', async (ctx) => {
    await ctx.render('index', { request: ctx.request });
});

router.get('/register', async (ctx) => {
    await ctx.render('register', { request: ctx.request, turnstile_sitekey: getenv('turnstile_sitekey') });
});

router.get('/login', async (ctx) => {
    await ctx.render('login', { request: ctx.request });
});

router.get('/home', async (ctx) => {
    await ctx.render('home', { request: ctx.request });
});

export default router;