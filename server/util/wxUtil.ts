import { createDecipheriv } from "crypto";
const wxSecret = require("../key/wxSecret.json");

// 微信解密数据
export class WXBizDataCrypt {
  sessionKey: string;
  appid: string;
  constructor(sessionKey: string) {
    this.sessionKey = sessionKey;
    this.appid = wxSecret.appid;
  }

  decryptData(encryptedData: string, iv: string) {
    const sessionKey = Buffer.from(this.sessionKey, "base64");
    const BufferEncryptedData = Buffer.from(encryptedData, "base64");
    const BufferIv = Buffer.from(iv, "base64");
    let decodeParse;
    try {
      // 解密
      const decipher = createDecipheriv(
        "aes-128-cbc",
        sessionKey,
        BufferIv
      );
      // 设置自动 padding 为 true，删除填充补位
      decipher.setAutoPadding(true);
      const decode = decipher.update(BufferEncryptedData, "binary", "utf8");
      const decode2 = decode + decipher.final("utf8");

      decodeParse = JSON.parse(decode2);
    } catch (error) {
      throw new Error("Illegal Buffer");
    }

    if (decodeParse.watermark.appid !== this.appid) {
      throw new Error("Illegal Buffer");
    }
    return decodeParse;
  }
}
