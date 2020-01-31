"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const SchemaTerminal = new index_1.Schema({
    DevMac: { type: String, required: true },
    name: { type: String, required: true },
    Jw: String,
    mountNode: { type: String, required: true },
    mountDevs: [
        new index_1.Schema({
            _id: { type: Boolean, default: false },
            mountDev: { type: String, required: true },
            protocol: { type: String, required: true },
            pid: { type: Number, default: 0 }
        })
    ]
});
const Terminal = index_1.mongoose.model("Terminal", SchemaTerminal);
exports.Terminal = Terminal;
