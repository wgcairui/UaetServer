/* eslint-disable no-console */
import http from "http";
import Koa from "koa";
// Middleware
import consola from "consola";
import body from "koa-body";
import koaLogger from "koa-logger";
import cors from "@koa/cors";
import compress from "koa-compress";
// Apollo
import ApolloServer from "./apollo/apollo";
// Router
import router from "./router/index";
// Event
import Event from "./event/index";

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
ApolloServer.applyMiddleware({ app, path: "/graphql" })
// use
// app.use(koaLogger());
app.use(body());
app.use(cors());
app.use(router.routes()).use(router.allowedMethods());

const { port, host } = { port: process.env.NODE_PORT ? Number(process.env.NODE_PORT) : 9010, host: "0.0.0.0" }
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

