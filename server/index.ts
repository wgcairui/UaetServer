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
import Socket from "./socket/socket.node";
// Apollo
import ApolloServer from "./apollo/apollo";
// Router
import router from "./router/index";
// Event
import Event from "./event/index";

const app:Koa<Koa.DefaultState, Koa.DefaultContext> = new Koa();

// app.use(sslify());
// new Socket
const ioNode = new Socket({ namespace: "Node" });
ioNode.attach(app);
Event.attach(app);

// new apollo
ApolloServer.applyMiddleware({ app, path: "/graphql" });
// app.use(koaLogger());

app.use(body());
app.use(cors());
app.use(router.routes()).use(router.allowedMethods());

async function start() {
  // Import and Set Nuxt.js options
  // eslint-disable-next-line import/order
  const config = require("../nuxt.config.js");

  config.dev = app.env !== "production";
  // Instantiate nuxt.js
  const nuxt = new Nuxt(config);

  const {
    host = process.env.HOST || "127.0.0.1",
    port = process.env.PORT || 3000
  } = nuxt.options.server;

  // Build in development
  await nuxt.ready()
  if (config.dev) {
    const builder = new Builder(nuxt);
    await builder.build();
  } 
  app.use((ctx) => {
    ctx.status = 200;
    ctx.respond = false; // Bypass Koa's built-in response handling
    ctx.request.ctx = ctx; // This might be useful later on, e.g. in nuxtServerInit or with nuxt-stash
    nuxt.render(ctx.req, ctx.res);
  });

  http.createServer(app.callback()).listen(port, host, undefined, () => {
    consola.ready({
      message: `HTTP Server listening on http://${host}:${port}`,
      badge: true
    });
  });
  // SSL options
  const options = {
    key: fs.readFileSync(path.join(__dirname, "./ssl/localhost/server.key")),
    cert: fs.readFileSync(path.join(__dirname, "./ssl/localhost/server.crt"))
  };
  https
    .createServer(options, app.callback())
    .listen(port - 1, host, undefined, () => {
      consola.ready({
        message: `HTTPS Server listening on https://${host}:${port - 1}`,
        badge: true
      });
    });
}

start();
