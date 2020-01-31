"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const EnvironmentalControl_1 = require("./EnvironmentalControl");
EnvironmentalControl_1.EcTerminal.update({ ECid: "mac0101002545" }, { name: "雷迪司户外柜", model: "w220k" }, { upsert: true })
    .then((res) => console.log(res))
    .catch((e) => console.log(e));
