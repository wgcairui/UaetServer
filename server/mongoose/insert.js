/* eslint-disable no-console */
const { EcTerminal } = require("./EnvironmentalControl");

EcTerminal.update(
  { ECid: "mac0101002545" },
  { name: "雷迪司户外柜", model: "w220k" },
  { upsert: true }
)
  .then((res) => console.log(res))
  .catch((e) => console.log(e));
