<template>
  <b-row class="h-100">
    <b-col class="overflow-auto h-100">
      <b-row>
        <b-col>
          <separated title="DTU调试"></separated>
          <my-form label="DTU列表">
            <b-select :options="Terminals" v-model="DevMac"></b-select>
          </my-form>
          <my-form label="AT指令">
            <b-input v-model="AT"></b-input>
          </my-form>

          <div class="p-3">
            <separated title="DTU参数" :back="false"></separated>
            <b-check v-model="label">添加+++AT+前辍</b-check>
          </div>

          <div class="p-3">
            <separated title="快捷指令" :back="false"></separated>
            <b-button variant="success" v-for="val in at" :key="val.text" class="m-3" @click="setAT(val.value)">{{val.text}}</b-button>
          </div>
          <b-button @click="OprateAT" block size="sm" :disabled="!DevMac || !AT">执行</b-button>
        </b-col>
      </b-row>
      <b-row class="my-4">
        <b-col>
          <b-overlay :show="$apollo.loading">
            <b-card>
              <p v-for="val in msg" :key="val">{{val}}</p>
            </b-card>
          </b-overlay>
        </b-col>
      </b-row>
    </b-col>
  </b-row>
</template>
<script lang="ts">
import Vue from 'vue'
import gql from "graphql-tag";
export default Vue.extend({
  data() {
    return {
      Terminals: [],
      DevMac: '',
      AT: 'VER',
      msg: [],
      label: true,
      at: [
        { text: '硬重启', value: 'Z' },
        { text: '查询主机名称', value: 'HOST' },
        { text: '软件版本', value: 'VER' },
        { text: 'GPRS版本', value: 'GVER' },
        { text: '定制软件版本号', value: 'APPVER' },
        { text: '查询串口参数', value: 'UART=1' },
        { text: '设置波特率2400', value: 'UART=1,2400,8,1,NONE,NFC' },
        { text: '设置波特率4800', value: 'UART=1,4800,8,1,NONE,HD' },
        { text: '设置波特率9600', value: 'UART=1,9600,8,1,NONE,HD' },
        { text: '设置波特率19200', value: 'UART=1,19200,8,1,NONE,HD' },
        { text: '设置波特率115200', value: 'UART=1,115200,8,1,NONE,HD' },
        { text: '注册包配置', value: 'NREGEN=A' },
        { text: '基站定位', value: 'LOCATE=1' },
        { text: 'GPS定位', value: 'LOCATE=2' },
        { text: '查询 GPRS 信号强度', value: 'GSLQ' },
        { text: '查询 GSM 状态', value: 'GSMST' },
        { text: '查询模块 ICCID 码', value: 'ICCID' },
        { text: '查询模块 IMEI 码', value: 'IMEI' },
        { text: '查询 SIM 卡 IMSI 号', value: 'IMSI' },
        { text: 'IOT状态', value: 'IOTEN' },
        { text: '关闭IOT', value: 'IOTEN=off' },
        { text: '打开IOT', value: 'IOTEN=on,60' },
        { text: 'UserID', value: 'IOTUID' },
        { text: '模块型号', value: 'PID' },
        { text: '打印调试信息输出', value: 'NDBGL' }
      ]
    }
  },
  apollo: {
    Terminals: {
      query: gql`
        query TerminalsInfo {
          Terminals {
            DevMac
            name
            AT
          }
        }
      `,
      update: data => {
        return data.Terminals.map(el => ({
          text: el.name + (!el.AT && '---不支持AT指令'),
          value: el.DevMac,
          AT: el.AT
        }))
      }
    }
  },
  methods: {
    setAT(value: string) {
      this.AT = value
    },
    async OprateAT() {
      const { DevMac, AT, label } = this.$data
      const str = '+++AT+'
      this.msg.push(`Send(${new Date().toLocaleTimeString()}): ${DevMac} -- ${AT}`)
      const result = await this.$apollo.mutate({
        mutation: gql`
          mutation Send_DTU_AT_InstructSet($DevMac:String,$content:String){
              Send_DTU_AT_InstructSet(DevMac:$DevMac,content:$content){
                  ok
                  msg
              }
          }
          `,
        variables: {
          DevMac,
          content: label ? str + AT : AT
        }
      })
      const R = result.data.Send_DTU_AT_InstructSet as ApolloMongoResult;
      this.msg.push(`Recive(${new Date().toLocaleTimeString()}): ${DevMac} -- code:${R.ok} -- msg:${R.msg}`)
    }
  }
})
</script>