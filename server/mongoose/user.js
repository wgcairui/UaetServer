/* eslint-disable camelcase */
/* jshint esversion:8 */
const { mongoose, Schema } = require("./index");
const Schema_User_dev = new Schema({
  user: String,
  dev: [
    {
      type: { type: String },
      devid: { type: String },
      devName: { type: String }
    }
  ]
});

Schema_User_dev.statics.GetUserDevs = async function(user) {
  const arr = await this.findOne({ user }, "dev");
  try {
    return arr.dev.map((val) => {
      return val.devid;
    });
  } catch (error) {
    return [];
  }
};

Schema_User_dev.statics.GetDevidUsers = async function(devid) {
  const arr = await this.find({ "dev.devid": devid }, "user");
  return arr.map((val) => {
    return val.user;
  });
};

const Schema_User_final = new Schema({
  user: String,
  access_contral: Boolean,
  leak: Boolean,
  smoke: Boolean,
  modifyTime: Date,
  IO_alarm: Boolean
});

const Schema_Users = new Schema({
  userId: String,
  name: String,
  user: { type: String, index: true, trim: true, required: true },
  userGroup: {
    type: String,
    enum: ["root", "admin", "user"],
    trim: true,
    default: "user"
  },
  passwd: String,
  mail: String,
  company: String,
  tel: Number,
  creatTime: { type: Date, default: new Date() },
  modifyTime: { type: Date, default: null },
  address: String,
  status: { type: Boolean, default: true },
  messageId: String,
  v_code: "Mixed"
});

const User_dev = mongoose.model("user_dev", Schema_User_dev, "user_dev");
const User_final = mongoose.model(
  "user_final",
  Schema_User_final,
  "user_final"
);
const Users = mongoose.model("users", Schema_Users, "users");

module.exports = { User_dev, User_final, Users };
