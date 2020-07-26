import Event from "../event/index";
import { userSetup, Terminal } from "uart";
// 格式化cookie-token
export const parseToken = (token: string) => {
  return token.replace(/(bearer)/, "").trim();
};

// 通过DevMac获取设备的信息和绑定用户
export const getDtuInfo = (DevMac: string) => {
  const User = Event.Cache.CacheBindUart.get(DevMac);
  if (User) {
    return {
      terminalInfo: Event.Cache.CacheTerminal.get(DevMac) as Terminal,
      userInfo: Event.Cache.CacheUserSetup.get(User) as userSetup
    };
  } else {
    return false;
  }
};
