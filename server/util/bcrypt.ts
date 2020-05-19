import bcrypt from "bcrypt";
const saltRounds = 10;

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

export const BcryptCompare = (passwd: any, hash: string):Promise<boolean> => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(passwd, hash, (err, some) => {
      if (err) reject(err);
      resolve(some);
    });
  });
};

