<template>
  <my-page-user title="协议常量配置" :isUser="false">
    <b-row>
      <b-col>
        <separated :title="'配置设备类型:' + ProtocolType + ',Protocol:' + Protocol"></separated>
        <!-- air -->
        <b-form v-if="ProtocolType == 'air'">
          <my-form label="热通道温度:">
            <b-form-select v-model="air.HeatChannelTemperature" :options="items"></b-form-select>
          </my-form>
          <my-form label="热通道湿度:">
            <b-form-select v-model="air.HeatChannelHumidity" :options="items"></b-form-select>
          </my-form>
          <my-form label="冷通道温度:">
            <b-form-select v-model="air.ColdChannelTemperature" :options="items"></b-form-select>
          </my-form>
          <my-form label="冷通道湿度:">
            <b-form-select v-model="air.ColdChannelHumidity" :options="items"></b-form-select>
          </my-form>
          <my-form label="制冷温度:">
            <b-form-select v-model="air.RefrigerationTemperature" :options="items"></b-form-select>
          </my-form>
          <my-form label="制冷湿度:">
            <b-form-select v-model="air.RefrigerationHumidity" :options="items"></b-form-select>
          </my-form>
          <my-form label="风速:">
            <b-form-select v-model="air.Speed" :options="items"></b-form-select>
          </my-form>
          <my-form label="制热模式:">
            <b-form-select v-model="air.HeatModel" :options="items"></b-form-select>
          </my-form>
          <my-form label="制冷模式:">
            <b-form-select v-model="air.ColdModel" :options="items"></b-form-select>
          </my-form>
          <my-form label="除湿:">
            <b-form-select v-model="air.Dehumidification" :options="items"></b-form-select>
          </my-form>
          <my-form label="加湿:">
            <b-form-select v-model="air.Humidification" :options="items"></b-form-select>
          </my-form>
          <b-button variant="info" block @click="addDevConstent('air')">提交</b-button>
        </b-form>

        <!-- TH -->
        <b-form v-if="ProtocolType == 'th'">
          <my-form label="温度:">
            <b-form-select v-model="th.Temperature" :options="items"></b-form-select>
          </my-form>
          <my-form label="湿度:">
            <b-form-select v-model="th.Humidity" :options="items"></b-form-select>
          </my-form>

          <b-button variant="info" block @click="addDevConstent('th')">提交</b-button>
        </b-form>
        <!-- UPS -->
        <b-form v-if="ProtocolType == 'ups'">
          <my-form label="UPS型号:">
            <b-form-select v-model="ups.UPSModels" :options="items"></b-form-select>
          </my-form>
          <my-form label="电池温度:">
            <b-form-select v-model="ups.BatteryTemperature" :options="items"></b-form-select>
          </my-form>
          <my-form label="剩余容量:">
            <b-form-select v-model="ups.ResidualCapacity" :options="items"></b-form-select>
          </my-form>
          <my-form label="电池电压:">
            <b-form-select v-model="ups.BatteryVoltage" :options="items"></b-form-select>
          </my-form>
          <my-form label="输出频率:">
            <b-form-select v-model="ups.OutputFrequency" :options="items"></b-form-select>
          </my-form>
          <my-form label="输出负载">
            <b-form-select v-model="ups.OutputLoad" :options="items"></b-form-select>
          </my-form>
          <b-button variant="info" block @click="addDevConstent('ups')">提交</b-button>
        </b-form>
        <!-- EM -->
        <!-- <b-form v-if="ProtocolType == 'em'">
          <my-form label="电池温度:">
            <b-form-select v-model="th.Temperature" :options="items"></b-form-select>
          </my-form>
          <my-form label="湿度:">
            <b-form-select v-model="th.Humidity" :options="items"></b-form-select>
          </my-form>

          <b-button variant="info" block @click="addDevConstent('em')">提交</b-button>
        </b-form>-->
      </b-col>
    </b-row>
  </my-page-user>
</template>

<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import {
  DevConstant_Air,
  protocol,
  DevConstant_EM,
  DevConstant_Ups,
  DevConstant_TH,
  protocolType
} from "../../../server/bin/interface";
export default Vue.extend({
  data() {
    const { ProtocolType, Protocol } = this.$route.query;
    return {
      ProtocolType,
      Protocol,
      ProtocolSingle: null,
      DevConstant: null,
      air: {
        //热通道温度
        HeatChannelTemperature: "",
        HeatChannelHumidity: "",
        //冷通道湿度
        ColdChannelTemperature: "",
        ColdChannelHumidity: "",
        //制冷温度
        RefrigerationTemperature: "",
        RefrigerationHumidity: "",
        // 风速
        Speed: "",
        //制热模式
        HeatModel: "",
        ColdModel: "",
        //除湿
        Dehumidification: "",
        // 加湿
        Humidification: ""
      },
      ups: {
        UPSModels: "",
        BatteryTemperature: "",
        ResidualCapacity: "",
        BatteryVoltage: "",
        OutputFrequency: "",
        OutputLoad: ""
      },
      em: {},
      th: {
        Temperature: "",
        Humidity: ""
      }
    };
  },
  computed: {
    items() {
      let ProtocolSingle: protocol = this.$data.ProtocolSingle;
      let i = 0;
      let result: any[] = [];
      if (ProtocolSingle) {
        ProtocolSingle.instruct.forEach(el => {
          el.formResize.forEach(ep => {
            result.push({
              text: `${i++}--${ep.isState ? "状态量" : "数值"}--${ep.name}`,
              value: ep.name
            });
          });
        });
      }
      return result;
    }
  },
  watch: {
    DevConstant: function(newVal) {
      if (newVal && newVal.Constant) {
        const Constant = newVal.Constant;
        const ProtocolType: string = this.$data.ProtocolType;
        let Dev = this.$data[ProtocolType];
        console.log({ Dev, newVal });
        const keys = Object.keys(Dev);
        keys.forEach(el => (Dev[el] = Constant[el]));
      }
    }
  },
  apollo: {
    ProtocolSingle: {
      query: gql`
        query getProtocol($Protocol: String) {
          ProtocolSingle: Protocol(Protocol: $Protocol) {
            instruct {
              formResize
            }
          }
        }
      `,
      variables() {
        return { Protocol: this.$data.Protocol };
      }
    },
    DevConstant: {
      query: gql`
        query getDevConstant($Protocol: String) {
          DevConstant: getDevConstant(Protocol: $Protocol) {
            Constant {
              # air
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
              # air && th
              Temperature
              Humidity
              # ups
              UPSModels
              BatteryTemperature
              ResidualCapacity
              BatteryVoltage
              OutputFrequency
              OutputLoad
            }
          }
        }
      `,
      variables() {
        return { Protocol: this.$data.Protocol };
      }
    }
  },
  methods: {
    addDevConstent(ProtocolType: protocolType) {
      const arg:
        | DevConstant_Air
        | DevConstant_EM
        | DevConstant_Ups
        | DevConstant_TH = this.$data[ProtocolType];

      const Protocol = this.Protocol;
      this.$apollo
        .mutate({
          mutation: gql`
            mutation addDevConstent(
              $Protocol: String
              $ProtocolType: String
              $type: String
              $arg: JSON
            ) {
              addDevConstent(
                Protocol: $Protocol
                ProtocolType: $ProtocolType
                type: $type
                arg: $arg
              ) {
                ok
                msg
                upserted
              }
            }
          `,
          variables: {
            arg,
            Protocol,
            type: "Constant",
            ProtocolType
          }
        })
        .then((res: any) => {
          const ok = res.data.addDevConstent.ok;
          if (ok > 0) {
            this.$bvToast.toast("配置success", {
              variant: "info",
              title: "Info"
            });
            this.$apollo.queries.DevConstant.refresh();
          }
        });
    }
  }
});
</script>

<style scoped></style>
