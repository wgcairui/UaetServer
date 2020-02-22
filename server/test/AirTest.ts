import { queryResult } from "../bin/interface";
import Axios from "axios";


const testData: queryResult[] = [{

    content: "0104001c001ab007",
    mac: "866262045427977",
    pid: 1,
    timeStamp: 1582091384490,
    buffer: {
        data: [
            1,
            4,
            52,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            226,
            103
        ],
        type: "Buffer"
    },
    protocol: "卡乐控制器",

    stat: "success",
    time: "2020-01-15T09:28:17.335Z",
    type: 485
},
{
    "content": "0104002f004241f2",
    "mac": "866262045427977",
    "pid": 1,
    timeStamp: 1582091384490,
    "buffer": {
        "data": [
            1,
            4,
            132,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            109,
            230
        ],
        "type": "Buffer"
    },
    "protocol": "卡乐控制器",

    "stat": "success",
    "time": "2020-01-15T09:28:12.484Z",
    "type": 485
},
{
    "content": "01040029000c21c7",
    "mac": "866262045427977",
    "pid": 1,
    timeStamp: 1582091384490,
    "buffer": {
        "data": [
            1,
            4,
            24,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            130,
            139
        ],
        "type": "Buffer"
    },
    "protocol": "卡乐控制器",

    "stat": "success",
    "time": "2020-01-15T09:28:09.542Z",
    "type": 485
},
{
    "content": "01040001001be1c1",
    "mac": "866262045427977",
    "pid": 1,
    timeStamp: 1582091384490,
    "buffer": {
        "data": [
            1,
            4,
            54,
            216,
            241,
            216,
            241,
            216,
            241,
            216,
            241,
            216,
            241,
            0,
            0,
            255,
            231,
            255,
            198,
            255,
            198,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            9,
            181
        ],
        "type": "Buffer"
    },
    "protocol": "卡乐控制器",

    "stat": "success",
    "time": "2020-01-15T09:28:14.937Z",
    "type": 485
},


]

console.log(testData.length);


Axios.post("http://116.62.48.175:9010/Api/Node/UartData", { data: testData }).then(e => console.log(e.data)
).catch(e => console.log(e)
)