<template>
  <my-page title="空调">
    <b-row>
      <b-col cols="12">
        <separated title="状态量"></separated>
        <div class="bg-dark p-3">
          <b-img-lazy src="~/assets/image/ac3.png" fluid />
        </div>
      </b-col>
    </b-row>
    <!-- 温湿度状态 -->
    <b-row>
      <b-col cols="12" md="5">
        <b-row class="border-bottom py-3">
          <b-col cols="12" md="12" class="text-center pb-3 d-flex flex-row">
            <div>
              <span class="temperature d-block">
                <i class="iconfont text-success temperatureColor">&#xe604;</i>
                {{ Stat.stat.HeatChannelTemperature.value }}&#8451;
              </span>
            </div>
            <div class="border rounded-lg ml-auto">
              <p class="bg-info text-light p-1 m-0">设定制冷温度</p>
              <b>{{ Stat.stat.RefrigerationTemperature.value }}&#8451;</b>
            </div>
          </b-col>
          <b-col cols="12" md="12" class="text-center pb-3 d-flex flex-row">
            <div>
              <span class="temperature d-block">
                <i class="iconfont text-primary humidityColor">&#xe604;</i>
                {{ Stat.stat.HeatChannelHumidity.value }}
                %
              </span>
            </div>
            <div class="border rounded-lg ml-auto">
              <p class="bg-info text-light p-1 m-0">设定制冷湿度</p>
              <b>{{ Stat.stat.RefrigerationHumidity.value }}%</b>
            </div>
          </b-col>
        </b-row>
      </b-col>
      <!-- 风速,之热等状态图 -->
      <b-col cols="12" md="7">
        <b-row class="m-0">
          <b-col cols="4" md="4" class="py-1 px-2" v-for="(val, key) in Stat.AirStat" :key="key">
            <div class="border rounded-lg d-flex flex-column align-items-center">
              <i class="bg-info d-inline w-100 p-1 text-center text-light">{{ val.name }}</i>
              <b-img fluid :src="val.value" alt="Card image" class="p-1"></b-img>
            </div>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
    <!-- 表格 -->
    <b-row>
      <b-col>
        <separated title="模拟量">
          <b-button
            size="sm"
            variant="info"
            class="m-2"
            :to="{name:'uart-setup',query:$route.query}"
          >配置</b-button>
        </separated>
        <b-overlay :show="$apollo.loading">
          <b-tabs justified>
            <b-tab title="模拟量">
              <b-table :items="line.simulate" :fields="fields">
                <template v-slot:cell(value)="row">
                  <h5>
                    <b-badge>{{row.value}}{{row.item.unit}}</b-badge>
                  </h5>
                </template>
                <template v-slot:cell(oprate)="row">
                  <b-button-group size="sm">
                    <b-button
                      variant="info"
                      class="block px-1 py-0 pt-1"
                      :to="{
                        name: 'uart-line',
                        query: { ...$route.query, name: row.item.name }
                      }"
                    >趋势</b-button>
                    <b-button @click="AlarmArgument(row.item)" variant="info">Alarm</b-button>
                  </b-button-group>
                </template>
              </b-table>
            </b-tab>
            <b-tab title="状态量" lazy>
              <b-table :items="line.quantity" :fields="fields">
                <template v-slot:cell(oprate)="row2">
                  <b-button-group>
                    <b-button @click="DevBind(row2.item)" size="sm">指令</b-button>
                  </b-button-group>
                </template>
              </b-table>
            </b-tab>
          </b-tabs>
        </b-overlay>
      </b-col>
    </b-row>
    <oprate-modal :oprate="oprate" :oprateArg='oprateArg'></oprate-modal>
  </my-page>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import {
  queryResultArgument,
  queryResult,
  Terminal,
  TerminalMountDevs,
  ProtocolConstantThreshold,
  DevConstant_Air,
  queryResultSave
} from "../../server/bin/interface";
import { BvTableFieldArray } from "bootstrap-vue";
type airHM =
  | "HeatChannelTemperature"
  | "HeatChannelHumidity"
  | "ColdChannelTemperature"
  | "ColdChannelHumidity"
  | "RefrigerationTemperature"
  | "RefrigerationHumidity";
type airType =
  | "Speed"
  | "HeatModel"
  | "ColdModel"
  | "Dehumidification"
  | "Humidification";
type airHMObj = {
  [p in airHM]: { property: string; name: string; value: number };
};
type airTypeObj = {
  [p in airType]: { property: string; name: string; value: number };
};
export default Vue.extend({
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
      // 状态gif动图
      speedStop: require("~/assets/image/icons/fen_gray.gif"),
      speedRun: require("~/assets/image/icons/fen.gif"),
      hotStop: require("~/assets/image/icons/sun_gary.gif"),
      hotRun: require("~/assets/image/icons/sun.gif"),
      coolStop: require("~/assets/image/icons/cool_gary.png"),
      coolRun: require("~/assets/image/icons/cool.gif"),
      humidityStop: require("~/assets/image/icons/chushi_gray.png"),
      humidityRun: require("~/assets/image/icons/chushi.gif"),
      addHumidityStop: require("~/assets/image/icons/jiashi_gray.png"),
      addHumidityRun: require("~/assets/image/icons/jiashi.gif"),
      //
      airData: {} as queryResultSave,
      DevConstant: {} as Pick<
        ProtocolConstantThreshold,
        "ProtocolType" | "Constant"
      >,
      fields: [
        { key: "name", label: "变量" },
        { key: "value", label: "值" },
        { key: "oprate", label: "操作" }
      ] as BvTableFieldArray,
      //
      oprate: false,
      oprateArg: null
    };
  },
  computed: {
    // table
    line() {
      // 状态量
      const quantity: queryResultArgument[] = [];
      // 模拟量
      const simulate: queryResultArgument[] = [];
      if (this.airData?.result) {
        // 空调设备数据
        const result: queryResultArgument[] = this.airData.result;
        result.forEach(el => {
          const valGetter: queryResultArgument = this.$store.getters.getUnit(
            el
          );
          valGetter.issimulate
            ? simulate.push(valGetter)
            : quantity.push(valGetter);
        });
      }
      return { simulate, quantity };
    },
    Stat() {
      // 默认参数
      const stat: airHMObj = {
        HeatChannelTemperature: { property: "", name: "热通道温度", value: 0 },
        HeatChannelHumidity: { property: "", name: "热通道湿度", value: 0 },
        ColdChannelTemperature: { property: "", name: "冷通道温度", value: 0 },
        ColdChannelHumidity: { property: "", name: "冷通道温度", value: 0 },
        RefrigerationTemperature: { property: "", name: "设定温度", value: 0 },
        RefrigerationHumidity: { property: "", name: "设定湿度", value: 0 }
      };
      const AirStat: airTypeObj = {
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
      if (this.DevConstant?.Constant && this.airData?.result) {
        // 状态常量
        const Constant: DevConstant_Air = this.$data.DevConstant.Constant;
        // 数据
        const result: queryResultArgument[] = this.$data.airData.result;
        //获取常量字段，用于刷选数据集
        // console.log(this.$data.DevConstant);
        const ConstantValues: Set<string> = new Set(Object.values(Constant));
        // 过滤有常量的值
        const resultFilter = result.filter(el => ConstantValues.has(el.name));
        // 遍历result集，update默认结果
        resultFilter.forEach(el => {
          // 遍历状态常量,数据集的值等于状态常量值，赋值状态常量
          // 可能会有多个数据常量使用同一数据集，所有每个遍历
          for (let i in Constant) {
            if (el.name === (Constant as any)[i]) {
              if (this.statSet.has(i)) {
                (AirStat as any)[i].property = el.name;
                (AirStat as any)[i].value = parseInt(el.value);
              } else {
                (stat as any)[i].property = el.name;
                (stat as any)[i].value = parseInt(el.value);
              }
            }
          }
        });
      }
      //
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
      AirStat.Speed.value = AirStat.Speed.value ? speedRun : speedStop;
      AirStat.HeatModel.value = AirStat.HeatModel.value ? hotRun : hotStop;
      AirStat.ColdModel.value = AirStat.ColdModel.value ? coolRun : coolStop;
      AirStat.Dehumidification.value = AirStat.Dehumidification.value
        ? humidityRun
        : humidityStop;
      AirStat.Humidification.value = AirStat.Humidification.value
        ? addHumidityRun
        : addHumidityStop;
      return { stat, AirStat };
    }
  },
  apollo: {
    airData: {
      query: gql`
        query getUartTerminalData($DevMac: String, $pid: Int) {
          airData: UartTerminalData(DevMac: $DevMac, pid: $pid) {
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
      `,
      variables() {
        const { pid, DevMac } = this.$data.query;
        return {
          pid: parseInt(pid),
          DevMac
        };
      },
      pollInterval: 10000,
      fetchPolicy: "network-only"
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
      this.oprate = !this.oprate;
      this.$data.oprateArg = { item, query: this.query };
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
