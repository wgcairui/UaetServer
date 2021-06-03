import { createDecipheriv } from "crypto";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { Tokens, Users, WxUsers } from "../mongoose";

const wxSecret = require("../key/wxSecret.json");



/**
 * 微信小程序服务端api
 */
class WX {
  /**
   * 小程序id
   */
  appid: string;
  /**
   * 小程序密匙
   */
  secret: string;
  /**
   * 小程序access
   */
  AccessToken: string;
  /**
   * 服务号id
   */
  appidPublic: any;
  /**
   * 服务号密匙
   */
  secretPublic: any;
  /**
   * 服务号access
   */
  AccessTokenPublic: string;
  /**
   * 行业分类-大类
   */
  primary_industry_first: string;
  /**
   * 行业分类-二类
   */
  primary_industry_second: string;

  /**
   * 微信开放平台配置
   */
  Open: { web: { uart: { appid: any; secret: any; }; }; };

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

    //微信开放平台
    this.Open = {
      web: {
        uart: {
          appid: wxSecret.Open.web.uart.AppID,
          secret: wxSecret.Open.web.uart.AppSecret
        }
      }
    }

    this.start()
  }

  start() {
    this.CreateMeunPublic()
  }

  /**
   * wx网页登录
   * @param code 
   */
  async web_login(code: string) {
    const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.Open.web.uart.appid}&secret=${this.Open.web.uart.secret}&code=${code}&grant_type=authorization_code`
    const result = await this.fecth<Uart.WX.webLogin>({ url, method: "GET" })
    if (result.errcode) throw new Error(result.errmsg)
    // 获取微信用户信息
    const url2 = `https://api.weixin.qq.com/sns/userinfo?access_token=${result.access_token}&openid=${result.openid}`
    const result2 = await this.fecth<Uart.WX.webUserInfo>({ url: url2, method: "GET" })
    if (result2.errcode) throw new Error(result.errmsg)
    return result2
  }


  /**
  * @method 获取AccessToken
  * @returns viod
   */
  async get_AccessToken() {
    // 雷迪司透传平台accessToken
    const token = await Tokens.findOne({ type: 'wxapp' });
    // 如果有token和token未失效
    if (token && (token.expires * 1000) > (Date.now() - token.creatTime) + 5000) {
      this.AccessToken = token.token
    } else {
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appid}&secret=${this.secret}`
      const { access_token, expires_in } = await this.fecth<Uart.WX.wxRequestAccess_token>({ url, method: 'GET' })
      this.AccessToken = access_token
      console.log(`weixin AccessToken ：：${this.AccessToken},expires_in:${expires_in}`);
      Tokens.updateOne({ type: 'wxapp' }, { $set: { token: access_token, expires: expires_in, creatTime: Date.now() } }, { upsert: true }).exec()
    }
    return this.AccessToken
  }


  /**
   * 获取ladis公众号accessToken
   */
  async get_AccessTokenPublic() {
    const token = await Tokens.findOne({ type: 'wxPublic' });
    // 如果有token和token未失效
    if (token && (token.expires * 1000) > (Date.now() - token.creatTime) + 5000) {
      this.AccessTokenPublic = token.token
    } else {
      const urlpublic = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appidPublic}&secret=${this.secretPublic}`
      const { access_token, expires_in } = await this.fecth<Uart.WX.wxRequestAccess_token>({ url: urlpublic, method: 'GET' })
      this.AccessTokenPublic = access_token
      console.log(`weixin AccessToken_Public ：：${this.AccessTokenPublic},expires_in:${expires_in}`);
      Tokens.updateOne({ type: 'wxPublic' }, { $set: { token: access_token, expires: expires_in, creatTime: Date.now() } }, { upsert: true }).exec()

      const industryUrl = `https://api.weixin.qq.com/cgi-bin/template/get_industry?access_token=${this.AccessTokenPublic}`
      const { primary_industry, secondary_industry } = await this.fecth<Uart.WX.wxRequest_industry>({ url: industryUrl, method: "GET" })
      this.primary_industry_first = primary_industry.first_class
      this.primary_industry_second = primary_industry.second_class
    }
    return this.AccessTokenPublic
  }


  /**
   * @method weapp 获取用户openid
   * @param code 
   */
  async UserOpenID(code: string) {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${this.appid}&secret=${this.secret}&js_code=${code}&grant_type=authorization_code`;
    await this.get_AccessToken()
    return await this.fecth<Uart.WX.wxRequestCode2Session>({ url, method: 'GET' })
  }


  /**
   * 创建公众号自定义菜单
   */
  public async CreateMeunPublic() {
    const menu: Uart.WX.menu = {
      button: [
        {
          name: '雷迪司',
          sub_button: [
            {
              type: 'view',
              name: '关于我们',
              url: 'http://www.ladis.com.cn/about/index.shtml'
            },
            {
              type: 'view',
              name: '加入我们',
              url: 'http://www.ladis.com.cn/join/node_34.shtml'
            },
            {
              type: 'view',
              name: '联系方式',
              url: 'http://www.ladis.com.cn/about/node_33.shtml'
            },
            {
              type: 'view',
              name: '服务网络',
              url: 'http://www.ladis.com.cn/about/node_37.shtml'
            },
            {
              type: 'view',
              name: '经销网点',
              url: 'http://www.ladis.com.cn/about/node_53.shtml'
            }
          ]
        },
        {
          name: '技术支持',
          sub_button: [
            {
              type: 'view',
              name: '软件问题',
              url: 'http://www.ladis.com.cn/support/node_119.shtml'
            },
            /* {
              type: 'view_limited',
              name: 'UPS安装图',
              media_id:''
            }, */
            {
              type: 'view',
              name: '智能顾问',
              url: 'https://cschat-ccs.aliyun.com/index.htm?tntInstId=_1DER4Qq&scene=SCE00003943'
            }
          ]
        },
        {
          name: '微站',
          sub_button: [
            {
              type: 'view',
              name: '微官网',
              url: 'http://www.ladis.com.cn'
            },
            {
              type: 'view',
              name: '产品中心',
              url: 'http://www.ladis.com.cn/products/index.shtml'
            },
            {
              type: 'view',
              name: '云监控平台',
              url: 'http://www.pesiv.com'
            },
            {
              type: 'view',
              name: '网上展厅',
              url: 'http://www.ladis.com.cn/pic/quanjingjifang/'
            },
            {
              type: 'miniprogram',
              name: '云平台',
              appid: 'wx38800d0139103920',
              pagepath: 'pages/index/index',
              url: 'https://uart.ladishb.com'
            }
          ]
        }
      ]
    }

    const url = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${await this.get_AccessTokenPublic()}`
    return await this.fecth<Uart.WX.wxRequest>({ url, method: 'POST', data: menu })
  }


  /**
   * @method 发送模板消息-设备告警-雷迪司公众号-智能设备报警提醒
   * @param UserOpenID appid
   * @param time 时间
   * @param content 事件
   * @param Devname 设备名称
   * @param DTUname dtu名称
   * @param Alarmtype 告警类型
   */
  async SendsubscribeMessageDevAlarmPublic(UserOpenID: string, time: string | number, content: string, Devname: string, DTUname: string, Alarmtype: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${await this.get_AccessToken()}`
    const postData: Uart.WX.wxsubscribeMessage = {
      touser: UserOpenID,
      template_id: 'rIFS7MnXotNoNifuTfFpfh4vFGzCGlhh-DmWZDcXpWg',
      miniprogram: {
        "appid": "wx38800d0139103920",
        pagepath: 'pages/index/index',
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
      }
    }
    return await this.fecth<Uart.WX.wxRequest>({ url, method: 'POST', data: postData })
  }

  /**
   * 获取公众号用户信息
   * @param wxId 用户id
   */
  async getUserInfoPublic(wxId: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${await this.get_AccessTokenPublic()}&openid=${wxId}&lang=zh_CN`
    return await this.fecth<Uart.WX.userInfoPublic>({ url, method: "GET" })
  }

  /**
   * 批量获取公众号用户信息
   * @param wxIds 用户id
   */
  async getUserInfosPublic(wxIds: string[]) {
    const url = `POST https://api.weixin.qq.com/cgi-bin/user/info/batchget?access_token=${await this.get_AccessTokenPublic()}`
    const data = {
      user_list: wxIds.map(el => ({
        openid: el,
        lang: "zh_CN"
      }))
    }
    return await this.fecth<{ user_info_list: Uart.WX.userInfoPublic[] } & Uart.WX.wxRequest>({ url, data, method: "POST" })
  }

  /**
   * 获取关注用户列表
   * @param next_openid 第一个拉取的OPENID，不填默认从头开始拉取
   */
  private async getUserlistPublic(next_openid?: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/user/get?access_token=${await this.get_AccessTokenPublic()}${next_openid ? `&next_openid=${next_openid}` : ''}`
    return await this.fecth<Uart.WX.userlistPublic>({ url, method: "GET" })
  }

  /**
   * 聚合公众号用户
   */
  async countUserListPublic() {
    const data = await this.getUserlistPublic()
    const r = { total: data.total, list: data.data.openid }
    let next = data.next_openid
    if (data.total > 10000) {
      for (let index = 1; index * 10000 < data.total; index++) {
        const { data: { openid } } = await this.getUserlistPublic(next)
        r.list.concat(openid)
      }
    }
    r.list = [...new Set(r.list)]
    return r
  }

  /**
   * 获取所有用户信息,保存到数据库
   * @param openId 用户id,没有则查询所有的关注用户
   */
  async saveUserInfo(openId?: string) {
    const users = [] as Uart.WX.userInfoPublic[]
    if (openId) {
      const user = await this.getUserInfoPublic(openId)
      users.push(user)
    } else {
      const { total, list } = await this.countUserListPublic()
      for (let index = 0; index < total; index + 100) {
        const ids = list.slice(index, index + 100)
        const { errcode, user_info_list } = await this.getUserInfosPublic(ids)
        if (user_info_list) {
          users.concat(user_info_list)
        }
      }
    }
    users.forEach(el => {
      if (el.unionid) {
        WxUsers.updateOne({ unionid: el.unionid }, el, { upsert: true }).exec()
        Users.updateOne({ userId: el.unionid }, { $set: { wxId: el.openid } }).exec()
      }
    })
  }

  /**
   * 删除wx用户信息
   * @param openId 
   */
  async deleteUserInfo(openId: string) {
    WxUsers.deleteOne({ openId }).exec()
    Users.updateOne({ wxId: openId }, { $set: { wxId: '' } }).exec()
  }

  /**
   * 获取参数公众号二维码ticket,绑定账号
   * https://developers.weixin.qq.com/doc/offiaccount/Account_Management/Generating_a_Parametric_QR_Code.html
   * @param user 
   */
  async getTicketPublic(user: string) {
    const info = await Users.findOne({ user })
    const url = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${await this.get_AccessTokenPublic()}`
    const data = {
      expire_seconds: 360,
      action_name: "QR_STR_SCENE",
      action_info: { "scene": { "scene_str": info?._id || '' } },
      "scene_str": "binduser",
      scene_id: 520
    }
    return await this.fecth<Uart.WX.ticketPublic>({ url, data, method: "POST" })
  }
  /**
     * 获取参数小程序二维码ticket,绑定账号
     * https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/qr-code/wxacode.getUnlimited.html
     * @param user 
     */
  async getTicket(user: string) {
    const info = await Users.findOne({ user })
    const access_token = await this.get_AccessToken()
    const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${access_token}`
    const data = {
      //access_token,
      scene: info?._id || '',
      page: "pages/index/index"
    }
    return await this.fecth({ url, data, method: "POST", responseType: "arraybuffer" })
  }
  /**
   * 获取永久素材的列表
   * @param type 素材的类型，图片（image）、视频（video）、语音 （voice）、图文（news）
   * @param offset 从全部素材的该偏移位置开始返回，0表示从第一个素材 返回
   * @param count 返回素材的数量，取值在1到20之间
   */
  async get_materials_list_Public(opt?: { type?: "image" | "video" | "voice" | "news", offset?: number, count?: number }) {
    const opts = Object.assign({ type: 'news', offset: 0, count: 20 }, opt)
    const url = `https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=${await this.get_AccessTokenPublic()}`
    return await this.fecth<Uart.WX.materials_list>({ url, data: opts, method: "POST" })
  }

  /**
   * @method 发送订阅消息-设备告警
   * @param UserOpenID 
   * @param time 
   * @param content 
   * @param Devname 
   * @param DevId 
   * @param Alarmtype 
   */
  async SendsubscribeMessageDevAlarm(UserOpenID: string, time: string | number, content: string, Devname: string, DevId: string, Alarmtype: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${await this.get_AccessToken()}`
    const postData: Uart.WX.wxsubscribeMessage = {
      touser: UserOpenID,
      template_id: '8NX6ji8ABlNAOEMcU7v2jtD4sgCB7NMHguWzxZn3HO4',
      page: "/pages/index/alarm/alarm",
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

    return await this.fecth({ url, method: 'POST', data: postData })
  }


  /**
   * @method 发送订阅消息-用户注册
   * @param UserOpenID 
   * @param user 
   * @param name 
   * @param time 
   * @param tip 
   * @callback 返回发送订阅之后的状态
   */
  async SendsubscribeMessageRegister(UserOpenID: string, user: string, name: string, time: string, tip: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${await this.get_AccessToken()}`
    const postData: Uart.WX.wxsubscribeMessage = {
      touser: UserOpenID,
      template_id: 'XPN75P-0F3so8dE__e5bxS9xznCyNGx4TKX0Fl-i_b4',
      page: "/pages/index/index",
      data: {
        character_string1: {
          value: user
        },
        name2: {
          value: name.replace(/[0-9]/g, '*')
        },
        date3: {
          value: this._formatTime(time)
        },
        thing8: {
          value: tip
        }
      }
    }
    return await this.fecth({ url, method: 'POST', data: postData })
  }


  /**
   * @method 解密微信加密数据
   * @param SessionKey seccess 
   * @param encryptedData 加密数据
   * @param iv 
   * @returns 返回解密之后的对象
   */
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
      ) as any
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


  /**
   * 
   * @method 请求小程序url Scheme码
   * @param query {path:小程序路径,query:请求参数}
   * @host https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/url-scheme/urlscheme.generate.html
   */

  public async urlScheme(query: Pick<Uart.WX.urlScheme, "jump_wxa">) {
    const url = `https://api.weixin.qq.com/wxa/generatescheme`
    const data: Uart.WX.urlScheme = {
      access_token: await this.get_AccessToken(),
      is_expire: true,
      expire_time: 1606737600,
      jump_wxa: query.jump_wxa
    }
    return this.fecth<Uart.WX.urlSchemeRequest>({ url, method: "POST", data })
  }

  /**
   * 把时间转换为标准格式
   * @param time 
   */
  private _formatTime(time: string | number | undefined) {
    const times = time ? new Date(time) : new Date()
    // 生产环境在docker,时间是漂亮国时间,换算成中国+8小时
    if (process.env.NODE_ENV === 'production') {
      times.setHours(times.getHours() + 8)
    }
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
