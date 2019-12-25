/* jshint esversion:8 */
const jsonwebtoken = require("jsonwebtoken");
const secret = "UartServer";
const tokenExpiresTime = 1000 * 60 * 60 * 24;

/**
 *加密函数
 *payload为加密的数据，数据类型string or object
 * @param {*} { payload, option }
 * @returns
 */
const JwtSign = ({ payload, option = {} }) => {
  const opt = Object.assign(
    { expiresIn: tokenExpiresTime },
    typeof option === "object" ? option : {}
  );
  return jsonwebtoken.sign(payload, secret, opt);
};

/**
 *解密函数
 *
 * @param {*} { token }
 * @returns
 */
const JwtVerify = (token) => {
  return jsonwebtoken.verify(token, secret);
};

module.exports = { JwtSign, JwtVerify, secret };
