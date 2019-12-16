const Ieee754 = require("ieee754");

class Tool {
  static flot(Buffer, offset, nBytes) {
    return Ieee754.read(Buffer, offset, true, 52, nBytes);
  }
}

module.exports = Tool;
