/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const tool = require("../bin/tool");

const buf = Buffer.from([254, 3]);

console.log(buf);
console.log(buf.slice(0, 1));

console.log(buf.slice(0, 1).readUInt8());
