/* jshint esversion:8 */
import jsonwebtoken from "jsonwebtoken";
import { UserInfo } from "./interface";
export const secret: string = "UartServer";
export const tokenExpiresTime: number = 1000 * 60 * 60 * 24;

/**
 *加密函数
 *payload为加密的数据，数据类型string or object
 * @param {*} { payload, option }
 * @returns
 */
export const JwtSign = ({
  payload,
  option = {}
}: {
  payload: UserInfo;
  option?: jsonwebtoken.SignOptions;
}) => {
  const opt = Object.assign({ expiresIn: tokenExpiresTime }, option || {});
  return jsonwebtoken.sign(payload, secret, opt);
};

/**
 *解密函数
 *
 * @param {*} { token }
 * @returns
 */

export const JwtVerify = (token: string): UserInfo => {
  return <object>jsonwebtoken.verify(token, secret);
};
