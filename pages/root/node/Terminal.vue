<template>
  <b-col>
    <separated title="终端">
      <b-input v-model="filter" placeholder="输入设备ID搜索数据" size="sm"></b-input>
    </separated>
    <b-form-radio-group
      class="m-5"
      id="radio-group-1"
      v-model="type"
      :options="types"
      name="radio-options"
    ></b-form-radio-group>
    <b-table responsive :items="item" :filter="new RegExp(filter)" :fields="fields" hover>
      <template v-slot:cell(tag)="row">
        <b-badge v-for="(val,key) in row.value" :key="key">{{val}}</b-badge>
      </template>
      <template v-slot:cell(mountDevs)="row">
        <b-button-group size="sm">
          <b-button
            @click="row.toggleDetails"
            v-if="row.item.mountDevs.length > 0"
          >{{ row.detailsShowing ? "收起" : "展开" }}</b-button>
          <b-button
            v-if="row.item.AT"
            :to="{ name: 'root-AT', query: { mac: row.item.DevMac } }"
            variant="primary"
          >AT调试</b-button>
        </b-button-group>
      </template>
      <template v-slot:row-details="row">
        <b-card>
          <b-table :items="row.item.mountDevs" :fields="childFields">
            <template v-slot:cell(oprate)="row1">
              <b-button @click="seeDev(row.item,row1.item)">查看设备信息</b-button>
            </template>
          </b-table>
        </b-card>
      </template>
    </b-table>
  </b-col>
</template>
<script lang="ts">
  import Vue from "vue";
  import { BvTableFieldArray } from "bootstrap-vue";
  import gql from "graphql-tag";
  export default Vue.extend({
    data() {
      return {
        types: ['全部', 'UPS', '空调', '温湿度', '电量仪'],
        type: '全部',
        filter: this.$route.query.DevMac || "",
        Terminals: [] as Uart.Terminal[],
        fields: [
          { key: "name", label: "别名" },
          { key: "DevMac", label: "设备ID" },
          { key: "mountNode", label: "挂载节点", sortable: true },
          { key: "ip", label: "IP" },
          { key: 'port', label: 'Port' },
          { key: "jw", label: "GPS" },
          { key: 'uart', label: '通讯参数' },
          //{ key: 'AT', label: '调试支持' },
          { key: 'tag', label: '标签' },
          { key: "uptime", label: "更新时间" },
          { key: "mountDevs", label: "挂载设备" }
        ] as BvTableFieldArray,
        childFields: [
          { key: "Type", label: "设备类型" },
          { key: "mountDev", label: "设备型号" },
          { key: "protocol", label: "协议" },
          { key: "pid", label: "地址" },
          { key: 'oprate', label: '操作' }
        ] as BvTableFieldArray
      };
    },
    computed: {
      item() {
        let item = [] as any[]
        const Terminal = this.$data.Terminals as Uart.Terminal[]
        const type = this.$data.type
        if (Terminal) {
          item = Terminal.map(terminal => {
            terminal.tag = terminal.mountDevs.map(el => el.Type)
            return terminal
          }).filter(el => type === '全部' || el.tag!.includes(type))
        }
        return item
      }
    },
    apollo: {
      Terminals: {
        query: gql`
        query TerminalsInfo {
          Terminals {
            DevMac
            name
            ip
            port
            jw
            AT
            uptime
            uart
            mountNode
            mountDevs {
              Type
              mountDev
              protocol
              pid
            }
          }
        }
      `
      }
    },
    methods: {
      seeDev(dtu: Uart.Terminal, mount: Uart.TerminalMountDevs) {
        console.log({ dtu, mount });
        this.$router.push({ name: 'root-node-dev-device', query: { DevMac: dtu.DevMac, pid: mount.pid.toString(), mountDev: mount.mountDev, protocol: mount.protocol } })
      }
    }
  });
</script>