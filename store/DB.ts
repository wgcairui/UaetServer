import { init, getInstance } from "ts-indexdb"
const dbName = 'US-IndexDB'
type InfoType = "User" | "EC" | "UT" | "SYS"

interface WebInfo {
  time?: string
  msg: string
  code?: number
  type: InfoType
}

const start =async ()=>{
    await init({
        dbName,
        version: 1,
        tables: [
            {
                tableName: 'Infos',
                indexs: [
                    
                    { key: 'code' },
                    { key: 'msg' },
                    { key: 'type' },
                    { key: 'time' }
                ]
            }
        ]
    })
    console.log(`${dbName} is ready!!`);
}
start()
export {getInstance,WebInfo}

