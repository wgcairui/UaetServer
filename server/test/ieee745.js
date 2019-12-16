const tool = require("../bin/tool");

const buffer = Buffer.from("436499A0", "hex");
console.log(buffer);

const flot = tool.flot(buffer, 1, 4);
console.log(flot);
