const Ieee754 = require("ieee754");
const crc16modbus = require("crc").crc16modbus;

class Tool {
  static flot(Buffer, offset, nBytes) {
    return Ieee754.read(Buffer, offset, true, 52, nBytes);
  }
  static Crc16modbus(address, ins) {
    const body = address.toString(16).padStart(2, "0") + ins;
    const crc = crc16modbus(Buffer.from(body, "hex"))
      .toString(16)
      .padStart(4, "0");
    const [a, b, c, d] = [...crc];
    return body + c + d + a + b;
  }
}
module.exports = Tool;
