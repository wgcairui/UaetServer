const crc16modbus = require("crc").crc16modbus;

class Tool {
  // 生成modbus16校验码
  static Crc16modbus(address, ins) {
    const body = address.toString(16).padStart(2, "0") + ins;
    const crc = crc16modbus(Buffer.from(body, "hex"))
      .toString(16)
      .padStart(4, "0");
    const [a, b, c, d] = [...crc];
    return body + c + d + a + b;
  }
  static InsertString(t, c, n) {
    const r = [];
    for (let i = 0; i * 2 < t.length; i++) {
      r.push(t.substr(i * 2, n));
    }
    return r.join(c);
  }
  // 填充字符串数据
  static FillString(t, c, n, b) {
    if (t === "" || c.length !== 1 || n <= t.length) return t;
    for (let i = 0; i < n - t.length; i++) {
      if (b === true) t = c + t;
      else t += c;
    }
    return t;
  }
  // 16进制转单精度浮点数
  static HexToSingle(t = Buffer.from([0, 0, 0, 0])) {
    if (t.byteLength !== 4) return 0;
    t = parseInt(t.toString("hex"), 16).toString(2);
    t = Tool.FillString(t, "0", 32, true);
    const s = t.substring(0, 1);
    let e = t.substring(1, 9);
    let m = t.substring(9);
    e = parseInt(e, 2) - 127;
    m = "1" + m;
    if (e >= 0) {
      m = m.substr(0, e + 1) + "." + m.substring(e + 1);
    } else {
      m = "0." + Tool.FillString(m, "0", m.length - e - 1, true);
    }
    if (!m.includes(".")) m = m + ".0";

    const a = m.split(".");
    const mi = parseInt(a[0], 2);
    let mf = 0;
    for (let i = 0; i < a[1].length; i++) {
      mf += parseFloat(a[1].charAt(i)) * 2 ** -(i + 1);
    }
    m = parseInt(mi) + parseFloat(mf);
    if (s === 1) m = 0 - m;

    return Number.parseFloat(m.toFixed(2));
  }
  // 单精度浮点数转Hex
  static SingleToHex(t = 0) {
    if (t === "") return "";
    t = parseFloat(t);
    if (isNaN(t) === true) return "Error";
    if (t === 0) return "00000000";
    let s, e, m;
    if (t > 0) s = 0;
    else {
      s = 1;
      t = 0 - t;
    }
    m = t.toString(2);
    if (m >= 1) {
      if (!m.includes(".")) m = m + ".0";
      e = m.indexOf(".") - 1;
    } else e = 1 - m.indexOf("1");

    if (e >= 0) m = m.replace(".", "");
    else m = m.substring(m.indexOf("1"));

    if (m.length > 24) m = m.substr(0, 24);
    else m = Tool.FillString(m, "0", 24, false);

    m = m.substring(1);
    e = (e + 127).toString(2);
    e = Tool.FillString(e, "0", 8, true);
    let r = parseInt(s + e + m, 2).toString(16);
    r = Tool.FillString(r, "0", 8, true);
    return Buffer.from(r, "hex");
  }
  // 整数转高低字节
  static Value2BytesInt16(str = 0) {
    const arr = [];
    // 创建一个空buffer，
    const buffer = Buffer.alloc(2);
    // 写入一个有符号的 16 位整数值，可以是负数
    buffer.writeInt16BE(Number.parseInt(str));
    // 转换为高低字节，封装为字节数组
    buffer.forEach((el) => arr.push(el));
    return arr;
  }
}
module.exports = Tool;
