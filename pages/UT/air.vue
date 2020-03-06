<template>
  <div>
    <my-head title="空调"></my-head>
    <b-container>
      <b-row>
        <b-col cols="12">
          <separated title="状态量"> </separated>
          <div class="bg-dark p-3">
            <b-img-lazy :src="airFlow" fluid />
          </div>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="12" md="5">
          <b-row class="border-bottom py-3">
            <b-col cols="12" md="12" class="text-center pb-3 d-flex flex-row">
              <div>
                <span class="temperature d-block">
                  <i class="iconfont   text-success temperatureColor"
                    >&#xe604;</i
                  >{{ Stat.HeatChannelTemperature.value }}&#8451;
                </span>
              </div>
              <div class="border rounded-lg ml-auto">
                <p class="bg-info text-light p-1 m-0">设定制冷温度</p>
                <b>{{ Stat.RefrigerationTemperature.value }}&#8451;</b>
              </div>
            </b-col>
            <b-col cols="12" md="12" class="text-center pb-3 d-flex flex-row">
              <div>
                <span class="temperature d-block">
                  <i class="iconfont  text-primary humidityColor">&#xe604;</i
                  >{{ Stat.HeatChannelHumidity.value }}
                  %
                </span>
              </div>
              <div class="border rounded-lg ml-auto">
                <p class="bg-info text-light p-1 m-0">设定制冷湿度</p>
                <b>{{ Stat.RefrigerationHumidity.value }}%</b>
              </div>
            </b-col>
          </b-row>
        </b-col>
        <b-col cols="12" md="7">
          <b-row class="m-0">
            <b-col
              cols="4"
              md="4"
              class="py-1 px-2"
              v-for="(val, key) in Core"
              :key="key"
            >
              <div
                class="border rounded-lg d-flex flex-column align-items-center"
              >
                <i class="bg-info d-inline w-100 p-1 text-center text-light">
                  {{ val.name }}
                </i>
                <b-img
                  fluid
                  :src="val.value"
                  alt="Card image"
                  class="p-1"
                ></b-img>
              </div>
            </b-col>
          </b-row>
        </b-col>
      </b-row>
      <!--  -->
      <b-row>
        <b-col>
          <separated title="模拟量"> </separated>
          <b-tabs justified>
            <b-tab title="模拟量">
              <b-table :items="line.simulate" :fields="fields">
                <template v-slot:cell(oprate)="row">
                  <b-button-group size="sm">
                    <b-button
                      variant="info"
                      class="block px-1 py-0 pt-1"
                      :to="{
                        name: 'UT-line',
                        query: { ...$route.query, name: row.item.name }
                      }"
                      >趋势</b-button
                    >
                    <b-button @click="AlarmArgument(row.item)" variant="warning"
                      >Alarm</b-button
                    >
                    <b-button @click="DisabledArgument(row.item)" variant="dark"
                      >disabled</b-button
                    >
                  </b-button-group>
                </template>
              </b-table>
            </b-tab>
            <b-tab title="状态量" lazy>
              <b-table :items="line.quantity" :fields="fields">
                <template v-slot:cell(oprate)="row2">
                  <b-button-group>
                    <b-button @click="DevBind(row2.item)" size="sm"
                      >指令</b-button
                    >
                  </b-button-group>
                </template>
              </b-table>
            </b-tab>
          </b-tabs>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import MyHead from "../../components/MyHead.vue";
import separated from "../../components/separated.vue";
import gql from "graphql-tag";
import { UartTerminalData } from "./query";
import {
  queryResultArgument,
  queryResult,
  Terminal,
  TerminalMountDevs,
  ProtocolConstantThreshold,
  DevConstant_Air
} from "../../server/bin/interface";
import { getters } from "../../store";
export default Vue.extend({
  components: { MyHead, separated },
  data() {
    const { mountDev, pid, protocol, DevMac } = this.$route.query;
    const statSet = new Set([
      "Speed",
      "HeatModel",
      "ColdModel",
      "Dehumidification",
      "Humidification"
    ]);
    return {
      query: {
        mountDev,
        pid,
        protocol,
        DevMac
      },
      statSet,
      // 主图
      airFlow: require("../../assets/image/ac3.png"),
      // 状态gif动图
      speedStop: require("../../assets/image/icons/fen_gray.gif"),
      speedRun: require("../../assets/image/icons/fen.gif"),
      hotStop: require("../../assets/image/icons/sun_gary.gif"),
      hotRun: require("../../assets/image/icons/sun.gif"),
      coolStop: require("../../assets/image/icons/cool_gary.png"),
      coolRun: require("../../assets/image/icons/cool.gif"),
      humidityStop: require("../../assets/image/icons/chushi_gray.png"),
      humidityRun: require("../../assets/image/icons/chushi.gif"),
      addHumidityStop: require("../../assets/image/icons/jiashi_gray.png"),
      addHumidityRun: require("../../assets/image/icons/jiashi.gif"),
      //
      airData: null,
      DevConstant: null,
      fields: [
        { key: "name", label: "变量" },
        { key: "value", label: "值" },
        { key: "oprate", label: "操作" }
      ]
    };
  },
  computed: {
    Core() {
      const Stat = (this as any).Stat;
      let core = [];
      for (let i in Stat) {
        if (this.$data.statSet.has(i)) core.push(Stat[i]);
      }
      return core;
    },
    line() {
      // 状态量
      let quantity: queryResultArgument[] = [];
      // 模拟量
      let simulate: queryResultArgument[] = [];
      if (this.airData) {
        // 空调设备数据
        const result: queryResultArgument[] = this.$data.airData.result;
        const DevConstant: ProtocolConstantThreshold = this.$data.DevConstant;
        // 遍历result结果集
        result.forEach(el => {
          // 使用协议通用配置检测,如果有屏蔽字则跳过
          if (
            DevConstant?.ShowTag?.length > 0 &&
            DevConstant.ShowTag.includes(el.name)
          ) {
            return;
          }

          const { value, unit } = this.$store.getters.getUnit(
            el.value,
            el.unit
          );
          const parse = Object.assign({ name: el.name }, { value, unit });
          if (unit) {
            simulate.push(parse);
          } else {
            quantity.push(parse);
          }
        });
      }
      return { simulate, quantity };
    },
    Stat() {
      // 默认参数
      let stat = {
        HeatChannelTemperature: { property: "", name: "热通道温度", value: 0 },
        HeatChannelHumidity: { property: "", name: "热通道湿度", value: 0 },
        ColdChannelTemperature: { property: "", name: "冷通道温度", value: 0 },
        ColdChannelHumidity: { property: "", name: "冷通道温度", value: 0 },
        RefrigerationTemperature: { property: "", name: "设定温度", value: 0 },
        RefrigerationHumidity: { property: "", name: "设定湿度", value: 0 },
        Speed: { property: "", name: "风速", value: 0 },
        HeatModel: { property: "", name: "制热", value: 0 },
        ColdModel: { property: "", name: "制冷", value: 0 },
        Dehumidification: {
          property: "",
          name: "除湿",
          value: 0
        },
        Humidification: {
          property: "",
          name: "加湿",
          value: 0
        }
      };
      // 空调数据和常量数据都pull之后生成数据
      if (this.DevConstant && this.airData) {
        // 状态常量
        const Constant: DevConstant_Air = this.$data.DevConstant.Constant;
        // 数据
        const result: queryResultArgument[] = this.$data.airData.result;
        //获取常量字段，用于刷选数据集
        const ConstantValues = new Set(
          Object.values(Constant).map(el =>
            (el as string).replace(/[\r\n]/, "")
          )
        );
        // 过滤有常量的值
        const resultFilter = result.filter(el =>
          ConstantValues.has(el.name.replace(/[\r\n]/, ""))
        );
        // 遍历result集，update默认结果
        resultFilter.forEach(el => {
          const name = el.name.replace(/[\r\n]/, "");
          // 遍历状态常量,数据集的值等于状态常量值，赋值状态常量
          // 可能会有多个数据常量使用同一数据集，所有每个遍历
          for (let i in Constant) {
            if (name === (Constant as any)[i].replace(/[\r\n]/, "")) {
              (stat as any)[i].property = name;
              (stat as any)[i].value = parseInt(el.value);
            }
          }
        });
      }
      // 动态素材
      const {
        speedRun,
        speedStop,
        hotStop,
        hotRun,
        coolRun,
        coolStop,
        humidityRun,
        humidityStop,
        addHumidityRun,
        addHumidityStop
      } = this.$data;
      // 赋值状态

      stat.Speed.value = stat.Speed.value ? speedRun : speedStop;
      stat.HeatModel.value = stat.HeatModel.value ? hotRun : hotStop;
      stat.ColdModel.value = stat.ColdModel.value ? coolRun : coolStop;
      stat.Dehumidification.value = stat.Dehumidification.value
        ? humidityRun
        : humidityStop;
      stat.Humidification.value = stat.Humidification.value
        ? addHumidityRun
        : addHumidityStop;
      return stat;
    }
  },
  apollo: {
    airData: {
      query: UartTerminalData,
      variables() {
        const { pid, DevMac } = this.$data.query;
        return {
          pid: parseInt(pid),
          DevMac
        };
      },
      pollInterval: 10000,
      fetchPolicy: "network-only",
      update: data => data.UartTerminalData
    },
    DevConstant: {
      query: gql`
        query getDevConstant($Protocol: String) {
          DevConstant: getDevConstant(Protocol: $Protocol) {
            ProtocolType
            Constant {
              HeatChannelTemperature
              HeatChannelHumidity
              ColdChannelTemperature
              ColdChannelHumidity
              RefrigerationTemperature
              RefrigerationHumidity
              Speed
              HeatModel
              ColdModel
              Dehumidification
              Humidification
            }
            ShowTag
          }
        }
      `,
      variables() {
        return {
          Protocol: this.$data.query.protocol
        };
      }
    }
  },
  methods: {
    // 发送设备状态量指令
    DevBind(item: queryResultArgument) {
      const { mountDev, pid, protocol, DevMac } = this.query;
      
    },
    // 隐藏设备显示参数
    DisabledArgument(item: queryResultArgument) {},
    // 查看设备参数报警
    AlarmArgument(item: queryResultArgument) {}
  }
});
</script>
<style>
.temperature {
  font-size: 28px;
}
</style>
