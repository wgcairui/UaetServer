import Event from "../event/index";

export default (unit: string): { [x in number]: string } => {
    const Cache = Event.Cache.CacheParseUnit
    if (Cache.has(unit)) {
        return Cache.get(unit) as { [x in number]: string }
    } else {
        const arr = unit
            .replace(/(\{|\}| )/g, "")
            .split(",")
            .map(el => el.split(":"))
            .map(el => ({ [Number(el[0])]: el[1] }));
        const obj = Object.assign({}, ...arr)
        Cache.set(unit, obj)
        return obj
    }
}