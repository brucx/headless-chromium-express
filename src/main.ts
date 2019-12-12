import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import Pino = require('express-pino-logger');

const pino = Pino();

const templates = [
  `<!DOCTYPE html> <html> <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"> <head> <meta charset="utf-8"> <title>笔记导出</title> </head> <body> <div id=""> <div id="cover"> <div id="user" > <img class="avatar" src="{{avatar}}" /> <div id="userinfo"> <div class="nickname">{{nickname}}</div> <div class="publish"> 发表了笔记 </div> </div> </div> <div id="book"> <img src="{{cover}}" width="140px" height="188px" border-radius:6px; /> </div> <div id="book-info"> <div id="title"> {{title}} </div> <div id="author"> {{author}} </div> </div> </div> <div style="display:flex;justify-content:center;"> <div id="line"> </div> </div> <div id="content"> <div id="digest"> <div class="quote-left"> “ </div> <div class="digest-content"> {{digestContent}} </div> <div class="quote-right"> ” </div></div><div id="note">{{note}}</div> <div id="foot"> <img class="foot-qrcode" src="{{qrcode}}" /> <div id="foot-info"> 开卷Pro dev </div> </div> </div> </body> <style> #cover { height: 370px; background-color: #F9F9F9; } #user { display: flex; } #userinfo { color: #000000; font-family:PingFangSC-Medium,PingFang SC; margin-top: 33px; margin-left: 10px; } .nickname { font-weight:500; font-size: 12px; } .publish { font-size:10px; font-weight:400; } .avatar { width:40px; height:40px; background:rgba(216,216,216,1); margin-left: 26px; margin-top: 29px; border-radius:40px; } #book { display: flex; justify-content: center; margin-top: 27px; } #book-info { display: flex; flex-direction: column; align-items: center; margin-top: 16px; font-size:14px; font-family:PingFangSC-Medium,PingFang SC; font-weight:500; } #line { width:44px; height:2px; margin-top: 24px; border-bottom:2px solid #D8D8D8; } #content { margin: 22px; font-size:14px; font-family:PingFangSC-Regular,PingFang SC; font-weight:400; color: #4A4A4A; line-height: 23px; } #digest { display: flex; flex-direction: column; } .quote-left { color: #C9C9C9; font-size: 80px; margin-bottom: -20px; margin-left: -10px; } .quote-right { color: #C9C9C9; font-size: 80px; align-self: flex-end; margin-top: 20px; } #foot { display: flex; flex-direction: column; align-items: center; margin-top:60px; color: #9B9B9B; font-size: 12px; font-family:PingFangSC-Regular,PingFang SC; margin-bottom: 60px; } .foot-qrcode { width: 60px; height: 60px; margin-bottom: 6px; } </style> </html>`,
];

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
  myBrowser = browser
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

app.post('/poster', async (req, resp) => {
  const { body } = req;
  pino.logger.info({ body });
  const { templateId = 0, title, cover, author, nickname, avatar, digestContent, qrcode, note } = body;
  try {
    const templateBuilder = handlebars.compile(templates[templateId]);
    const content = templateBuilder({ title, cover, author, nickname, avatar, digestContent, qrcode, note });
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
