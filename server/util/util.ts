import Event from "../event/index";
import { userSetup, Terminal, UserInfo } from "uart";
// 格式化cookie-token
export const parseToken = (token: string) => {
  return token.replace(/(bearer)/, "").trim();
};

// 通过DevMac获取设备的信息和绑定用户
export const getDtuInfo = (DevMac: string) => {
  const User = Event.Cache.CacheBindUart.get(DevMac) as string
  return {
    terminalInfo: Event.Cache.CacheTerminal.get(DevMac) as Terminal,
    userInfo: Event.Cache.CacheUserSetup.get(User) as userSetup,
    user:Event.Cache.CacheUser.get(User) as UserInfo
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
