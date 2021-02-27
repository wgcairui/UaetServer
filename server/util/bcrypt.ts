import bcrypt from "bcryptjs";
const saltRounds = 10;

/**
 * 加密密码
 * @param passwd 明文密码
 */
export const BcryptDo = (passwd:any):Promise<string> => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(saltRounds, (err, salt) => {
      if (err) reject(err);
      bcrypt.hash(passwd, salt, (err, hash) => {
        if (err) reject(err);
        resolve(hash);
      });
    });
  });
};

/**
 * 校验密码
 * @param passwd 明文密码 
 * @param hash 加密后的字符串hash
 */
export const BcryptCompare = (passwd: any, hash: string):Promise<boolean> => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(passwd, hash, (err, some) => {
      if (err) reject(err);
      resolve(some);
    });
  });
};

