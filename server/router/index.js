const Rout = require("koa-router");
const rout = new Rout();
const nodeApi = require("./node");

rout.post("/Api/Node/:type", nodeApi);

module.exports = rout;
