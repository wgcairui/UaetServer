import { Uart } from "typing";
import Event from "../event/index";
import config from "../config";
// 格式化cookie-token
export const parseToken = (token: string) => {
  return token.replace(/(bearer)/, "").trim();
};

export const parseTime = (time?: string | number | Date) => {
  if (time) {
    const date = new Date(time)
    const h = date.getHours()
    const m = date.getMinutes()
    const s = date.getSeconds()
    return `${date.toLocaleDateString()} ${h}:${m}:${s}`
  }
  else return ''
}

// 通过DevMac获取设备的信息和绑定用户
export const getDtuInfo = (DevMac: string) => {
  const User = Event.Cache.CacheBindUart.get(DevMac) as string
  return {
    terminalInfo: Event.Cache.CacheTerminal.get(DevMac) as Uart.Terminal,
    userInfo: Event.Cache.CacheUserSetup.get(User) as Uart.userSetup,
    user: Event.Cache.CacheUser.get(User) as Uart.UserInfo
  }
};

// 获取用户绑定设备
export const getUserBindDev = (user: string) => {
  const BindDevs: string[] = []
  Event.Cache.CacheBindUart.forEach((val, key) => {
    if (val === user) BindDevs.push(key)
  })
  return BindDevs
}
// 检测用户是否越权操作
export const validationUserPermission = (user: string, mac: string | string,) => {
  const users = Event.Cache.CacheUser.get(user)
  if (users) {
    if (users.userGroup !== 'user') return true
    else {
      const binds = new Set([...getUserBindDev(user), ...config.vmDevs])
      return binds.size > config.vmDevs.length && Array.isArray(mac) ? mac.every(el => binds.has(el)) : binds.has(mac)
    }
  } else return false

}
