
import { SecretApp, Tokens, Users, WxUsers } from "../mongoose";
import { wxApp, wxOpen, wxPublic } from "@cairui/wx-sdk"
import axios, { AxiosRequestConfig } from "axios";
/**
 * 微信小程序服务端api
 */
class WX {
  // 公众号对象
  mp!: wxPublic;
  // 小程序对象
  wp!: wxApp;
  // 开放平台对象
  op!: wxOpen;

  constructor() {
    this.start()
  }

  async start() {
    const mpSecret = await SecretApp.findOne({ type: 'wxmp' }).lean()
    this.mp = new wxPublic(mpSecret!.appid, mpSecret!.secret)

    const wpSecret = await SecretApp.findOne({ type: 'wxwp' }).lean()
    this.wp = new wxApp(wpSecret!.appid, wpSecret!.secret)

    const opSecret = await SecretApp.findOne({ type: 'wxopen' }).lean()
    this.op = new wxOpen(opSecret!.appid, opSecret!.secret)

    this.CreateMeunPublic()
  }

  /**
   * wx网页登录
   * @param code 
   */
  async web_login(code: string) {
    return await this.op.userInfo(code)
  }


  /**
   * @method weapp 获取用户openid
   * @param code 
   */
  async UserOpenID(code: string) {
    return await this.wp.UserOpenID(code)
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

    return await this.mp.CreateMeun(menu)
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

    const postData: Uart.WX.wxsubscribeMessage = {
      touser: UserOpenID,
      template_id: 'rIFS7MnXotNoNifuTfFpfh4vFGzCGlhh-DmWZDcXpWg',
      miniprogram: {
        appid: "wx38800d0139103920",
        pagepath: 'pages/index/index',
      },
      data: {
        first: {
          value: content,
          color: "#173177"
        },
        device: {
          value: `${DTUname}(${Devname})`,
          color: "#173177"
        },
        time: {
          value: this._formatTime(time),
          color: "#173177"
        },
        remark: {
          value: Alarmtype,
          color: "#173177"
        }
      }
    }
    return await this.mp.SendsubscribeMessageDevAlarm(postData)
  }



  /**
   * 获取公众号用户信息
   * @param wxId 用户id
   */
  async getUserInfoPublic(wxId: string) {
    return this.mp.getUserInfo(wxId)
  }

  /**
   * 批量获取公众号用户信息
   * @param wxIds 用户id
   */
  async getUserInfosPublic(wxIds: string[]) {
    return await this.mp.getUserInfos(wxIds)
  }

  /**
   * 获取所有用户信息,保存到数据库
   * @param openId 用户id,没有则查询所有的关注用户
   */
  async saveUserInfo() {
    const { users, code, count, time } = await this.mp.saveUserInfo()
    users.forEach(el => {
      if (el.unionid) {
        WxUsers.updateOne({ unionid: el.unionid }, el, { upsert: true }).exec()
        Users.updateOne({ userId: el.unionid }, { $set: { wxId: el.openid } }).exec()
      }
    })
    return { code, count, time }
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
   * @param id 用户数据表id
   */
  async getTicketPublic(id: string) {
    return await this.mp.getTicket(id)
  }
  /**
     * 获取参数小程序二维码ticket,绑定账号
     * https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/qr-code/wxacode.getUnlimited.html
     * @param id 用户数据表id
     */
  async getTicket(id: string) {
    return await this.wp.getTicket(id)
  }
  /**
   * 获取永久素材的列表
   * @param type 素材的类型，图片（image）、视频（video）、语音 （voice）、图文（news）
   * @param offset 从全部素材的该偏移位置开始返回，0表示从第一个素材 返回
   * @param count 返回素材的数量，取值在1到20之间
   */
  async get_materials_list_Public(opt?: { type?: "image" | "video" | "voice" | "news", offset?: number, count?: number }) {
    return await this.mp.get_materials_list_Public(opt)
  }

  /**
   * 查询普通消息用户输入的关键字
   * @param key 
   */
  async seach_user_keywords(key: string) {
    const url = `https://www.ladishb.com/site/api/routlinks?key=${encodeURI(key)}`
    const data = await axios.get(url).then(el => el.data).catch(() => []) as { rout: string, title: string }[]
    return data.length === 0 ? '' : `匹配到如下链接\n
    ${data.slice(0, 20).map(el => {
      return `<a href="https://www.ladishb.com${el.rout}">${el.title.slice(0, 12).trim()}...</a>\n\n`
    })}`.replace(/(\,|^ )/g, '')
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

    return await this.wp.SendsubscribeMessage(postData)
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
    return await this.wp.SendsubscribeMessage(postData)
  }


  /**
   * @method 解密微信加密数据
   * @param SessionKey seccess 
   * @param encryptedData 加密数据
   * @param iv 
   * @returns 返回解密之后的对象
   */
  BizDataCryptdecryptData(SessionKey: string, encryptedData: string, iv: string) {
    return this.mp.BizDataCryptdecryptData(SessionKey, encryptedData, iv)
  }


  /**
   * 
   * @method 请求小程序url Scheme码
   * @param query {path:小程序路径,query:请求参数}
   * @host https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/url-scheme/urlscheme.generate.html
   */

  public async urlScheme(query: Pick<Uart.WX.urlScheme, "jump_wxa">) {
    return await this.wp.urlScheme(query)
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
  
}

export default new WX()
