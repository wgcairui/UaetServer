"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_router_1 = __importDefault(require("koa-router"));
const rout = new koa_router_1.default();
const Secret_1 = require("../bin/Secret");
const node_1 = __importDefault(require("./node"));
const auth_1 = __importDefault(require("./auth"));
rout.post("/Api/Node/:type", node_1.default);
rout.post("/api/auth/:type", auth_1.default);
rout.get("/api/auth/user", async (ctx) => {
    ctx.body = await new Promise((resolve) => {
        const token = ctx.cookies.get("auth._token.local").replace("bearer%20", "");
        const { user } = Secret_1.JwtVerify(token);
        resolve({ user });
    });
});
exports.default = rout;
