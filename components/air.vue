<template>
  <b-row>
    <b-row class="w-100">
      <b-col cols="12">
        <div class="bg-dark p-3">
          <b-img-lazy src="~/assets/image/ac3.png" fluid />
        </div>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12" md="5">
        <b-row class="border-bottom py-3">
          <b-col cols="12" md="12" class="text-center pb-3 d-flex flex-row">
            <div>
              <span class="temperature d-block">
                <i class="iconfont text-success temperatureColor">&#xe604;</i>
                {{ Stat.stat.ColdChannelTemperature.value }}&#8451;
              </span>
            </div>
            <div class="border rounded-lg ml-auto" @click="$bvModal.show('OprateInstructMode')">
              <p class="bg-info text-light p-1 m-0">设定制冷温度</p>
              <b>{{ Stat.stat.RefrigerationTemperature.value }}&#8451;</b>
            </div>
          </b-col>
          <b-col cols="12" md="12" class="text-center pb-3 d-flex flex-row">
            <div>
              <span class="temperature d-block">
                <i class="iconfont text-primary humidityColor">&#xe604;</i>
                {{ Stat.stat.ColdChannelHumidity.value }}
                %
              </span>
            </div>
            <div class="border rounded-lg ml-auto" @click="$bvModal.show('OprateInstructMode')">
              <p class="bg-info text-light p-1 m-0">设定制冷湿度</p>
              <b>{{ Stat.stat.RefrigerationHumidity.value }}%</b>
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
            v-for="(val, key) in Stat.AirStat"
            :key="val.name+key"
          >
            <div class="border rounded-lg d-flex flex-column align-items-center">
              <i class="bg-info d-inline w-100 p-1 text-center text-light">{{ val.name }}</i>
              <b-img fluid :src="val.value" alt="Card image" class="p-1"></b-img>
            </div>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
  </b-row>
</template>
<script lang="ts">
import Vue, { PropType } from "vue";
import gql from "graphql-tag";
import { BvTableFieldArray } from "bootstrap-vue";
type airHM = | "ColdChannelTemperature" | "ColdChannelHumidity" | "RefrigerationTemperature" | "RefrigerationHumidity";
type airType = | "Speed" | "HeatModel" | "ColdModel" | "Dehumidification" | "Humidification";
type airHMObj = { [p in airHM]: { property: string; name: string; value: number }; };
type airTypeObj = { [p in airType]: { property: string; name: string; value: number }; };
export default Vue.extend({
  props: {
    dev: {
      type: Object as PropType<Uart.queryResultSave>,
      default: {}
    },
    Constant: {
      type: Object as PropType<Uart.ProtocolConstantThreshold>
    }
  },
  data() {
    const statSet = new Set(["Speed", "HeatModel", "ColdModel", "Dehumidification", "Humidification"]);
    return {
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
      addHumidityRun: require("~/assets/image/icons/jiashi.gif")
    };
  },
  computed: {
    Stat() {
      // 默认参数
      const stat: airHMObj = {
        /* HeatChannelTemperature: { property: "", name: "热通道温度", value: 0 },
        HeatChannelHumidity: { property: "", name: "热通道湿度", value: 0 }, */
        ColdChannelTemperature: { property: "", name: "冷通道温度", value: 0 },
        ColdChannelHumidity: { property: "", name: "冷通道温度", value: 0 },
        RefrigerationTemperature: { property: "", name: "设定温度", value: 0 },
        RefrigerationHumidity: { property: "", name: "设定湿度", value: 0 }
      };

      // 动态素材
      const { speedRun, speedStop, hotStop, hotRun, coolRun, coolStop, humidityRun, humidityStop, addHumidityRun, addHumidityStop } = this.$data;
      const AirStat: airTypeObj = {
        Speed: { property: "", name: "风速", value: speedStop },
        HeatModel: { property: "", name: "制热", value: hotStop },
        ColdModel: { property: "", name: "制冷", value: coolStop },
        Dehumidification: { property: "", name: "除湿", value: humidityStop },
        Humidification: { property: "", name: "加湿", value: addHumidityStop }
      };
      // 空调数据和常量数据都pull之后生成数据
      if (this.Constant?.Constant && this.dev?.parse) {
        // 状态常量
        const Constant: Uart.DevConstant_Air = this.Constant.Constant;
        // 设置数值量
        const statKeys = ["ColdChannelTemperature", "ColdChannelHumidity", "RefrigerationTemperature", "RefrigerationHumidity"];
        const parse = this.dev.parse;
        Object.entries(Constant).forEach(([key, val]) => {
          if (val && statKeys.includes(key) && parse.hasOwnProperty(val)) {
            const parse1: Uart.queryResultArgument = (parse as any)[val] as any;
            (stat as any)[key].value = parseInt(parse1.value);
          }
        });

        // 设置风速
        const speedKey = Constant.Speed;
        if (parse[speedKey]) {
          AirStat.Speed.property = parse[speedKey].name;
          AirStat.Speed.value = parseInt(parse[speedKey].value) ? speedRun : speedStop;
        }
        // 设置工作状态
        if (parse["机组工作状态"]) {
          const devRunStat: Uart.queryResultArgument = this.$store.getters.getUnit(parse["机组工作状态"]);
          //
          AirStat.HeatModel.value = devRunStat.value.includes("热") ? hotRun : hotStop;
          AirStat.ColdModel.value = devRunStat.value.includes("冷") ? coolRun : coolStop;
          AirStat.Dehumidification.value = devRunStat.value.includes("除湿") ? humidityRun : humidityStop;
          AirStat.Humidification.value = devRunStat.value.includes("加湿") ? addHumidityRun : addHumidityStop;
        }
      }
      return { stat, AirStat };
    }
  }
});
</script>
<style>
.temperature {
  font-size: 28px;
}
</style>
