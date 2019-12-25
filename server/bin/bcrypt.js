const bcrypt = require("bcrypt");
const saltRounds = 10;

const BcryptDo = (passwd) => {
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

const BcryptCompare = (passwd, hash) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(passwd, hash, (err, some) => {
      if (err) reject(err);
      resolve(some);
    });
  });
};

module.exports = { BcryptCompare, BcryptDo };
