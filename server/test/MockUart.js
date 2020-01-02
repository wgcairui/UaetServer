/* eslint-disable no-console */
const axios = require("axios");
const tool = require("../bin/tool");

const data = () => {
  return {
    stat: "success",
    buffer: Buffer.from([
      0,
      3,
      4,
      ...tool.Value2BytesInt16(Math.random() * 200),
      ...tool.Value2BytesInt16(Math.random() * 890),
      44,
      33
    ]),
    mac: "866262045427977",
    type: 485,
    protocol: "温湿度1",
    content: "000300000002c5da"
  };
};
console.log(data());

setInterval(() => {
  axios
    .post("http://127.0.0.1:9010/Api/Node/UartData", { data: [data()] })
    .then(() => console.log("post success"));
}, 5000);
