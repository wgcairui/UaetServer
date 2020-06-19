import axios from "axios";
const AmapKey = "0e99d0426f1afb11f2b95864ebd898d0"
const ApiAddress = "https://restapi.amap.com/v3/"

//const axios:NuxtAxiosInstance = Nuxtaxios
type restype = 'ip' | 'geocode/geo' | 'geocode/regeo' | 'assistant/coordinate/convert'

interface AmapResonp {
  status: string
  info: string
  infocode: string
}

interface AmapResonpIP extends AmapResonp {
  province: string
  city: string
  adcode: string
  rectangle: string
}

interface AmapResonpGeocodeGeo extends AmapResonp {
  "count": string
  "geocodes":
  {
    "formatted_address": string
    "country": string
    "province": string
    "citycode": string
    "city": string
    "district": string
    "adcode": string
    "street": string
    "number": string
    "location": string
    "level": string
  }[]
}

interface AmapResonpGeocodeRegeo extends AmapResonp {
  regeocode: {
    formatted_address: string
  }
}

interface AmapResonpAutonavi extends AmapResonp {
  locations: string
}

// ip转gps
export const API_Aamp_ip2local = (ip: string) => {
  return get<AmapResonpIP>("ip", { ip })
}

// 地址转gps
export const API_Aamp_address2local = (address: string) => {
  return get<AmapResonpGeocodeGeo>('geocode/geo', { address })
}
// gps转地址
export const API_Aamp_local2address = (location: string) => {
  return get<AmapResonpGeocodeRegeo>("geocode/regeo", { location })
}

// gps转高德gps
export const API_Aamp_gps2autoanvi = (coordsys: 'gps' | 'mapbar' | 'baidu', locations: string) => {
  return get<AmapResonpAutonavi>('assistant/coordinate/convert', { coordsys, locations })
}

// 格式化日期时间
export const paresTime = (time: string | number | Date): string => {
  const T = new Date(time);
  return `${T.getMonth() +
    1}/${T.getDate()} ${T.getHours()}:${T.getMinutes()}:${T.getSeconds()}`;
};


async function get<T>(type: restype, params: Object): Promise<T> {
  const result = await axios.get(ApiAddress + type, { params: { key: AmapKey, ...params } })
  return result.data
}

