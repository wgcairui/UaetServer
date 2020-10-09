import { createDecipheriv } from "crypto";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { wxRequest, wxRequestAccess_token, wxRequestCode2Session, wxsubscribeMessage } from "uart";
const wxSecret = require("../key/wxSecret.json");

// 微信解密数据
class WX {
  appid: string;
  secret: string;
  AccessToken: string;
  constructor() {
    this.appid = wxSecret.appid;
    this.secret = wxSecret.secret
    this.AccessToken = ''
  }
  // 获取AccessToken
  async get_AccessToken() {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appid}&secret=${this.secret}`
    const { access_token, expires_in } = await this.fecth<wxRequestAccess_token>({ url, method: 'GET' })
    this.AccessToken = access_token
    console.log(`weixin AccessToken ：：${this.AccessToken}`);

    setTimeout(() => {
      this.get_AccessToken()
    }, expires_in || 7200 - 500)

  }


  // 获取用户openid
  async UserOpenID(code: string) {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${this.appid}&secret=${this.secret}&js_code=${code}&grant_type=authorization_code`;
    return await this.fecth<wxRequestCode2Session>({ url, method: 'GET' })
  }

  // 发送订阅消息
  async SendsubscribeMessageDevAlarm(UserOpenID: string, time: string, content: string, Devname: string, DevId: string, Alarmtype: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${this.AccessToken}`
    const postData: wxsubscribeMessage = {
      touser: UserOpenID,
      template_id: '8NX6ji8ABlNAOEMcU7v2jtD4sgCB7NMHguWzxZn3HO4',
      data: {
        date1: {
          value: time
        },
        thing2: {
          value: content
        },
        thing3: {
          value: Devname
        },
        character_string4: {
          value: DevId
        },
        thing6: {
          value: Alarmtype
        }
      }
    }
    const res = await axios.post<any, AxiosResponse<wxRequest>>(url, postData)
    return await this.fecth({ url, method: 'POST', data: postData })

  }
  // 解密微信加密数据
  BizDataCryptdecryptData(SessionKey: string, encryptedData: string, iv: string) {
    const sessionKey = Buffer.from(SessionKey, "base64");
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
  private async fecth<T extends wxRequest>(config: AxiosRequestConfig) {
    const res: AxiosResponse<T> = await axios(config);
    if (res.data.errcode) {
      throw new Error(res.data.errmsg);
    } else
      return res.data;
  }
}

export default new WX()
