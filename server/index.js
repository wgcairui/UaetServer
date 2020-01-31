"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const koa_1 = __importDefault(require("koa"));
// Middleware
const consola_1 = __importDefault(require("consola"));
const koa_body_1 = __importDefault(require("koa-body"));
const koa_error_1 = __importDefault(require("koa-error"));
// const koaLogger = require("koa-logger");
const cors_1 = __importDefault(require("@koa/cors"));
// nuxt
const nuxt_1 = require("nuxt");
// socket
const socket_node_1 = __importDefault(require("./socket/socket.node"));
// Apollo
const apollo_1 = __importDefault(require("./apollo/apollo"));
// Router
const index_1 = __importDefault(require("./router/index"));
// Event
const index_2 = __importDefault(require("./event/index"));
const app = new koa_1.default();
// app.use(sslify());
// new Socket
const ioNode = new socket_node_1.default({ namespace: "Node" });
ioNode.attach(app);
index_2.default.attach(app);
// new apollo
apollo_1.default.applyMiddleware({ app, path: "/graphql" });
// app.use(koaLogger());
app.use(koa_error_1.default({}));
app.use(koa_body_1.default());
app.use(cors_1.default());
app.use(index_1.default.routes()).use(index_1.default.allowedMethods());
async function start() {
    // Import and Set Nuxt.js options
    // eslint-disable-next-line import/order
    const config = require("../nuxt.config.js");
    config.dev = app.env !== "production";
    // Instantiate nuxt.js
    const nuxt = new nuxt_1.Nuxt(config);
    const { host = process.env.HOST || "127.0.0.1", port = process.env.PORT || 3000 } = nuxt.options.server;
    // Build in development
    if (config.dev) {
        const builder = new nuxt_1.Builder(nuxt);
        await builder.build();
    }
    else {
        await nuxt.ready();
    }
    app.use((ctx) => {
        ctx.status = 200;
        ctx.respond = false; // Bypass Koa's built-in response handling
        ctx.request.ctx = ctx; // This might be useful later on, e.g. in nuxtServerInit or with nuxt-stash
        nuxt.render(ctx.req, ctx.res);
    });
    http_1.default.createServer(app.callback()).listen(port, host, undefined, () => {
        consola_1.default.ready({
            message: `HTTP Server listening on http://${host}:${port}`,
            badge: true
        });
    });
    // SSL options
    const options = {
        key: fs_1.default.readFileSync(path_1.default.join(__dirname, "./ssl/localhost/server.key")),
        cert: fs_1.default.readFileSync(path_1.default.join(__dirname, "./ssl/localhost/server.crt"))
    };
    https_1.default
        .createServer(options, app.callback())
        .listen(port - 1, "0.0.0.0", undefined, () => {
        consola_1.default.ready({
            message: `HTTPS Server listening on https://${host}:${port - 1}`,
            badge: true
        });
    });
}
start();
