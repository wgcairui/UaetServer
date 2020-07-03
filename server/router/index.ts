import Rout from "koa-router";
const rout = new Rout();
import nodeApi from "./node";
import Auth from "./auth";
import APPs from "./app";

rout.all("/api/app/:type", APPs);
rout.post("/Api/Node/:type", nodeApi);
rout.all("/api/auth/:type", Auth);

export default rout;
