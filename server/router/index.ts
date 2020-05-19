import Rout from "koa-router";
const rout = new Rout();
import nodeApi from "./node";
import Auth from "./auth";

rout.post("/Api/Node/:type", nodeApi);
rout.all("/api/auth/:type", Auth);

export default rout;
