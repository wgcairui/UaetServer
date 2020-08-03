import Event from "../event/index";

export default (regx: string): [number, number] => {
  const CacheParseRegx = Event.Cache.CacheParseRegx;
  if (CacheParseRegx.has(regx)) {
    return CacheParseRegx.get(regx) as [number, number];
  } else {
    const [start,end] = regx.split("-").map(el => parseInt(el))
    CacheParseRegx.set(regx, [start,end]);
    return [start,end];
  }
};
