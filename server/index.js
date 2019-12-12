/* eslint-disable no-console */
const Koa = require("koa");
// Middleware
const consola = require("consola");
const body = require("koa-body");
const error = require("koa-error");
const cors = require("@koa/cors");
// nuxt
const { Nuxt, Builder } = require("nuxt");
// socket
const Socket = require("./socket/socket.node");
// Apollo
const ApolloServer = require("./apollo/apollo");
// Router
const router = require("./router/index");

const app = new Koa();

const ioNode = new Socket({ namespace: "Node" });
ioNode.attach(app);

ApolloServer.applyMiddleware({ app, path: "/graphql" });

app.use(error());
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
  if (config.dev) {
    const builder = new Builder(nuxt);
    await builder.build();
  } else {
    await nuxt.ready();
  }

  app.use((ctx) => {
    ctx.status = 200;
    ctx.respond = false; // Bypass Koa's built-in response handling
    ctx.req.ctx = ctx; // This might be useful later on, e.g. in nuxtServerInit or with nuxt-stash
    nuxt.render(ctx.req, ctx.res);
  });

  app.listen(port, host);
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  });
}

start();
