import Rout from "koa-router";
const rout = new Rout();
import { JwtVerify } from "../bin/Secret";
import nodeApi from "./node";
import Auth from "./auth";
import { UserInfo } from "../bin/interface";

rout.post("/Api/Node/:type", nodeApi);
rout.post("/api/auth/:type", Auth);
rout.get("/api/auth/user", async (ctx) => {
  const token = (<string>ctx.cookies.get("auth._token.local")).replace(
    "bearer%20",
    ""
  );
  const User: UserInfo = await JwtVerify(token);
  
  ctx.body = {user:User.user}
});

export default rout;
