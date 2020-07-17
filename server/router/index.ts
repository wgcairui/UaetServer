import Rout from "koa-router";
const rout = new Rout();
import nodeApi from "./node";
import Auth from "./auth";
import APPs from "./app";
import WX from "./wx"

rout.all("/api/app/:type", APPs);
rout.post("/Api/Node/:type", nodeApi);
rout.all("/api/auth/:type", Auth);
rout.all("/api/wx/:type",WX)

export default rout;
