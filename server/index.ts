/* eslint-disable no-console */
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import Koa from "koa";
import sslify from "koa-sslify";
// Middleware
import consola from "consola";
import body from "koa-body";
import koaLogger from "koa-logger";
import cors from "@koa/cors";
// nuxt
const { Nuxt, Builder } = require("nuxt");
// socket
// import Socket from "./socket/socket.node";
import NodeIO from "./socket/uart";
import WebIO from "./socket/webClient"
// Apollo
import ApolloServer from "./apollo/apollo";
// Router
import router from "./router/index";
// Event
import Event from "./event/index";
// nuxt config
import config from "../nuxt.config";

const app = new Koa();
// ssl
// app.use(sslify());
// attach
// const ioNode = new Socket({ namespace: "Node" });
// ioNode.attach(app);
Event.attach(app);
// new apollo
ApolloServer.applyMiddleware({ app, path: "/graphql" });
// use
app.use(koaLogger());
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
  // Node_Socket节点挂载
  const NodeSocket = new NodeIO(Http, { path: "/Node" })
  NodeSocket.start()
  consola.success(`Socket Server(namespace:/Node) attach port ${port}`)
  //WebClient_SocketServer挂载
  const WebClientSocket = new WebIO(Http, { path: "/WebClient" })
  WebClientSocket.start()
  consola.success(`Socket Server(namespace:/WebClient) attach port on ${port}`)
  // http监听
  Http.listen(port, host, undefined, () => {
    consola.ready({
      message: `HTTP Server listening on http://${host}:${port}`,
      badge: true
    });
  });
})
