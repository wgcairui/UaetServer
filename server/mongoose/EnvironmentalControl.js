const { mongoose, Schema } = require("./index");

const SchemaEC = new Schema({
  ECid: String,
  name: String,
  model: String
});

const EcTerminal = mongoose.model("EcTerminal", SchemaEC);

module.exports = { EcTerminal };
