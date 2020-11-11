import { createDecipheriv } from "crypto";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { Uart } from "typing";
import { Token, Tokens } from "../mongoose";
const wxSecret = require("../key/wxSecret.json");

// 微信解密数据
class WX {
  appid: string;
  secret: string;
  AccessToken: string;
  appidPublic: any;
  secretPublic: any;
  AccessTokenPublic: string;
  primary_industry_first: string;
  primary_industry_second: string;
  constructor() {
    this.appid = wxSecret.appid;
    this.secret = wxSecret.secret;
    this.appidPublic = wxSecret.appidPublic
    this.secretPublic = wxSecret.secretPublic
    this.AccessToken = ''
    this.AccessTokenPublic = ''
    // 主营行业
    this.primary_industry_first = '3' //{ first_class: 'IT科技', second_class: 'IT硬件与设备' }
    this.primary_industry_second = '4' //{ first_class: 'IT科技', second_class: '电子技术' }
  }
  // 获取AccessToken
  async get_AccessToken() {
    // 雷迪司透传平台accessToken
    const token = await Tokens.findOne({ type: 'wxapp' }).lean<Token>();
    // 如果有token和token未失效
    if (token && (token.expires * 1000) > (Date.now() - token.creatTime)+5000) {
      this.AccessToken = token.token
    } else {
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appid}&secret=${this.secret}`
      const { access_token, expires_in } = await this.fecth<Uart.WX.wxRequestAccess_token>({ url, method: 'GET' })
      this.AccessToken = access_token
      console.log(`weixin AccessToken ：：${this.AccessToken},expires_in:${expires_in}`);
      Tokens.updateOne({ type: 'wxapp' }, { $set: { token: access_token, expires: expires_in, creatTime: Date.now() } }, { upsert: true }).exec()
    }
    /* {
      if (process.env.NODE_ENV !== 'development') {
        
        setTimeout(() => {
          this.get_AccessToken()
        }, ((expires_in || 7200) * 1000) - 10000)
      }
    } */
    // 雷迪司公众号accessToken
    {
      /* const urlpublic = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appidPublic}&secret=${this.secretPublic}`
      const { access_token, expires_in } = await this.fecth<wxRequestAccess_token>({ url: urlpublic, method: 'GET' })
      this.AccessTokenPublic = access_token
      console.log(`weixin AccessToken_Public ：：${this.AccessTokenPublic},expires_in:${expires_in}`);
      setTimeout(() => {
        this.get_AccessToken()
      }, ((expires_in || 7200) * 1000) - 10000) */
      /* const industryUrl = `https://api.weixin.qq.com/cgi-bin/template/get_industry?access_token=${this.AccessTokenPublic}`
      const { primary_industry, secondary_industry } = await this.fecth<wxRequest_industry>({ url: industryUrl, method: "GET" })
      this.primary_industry_first = primary_industry.first_class
      this.primary_industry_second = primary_industry.second_class
      console.log(primary_industry, secondary_industry); */

    }
  }


  // 获取用户openid
  async UserOpenID(code: string) {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${this.appid}&secret=${this.secret}&js_code=${code}&grant_type=authorization_code`;
    await this.get_AccessToken()
    return await this.fecth<Uart.WX.wxRequestCode2Session>({ url, method: 'GET' })
  }

  // 发送订阅消息-设备告警-雷迪司公众号-智能设备报警提醒
  async SendsubscribeMessageDevAlarmPublic(UserOpenID: string, time: string | number, content: string, Devname: string, DTUname: string, Alarmtype: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${this.AccessTokenPublic}`
    const postData: Uart.WX.wxsubscribeMessage = {
      touser: UserOpenID,
      template_id: 'rIFS7MnXotNoNifuTfFpfh4vFGzCGlhh-DmWZDcXpWg',
      miniprogram: {
        "appid": "wx38800d0139103920"
      },
      data: {
        first: {
          value: content
        },
        device: {
          value: `${DTUname}(${Devname})`
        },
        time: {
          value: this._formatTime(time)
        },
        remark: {
          value: Alarmtype
        }
        /* date1: {
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
        } */
      }
    }
    //const res = await axios.post<any, AxiosResponse<wxRequest>>(url, postData)
    return await this.fecth({ url, method: 'POST', data: postData })
  }

  // 发送订阅消息-设备告警
  async SendsubscribeMessageDevAlarm(UserOpenID: string, time: string | number, content: string, Devname: string, DevId: string, Alarmtype: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${this.AccessToken}`
    const postData: Uart.WX.wxsubscribeMessage = {
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
    await this.get_AccessToken()
    return await this.fecth({ url, method: 'POST', data: postData })
  }
  // 发送订阅消息-用户注册
  async SendsubscribeMessageRegister(UserOpenID: string, user: string, name: string, time: string, tip: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${this.AccessToken}`
    const postData: Uart.WX.wxsubscribeMessage = {
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
    await this.get_AccessToken()
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
  private async fecth<T extends Uart.WX.wxRequest>(config: AxiosRequestConfig) {
    const res: AxiosResponse<T> = await axios(config)
    if (res.data.errcode) {
      console.log({ data: res.data, config });
    }
    return res.data;
  }
}

export default new WX()
