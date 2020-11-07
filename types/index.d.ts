import { Uart } from "typing";

declare module "socket.io" {
  interface Socket extends NodeJS.EventEmitter {
    on(event: 'disconnect', listener: () => void): this

    on(event: 'register', listener: (node: Uart.nodeInfo) => void): this

    on(event: 'ready', listener: () => void): this

    on(event: 'startError', listener: (arg: any) => void): this

    on(event: 'alarm', listener: (arg: any) => void): this

    on(event: 'terminalOn', listener: (data: string | string[], reline?: boolean) => void): this

    on(event: 'terminalOff', listener: (mac: string, active: boolean) => void): this
    on(event: 'terminalMountDevTimeOut', listener: (Query: Uart.queryResult, instruct: string[]) => void): this
    on(event: 'instructTimeOut', listener: (Query: Uart.queryResult, instruct: string[]) => void): this
    on(event: string, listener: (...args: any[]) => void): this

    emit(event: 'registerSuccess', node: Uart.NodeClient): this
    emit(event: 'query', Query: Uart.queryObject): this
    emit(event: 'instructQuery', Query: Uart.instructQuery): this
    emit(event: 'DTUoprate', Query: Uart.DTUoprate): this
    emit(event: string, ...args: any[]): this
  }
}
