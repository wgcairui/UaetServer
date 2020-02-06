/* eslint-disable no-console */
// 把{name:"ss",value:"5"}转换为{ss:5}
interface obj {
  [propName:string]:any
}
export const TerminalResultArrayToJson: obj = (Arr: obj[]) => {
  const o: obj = {};
  Arr.forEach((el) => (o[el.name] = el.value));
  return o;
};

// 把[{name:"ss",value:"5"},{name:"aa",value:"5"}] 转换{aa:5,ss:5}
/* export const TerminalResultArrayToArrayJson = (
  Arr: queryResult[],
  col = ""
) => {
  let val = "";
  return Arr.reduce(
    (pre: { time: string; [s: string]: string }[] | undefined, cu) => {
      const { result, time } = cu;
      const r = result.find((el) => el.name === col);
      if (r && r.value && r.value !== val && pre) {
        return [{ time: paresTime(<string>time), [col]: r.value }, ...pre];
      }
      if (r) val = r.value;
    },
    []
  );
}; */
// 格式化日期时间
export const paresTime = (time: string | number | Date): string => {
  const T = new Date(time);
  return `${T.getMonth() +
    1}/${T.getDate()} ${T.getHours()}:${T.getMinutes()}:${T.getSeconds()}`;
};
// 把vue data对象转换为普通JSON

export function parseJsonToJson<T>(jsons:T):T{
  return jsons
  /* const target = new (<any>jsons).constructor()
  const objKeys = Object.keys(jsons)
  const newJson:T = new Object()
  const objs = Object.entries(jsons)
  .forEach((el) => (newJson[el] = jsons[el]));
  return newJson; */
};
