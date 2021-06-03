import { mongoose, Schema } from "./index";
import { Schema_DevConstant } from "./DeviceParameterConstant";


// 用户信息
const Schema_Users = new Schema({
  avanter: String,
  rgtype: {
    type: String,
    enum: ['wx', 'web', 'app'],
    default: 'web'
  },
  userId: String,
  name: String,
  user: { type: String, index: true, trim: true, required: true, unique: true },
  userGroup: {
    type: String,
    enum: ["root", "admin", "user"],
    trim: true,
    default: "user"
  },
  passwd: String,
  mail: String,
  company: String,
  tel: String,
  creatTime: { type: Date, default: new Date() },
  modifyTime: { type: Date, default: null },
  address: String,
  status: { type: Boolean, default: true },
  messageId: String,
  wpId: String,
  wxId: String,
  openId: String
})

// 用户绑定设备
const SchemaUserBindDevice = new Schema({
  user: String,
  ECs: [String],
  UTs: [String]
});

// 用户聚合设备
const SchemaUserAggregation = new Schema({
  user: String,
  id: String,
  name: String,
  aggregations: [
    new Schema({
      DevMac: { type: String, required: true },
      name: { type: String, required: true },
      Type: { type: String, required: true },
      mountDev: { type: String, required: true },
      protocol: { type: String, required: true },
      pid: { type: Number, default: 0 }
    }, { _id: false })
  ]
})

// 用户告警设备
const SchemaUserAlarmSetup = new Schema({
  user: String,
  tels: [String],
  mails: [String],
  ProtocolSetup: [Schema_DevConstant]
})

// 用户布局设置
const SchemaUserLayout = new Schema({
  user: String,
  type: String,
  id: String,
  bg: String,
  Layout: [
    new Schema({
      x: Number,
      y: Number,
      id: String,
      name: String,
      color: String,
      bind: {
        mac: String,
        pid: Number,
        name: String
      }

    }, { _id: false })
  ]
})

const SchemawxUser = new Schema({
  /**
             * 用户是否订阅该公众号标识，值为0时，代表此用户没有关注该公众号，拉取不到其余信息
             */
  "subscribe": Number,
  /**
   * 用户的标识，对当前公众号唯一
   */
  "openid": String,
  /**
   * 用户的昵称
   */
  "nickname": String,
  /**
   * 用户的性别，值为1时是男性，值为2时是女性，值为0时是未知
   */
  "sex": Number,
  /**
   * 用户的语言，简体中文为zh_CN
   */
  "language": String,
  /**
   * 用户所在城市
   */
  "city": String,
  /**
   * 用户所在省份
   */
  "province": String,
  /**
   * 用户所在国家
   */
  "country": String,
  /**
   * 用户头像，最后一个数值代表正方形头像大小（有0、46、64、96、132数值可选，0代表640*640正方形头像），用户没有头像时该项为空。若用户更换头像，原有头像URL将失效。
   */
  "headimgurl": String,
  /**
   * 用户关注时间，为时间戳。如果用户曾多次关注，则取最后关注时间
   */
  "subscribe_time": Number,
  /**
   * 只有在用户将公众号绑定到微信开放平台帐号后，才会出现该字段。
   */
  "unionid": String,
  /**
   * 公众号运营者对粉丝的备注，公众号运营者可在微信公众平台用户管理界面对粉丝添加备注
   */
  "remark": String,
  /**
   * 用户所在的分组ID（兼容旧的用户分组接口）
   */
  "groupid": Number,
  /**
   * 户被打上的标签ID列表
   */
  "tagid_list": [Number],
  /**
   * 返回用户关注的渠道来源，ADD_SCENE_SEARCH 公众号搜索，ADD_SCENE_ACCOUNT_MIGRATION 公众号迁移，ADD_SCENE_PROFILE_CARD 名片分享，ADD_SCENE_QR_CODE 扫描二维码，ADD_SCENE_PROFILE_LINK 图文页内名称点击，ADD_SCENE_PROFILE_ITEM 图文页右上角菜单，ADD_SCENE_PAID 支付后关注，ADD_SCENE_WECHAT_ADVERTISEMENT 微信广告，ADD_SCENE_OTHERS 其他
   */
  "subscribe_scene": String,
  "qr_scene": Number,
  "qr_scene_str": String
}, { timestamps: true })

const WxUsers = mongoose.model<Uart.WX.userInfoPublic & mongoose.Document>('user.wxPubilc', SchemawxUser)

const Users = mongoose.model<Uart.UserInfo & mongoose.Document>("users", Schema_Users);
const UserBindDevice = mongoose.model<Uart.BindDevice & mongoose.Document>("User.BindDevice", SchemaUserBindDevice);
const UserAlarmSetup = mongoose.model<Uart.userSetup & mongoose.Document>("user.AlarmSetup", SchemaUserAlarmSetup)
const UserAggregation = mongoose.model<Uart.Aggregation & mongoose.Document>("user.aggregation", SchemaUserAggregation)
const UserLayout = mongoose.model<Uart.userLayout & mongoose.Document>("user.Layout", SchemaUserLayout)
export { WxUsers, Users, UserBindDevice, UserAlarmSetup, UserAggregation, UserLayout };
