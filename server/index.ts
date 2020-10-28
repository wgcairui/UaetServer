/* eslint-disable no-console */
import http from "http";
import Koa from "koa";
// Middleware
import consola from "consola";
import body from "koa-body";
import koaLogger from "koa-logger";
import cors from "@koa/cors";
import compress from "koa-compress";
// nuxt
const { Nuxt, Builder } = require("nuxt");
// Apollo
import ApolloServer from "./apollo/apollo";
// Router
import router from "./router/index";
// Event
import Event from "./event/index";
// Cron
import * as Cron from "./cron/index";
// nuxt config
import config from "../nuxt.config";

const app = new Koa();
// compress
/* app.use(compress({
  filter(content_type) {
    return /text/i.test(content_type)
  },
  threshold: 2048,
  gzip: {
    flush: require('zlib').Z_SYNC_FLUSH
  },
  deflate: {
    flush: require('zlib').Z_SYNC_FLUSH,
  },
  br: false // disable brotli
})) */
// attach
Event.attach(app);
// new apollo
ApolloServer.applyMiddleware({ app, path: "/graphql" });
// cron start
Cron.start()
// use
// app.use(koaLogger());
app.use(body());
app.use(cors());
app.use(router.routes()).use(router.allowedMethods());

async function attachNuxt(app: Koa<Koa.DefaultState, Koa.DefaultContext>) {
  // Instantiate nuxt.js
  const nuxt = new Nuxt(config);
  const {
    host = process.env.HOST || "127.0.0.1",
    port = process.env.PORT || 3000
  } = nuxt.options.server;
  // Build in development

  await nuxt.ready();
  if (app.env !== "production") {
    const builder = new Builder(nuxt);
    await builder.build();
  }


  // koa处理页面请求,放在最后面
  app.use(ctx => {
    ctx.status = 200;
    ctx.respond = false;
    ctx.request.ctx = ctx;
    nuxt.render(ctx.req, ctx.res);
  });
  return { host, port }
}

attachNuxt(app).then(result => {
  const { port, host } = result
  // http
  const Http = http.createServer(app.callback())
  Event.CreateSocketServer(Http)
  // http监听
  Http.listen(port, host, undefined, () => {
    consola.ready({
      message: `HTTP Server listening on http://${host}:${port}`,
      badge: true
    });
  });
})
