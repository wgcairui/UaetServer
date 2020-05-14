import Rout from "koa-router";
const rout = new Rout();
import { JwtVerify } from "../bin/Secret";
import nodeApi from "./node";
import Auth from "./auth";
import { UserInfo } from "../bin/interface";

rout.post("/Api/Node/:type", nodeApi);
rout.all("/api/auth/:type", Auth);

export default rout;
