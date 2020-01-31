import Rout from "koa-router";
const rout = new Rout();
import { JwtVerify } from "../bin/Secret";
import nodeApi from "./node";
import Auth from "./auth";

rout.post("/Api/Node/:type", nodeApi);
rout.post("/api/auth/:type", Auth);
rout.get("/api/auth/user", async (ctx) => {
  ctx.body = await new Promise((resolve) => {
    const token = (<string>ctx.cookies.get("auth._token.local")).replace(
      "bearer%20",
      ""
    );
    const { user } = JwtVerify(token);
    resolve({ user });
  });
});

export default rout;
