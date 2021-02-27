/* jshint esversion:8 */
import jsonwebtoken from "jsonwebtoken";
export const secret: string = "UartServer";
export const tokenExpiresTime: number = 1000 * 60 * 60 * 24;

/**
 *加密函数
 *payload为加密的数据，数据类型string or object
 * @param {*} { payload, option }
 * @returns
 */

export const JwtSign = (payload: string | object | Buffer, options?: jsonwebtoken.SignOptions) => {
  const result: Promise<string> = new Promise((resolve, reject) => {
    const opt = Object.assign({ expiresIn: tokenExpiresTime }, options || {});
    jsonwebtoken.sign(payload, secret, opt, (err, encodeURI) => {
      if (err) reject(err)
      resolve(encodeURI!)
    })
  })
  return result
};

/**
 *解密函数
 *
 * @param {*} { token }
 * @returns
 */

 export const JwtVerify = (token: string) => {
  const result: Promise<string | object | Buffer | any> = new Promise((resolve, reject) => {
    jsonwebtoken.verify(token, secret, (err, decode) => {
      if (err) reject(err)
      resolve(decode)
    })
  })
  return result
}; 
