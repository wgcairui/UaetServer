<template>
  <div>
    <my-head title="空调"></my-head>
    <b-container>
      <b-row>
        <b-col cols="12">
          <separated title="状态量"></separated>
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
                  <i class="temperatureColor">&#xe604;</i>0&#8451;
                </span>
              </div>
              <div class="border rounded-lg ml-auto">
                <p class="bg-info text-light p-1 m-0">设定制冷温度</p>
                <b>20&#8451;</b>
              </div>
            </b-col>
            <b-col cols="12" md="12" class="text-center pb-3 d-flex flex-row">
              <div>
                <span class="temperature d-block">
                  <i class="humidityColor">&#xe601;</i>30 %
                </span>
              </div>
              <div class="border rounded-lg ml-auto">
                <p class="bg-info text-light p-1 m-0">设定制冷湿度</p>
                <b>50 %</b>
              </div>
            </b-col>
          </b-row>
        </b-col>
        <b-col cols="12" md="7">
          <b-row class="m-0">
            <b-col cols="6" md="4" class="py-1 px-2" v-for="(val, key) in core" :key="key">
              <div class="border rounded-lg d-flex flex-column align-items-center">
                <i class="bg-info d-inline w-100 p-1 text-center text-light">
                  {{
                  val[0]
                  }}
                </i>
                <b-img fluid :src="val[1]" alt="Card image" class="p-1"></b-img>
              </div>
            </b-col>
          </b-row>
        </b-col>
      </b-row>

      <b-row>
        <b-col>
          <separated title="模拟量"></separated>
          <b-table :items="line" :fields="fields">
            <template v-slot:cell(oprate)="row">
              <b-button
                variant="info"
                class="block px-1 py-0 pt-1"
                v-if="row.item.unit"
                :to="{
                  name: 'UT-line',
                  query: { ...$route.query, name: row.item.name }
                }"
              >趋势</b-button>
            </template>
          </b-table>
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
import { queryResultArgument } from "../../server/bin/interface";
import { getters } from "../../store";
export default Vue.extend({
  components: { MyHead, separated },
  data() {
    return {
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
      fields: [
        { key: "name", label: "变量" },
        { key: "value", label: "值" },
        { key: "oprate", label: "操作" }
      ]
    };
  },
  computed: {
    core() {
      return {
        speed: ["风速", this.$data.speedRun],
        hot: ["制热", this.$data.hotRun],
        cool: ["制冷", this.$data.coolRun],
        humidity: ["除湿", this.$data.humidityRun],
        addHumidity: ["加湿", this.$data.addHumidityRun]
      };
    },
    speed() {
      return this.$data.speedRun;
    },
    line() {
      let result: queryResultArgument[] = [];
      if (this.$data.airData?.result) {
        result = (this.$data.airData?.result as queryResultArgument[]).map(
          ({ name, value, unit }) => {
            if ((unit as string).includes("{")) {
              const Punit: Map<string, string> = this.$store.getters.getUnit(
                unit
              );
              value = Punit.get(String(value)) ?? value + unit;
              unit = null;
            } else {
              value = value + unit;
            }

            return { name, value, unit };
          }
        );
      }

      return result;
    }
  },

  apollo: {
    airData: {
      query: UartTerminalData,
      variables() {
        return {
          pid: Number.parseInt(this.$route.query.pid as string),
          DevMac: this.$route.query.DevMac
        };
      },
      pollInterval: 10000,
      fetchPolicy: "network-only",
      update: data => data.UartTerminalData
    }
  }
});
</script>
