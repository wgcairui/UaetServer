const Rout = require("koa-router");
const rout = new Rout();
const { JwtVerify } = require("../bin/Secret");
const nodeApi = require("./node");
const Auth = require("./auth");

rout.post("/Api/Node/:type", nodeApi);
rout.post("/api/auth/:type", Auth);
rout.get("/api/auth/user", async (ctx) => {
  ctx.body = await new Promise((resolve) => {
    const token = ctx.cookies.get("auth._token.local").replace("bearer%20", "");
    const { user } = JwtVerify(token);
    resolve({ user });
  });
});

module.exports = rout;
