import axios from "axios";
import config from "../nuxt.config";
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

// gps字符串转高德point
export const gps2AutonaviPosition = async (gps: string, window: Window & typeof globalThis) => {
  const sgps = gps
    .split(",")
    .map((el: string) => parseFloat(el)) as [number, number];
  return await new Promise<AMap.LngLat>(res => {
    window.AMap.convertFrom(sgps, "gps", (stat: any, result: { locations: any[]; }) => {
      const jws = result.locations[0];
      res(jws);
    });
  });
}

// ip转gps
export const API_Aamp_ip2local = async (ip: string) => {
  const data = await get<AmapResonpIP>("ip", { ip })
  const jw = typeof data.rectangle === "string"
    ? (data.rectangle
      .split(";")[0]
      .split(",")
      .map(el => parseFloat(el)) as [number, number])
    : ([0.0, 0.0] as [number, number]);
  return new AMap.LngLat(...jw)
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

// V2 gps转高德gps
export const V2_API_Aamp_gps2autoanvi = (locations: string | string[], coordsys: 'gps' | 'mapbar' | 'baidu' = "gps") => {
  return ServerApi<string | string[]>('AMap/GPS2autonavi', { coordsys, locations: Array.isArray(locations) ? locations.join("|") : locations })
}

// V2 ip转gps
export const V2_API_Aamp_ip2local = async (ip: string) => {
  return ServerApi<string>("AMap/IP2loction", { ip })
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

interface serverApi<T> {
  code: number
  msg: string
  timeStap: number
  query: Object
  result: T
}

// serverAPI
async function ServerApi<T>(path: string, params: Object) {
  // const url = "http://localhost:9010/api/util/"
  const token = '38_HFuhHEaxyKgthO-vgUzCIioWUHbkUlBYOsUoczHZU6VhLAfXOGIgAL2px8ApStw_u1XLGFIVxrgkYfxlRkVP8idjEch0Ykg0-ETwB8us19rXxWU6aKTbaoAS9Gma_N4UgtWZBbM7_r0OPkHHXHVgAEAGQE'
  const result = await axios.get<serverApi<T>>(config.env!.server + "api/util/" + path, { params: { token, ...params } })
  return result.data
}

