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
    console.log(`weixin AccessToken ：：${this.AccessToken},expires_in:${expires_in}`);

    setTimeout(() => {
      this.get_AccessToken()
    }, ((expires_in || 7200) * 1000) - 10000)

  }


  // 获取用户openid
  async UserOpenID(code: string) {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${this.appid}&secret=${this.secret}&js_code=${code}&grant_type=authorization_code`;
    return await this.fecth<wxRequestCode2Session>({ url, method: 'GET' })
  }

  // 发送订阅消息-设备告警
  async SendsubscribeMessageDevAlarm(UserOpenID: string, time: string | number, content: string, Devname: string, DevId: string, Alarmtype: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${this.AccessToken}`
    const postData: wxsubscribeMessage = {
      touser: UserOpenID,
      template_id: '8NX6ji8ABlNAOEMcU7v2jtD4sgCB7NMHguWzxZn3HO4',
      page: "/pages/index/index",
      data: {
        date1: {
          value: this._formatTime(time)
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
    //const res = await axios.post<any, AxiosResponse<wxRequest>>(url, postData)
    return await this.fecth({ url, method: 'POST', data: postData })
  }
  // 发送订阅消息-设备告警
  async SendsubscribeMessageRegister(UserOpenID: string, user: string, name: string, time: string, tip: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${this.AccessToken}`
    const postData: wxsubscribeMessage = {
      touser: UserOpenID,
      template_id: 'XPN75P-0F3so8dE__e5bxS9xznCyNGx4TKX0Fl-i_b4',
      page: "/pages/index/index",
      data: {
        character_string1: {
          value: user
        },
        name2: {
          value: name
        },
        date3: {
          value: this._formatTime(time)
        },
        thing8: {
          value: tip
        }
      }
    }
    //const res = await axios.post<any, AxiosResponse<wxRequest>>(url, postData)
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
  // 把时间转换为标准格式
  private _formatTime(time: string | number | undefined) {
    const times = time ? new Date(time) : new Date()
    const year = times.getFullYear()
    const month = times.getMonth() + 1
    const day = times.getDate()
    const hour = times.getHours()
    const min = times.getMinutes()
    const sen = times.getSeconds()
    return `${year}-${month}-${day} ${hour}:${min}:${sen}`
  }
  private async fecth<T extends wxRequest>(config: AxiosRequestConfig) {
    // console.log(config);
    const res: AxiosResponse<T> = await axios(config)
    if (res.data.errcode) {
      throw new Error(res.data.errmsg);
    } else
      return res.data;
  }
}

export default new WX()
