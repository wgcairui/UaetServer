/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const tool = require("../bin/tool");

const buffer = Buffer.from([255, -99]);

console.log(buffer);
/* 
const flot = tool.flot(buffer, 1, 3);
console.log(flot);

console.log(Buffer.from(40.42)); */
console.log(buffer.readInt16BE());

const a = Buffer.alloc(2);
console.log(a);
a.writeInt16BE(120);
console.log(a.slice(0, 2));

console.log(a.readInt16BE());
