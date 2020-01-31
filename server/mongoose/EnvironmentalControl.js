"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { mongoose, Schema } = require("./index");
const SchemaEC = new Schema({
    ECid: String,
    name: String,
    model: String
});
const EcTerminal = mongoose.model("EcTerminal", SchemaEC);
exports.EcTerminal = EcTerminal;
