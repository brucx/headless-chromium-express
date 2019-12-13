import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import Pino = require('express-pino-logger');
import Redis = require('ioredis');

const REDIS_KEY = 'headless:templates';

const redis = new Redis(process.env.REDIS_URI);
const pino = Pino();

let myBrowser;
puppeteer.launch({
  executablePath: process.env.CHROME_BIN || null,
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '–disable-gpu',
    '–disable-dev-shm-usage',
    '–no-first-run',
    '–no-zygote',
    '–single-process',
  ],
  defaultViewport: {
    isMobile: true,
    width: 375,
    height: 200,
    deviceScaleFactor: 2,
  },
}).then(browser => {
  myBrowser = browser;
});

/**
 * WEB 服务
 */
const app = express();

app.use(pino);
app.use(bodyParser.json());

app.post('/', async (req, resp) => {
  const { body } = req;
  pino.logger.info({ body });
  resp.send('OK');
});

app.post('/template', async (req, resp) => {
  const { body } = req;
  pino.logger.info({ body });
  const templateId = (await redis.rpush(REDIS_KEY, body.html) - 1);
  resp.json({
    templateId,
    html: body.html,
  });
});

app.get('/templates', async (req, resp) => {
  const templates = await redis.lrange(REDIS_KEY, 0, -1);
  resp.send({ templates });
});

app.get('/template/:id', async (req, resp) => {
  const { id: templateIdString } = req.params;
  const template = await redis.lindex(REDIS_KEY, Number(templateIdString));
  resp.send({ template });
});

app.post('/generator', async (req, resp) => {
  const { body } = req;
  pino.logger.info({ body });
  const { templateId, params } = body;
  try {
    const template = await redis.lindex(REDIS_KEY, templateId);
    const templateBuilder = handlebars.compile(template);
    const content = templateBuilder(params);
    const [page] = await myBrowser.pages();
    await page.setContent(content);
    const base64 = await page.screenshot({ type: 'jpeg', encoding: 'base64', fullPage: true });
    resp.send({ base64 });
  } catch (error) {
    pino.logger.error(error);
    resp.send({ error });
  }
});

app.listen(3000, '0.0.0.0', () => {
  pino.logger.info('无头浏览器海报渲染服务已启动, 地址是：http://0.0.0.0:3000');
});
