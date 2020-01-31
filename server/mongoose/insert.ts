/* eslint-disable no-console */
import { EcTerminal } from "./EnvironmentalControl";

EcTerminal.update(
  { ECid: "mac0101002545" },
  { name: "雷迪司户外柜", model: "w220k" },
  { upsert: true }
)
  .then((res: any) => console.log(res))
  .catch((e: any) => console.log(e));
