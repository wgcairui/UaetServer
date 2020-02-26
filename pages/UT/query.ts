import gql from "graphql-tag"
export const UartTerminalData = gql`
query getUartTerminalData($DevMac: String, $pid: Int) {
  UartTerminalData(DevMac: $DevMac, pid: $pid) {
    result {
      name
      value
      unit
    }
    pid
    time
    mac
  }
}
`