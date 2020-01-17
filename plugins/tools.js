/* eslint-disable no-console */
// 把{name:"ss",value:"5"}转换为{ss:5}
export const TerminalResultArrayToJson = (Arr = [{}]) => {
  const o = {};
  Arr.forEach((el) => (o[el.name] = el.value));
  return o;
};

// 把[{name:"ss",value:"5"},{name:"aa",value:"5"}] 转换{aa:5,ss:5}
export const TerminalResultArrayToArrayJson = (Arr = [{}], col = "") => {
  let val = "";
  return Arr.reduce((pre, cu) => {
    const { result, time } = cu;
    const { value } = result.find((el) => el.name === col);
    if (value && value !== val) {
      return [{ time: paresTime(time), [col]: value }, ...pre];
    }
    val = value;
  }, []);
};
// 格式化日期时间
export const paresTime = (time) => {
  const T = new Date(time);
  return `${T.getMonth() +
    1}/${T.getDate()} ${T.getHours()}:${T.getMinutes()}:${T.getSeconds()}`;
};
// 把vue data对象转换为普通JSON
export const parseJsonToJson = (JSON = {}) => {
  const newJson = {};
  Object.keys(JSON).forEach((el) => (newJson[el] = JSON[el]));
  return newJson;
};
