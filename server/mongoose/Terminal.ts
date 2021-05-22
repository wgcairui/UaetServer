import { mongoose, Schema } from "./index";

const SchemaRegisterTerminal = new Schema({
  DevMac: { type: String, required: true },
  mountNode: { type: String, required: true },
})

const SchemaTerminal = new Schema({
  DevMac: { type: String, required: true },
  name: { type: String, required: true },
  ip: String,
  port: Number,
  jw: String,
  uart: String,
  AT: Boolean,
  ICCID: String,
  connecting: Boolean,
  lock: Boolean,
  PID: String,
  ver: String,
  Gver: String,
  iotStat: String,
  online: {
    type: Boolean,
    default: false
  },
  disable: {
    type: Boolean,
    default: false
  },
  uptime: { type: String, default: new Date().toLocaleString() },
  mountNode: { type: String, required: true },
  mountDevs: [
    new Schema(
      {
        Type: { type: String, required: true },
        mountDev: { type: String, required: true },
        protocol: { type: String, required: true },
        pid: { type: Number, default: 0 },
        online: {
          type: Boolean,
          default: true
        },
      },
      { _id: false }
    )
  ]
});

export const Terminal = mongoose.model<Uart.Terminal & mongoose.Document>("Terminal", SchemaTerminal);

export const RegisterTerminal = mongoose.model<Uart.RegisterTerminal & mongoose.Document>("Terminal.Register", SchemaRegisterTerminal)

