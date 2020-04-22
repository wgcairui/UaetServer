<template>
  <div>
    <my-head title="协议常量配置"></my-head>
    <b-container>
      <b-row>
        <b-col>
          <separated
            :title="'配置设备类型:' + ProtocolType + ',Protocol:' + Protocol"
          ></separated>
          <!-- air -->
          <b-form v-if="ProtocolType == 'air'">
            <b-form-group label="热通道温度:" v-bind="forGroup">
              <b-form-select
                v-model="air.HeatChannelTemperature"
                :options="items"
              ></b-form-select>
            </b-form-group>
            <b-form-group label="热通道湿度:" v-bind="forGroup">
              <b-form-select
                v-model="air.HeatChannelHumidity"
                :options="items"
              ></b-form-select>
            </b-form-group>
            <b-form-group label="冷通道温度:" v-bind="forGroup">
              <b-form-select
                v-model="air.ColdChannelTemperature"
                :options="items"
              ></b-form-select>
            </b-form-group>
            <b-form-group label="冷通道湿度:" v-bind="forGroup">
              <b-form-select
                v-model="air.ColdChannelHumidity"
                :options="items"
              ></b-form-select>
            </b-form-group>
            <b-form-group label="制冷温度:" v-bind="forGroup">
              <b-form-select
                v-model="air.RefrigerationTemperature"
                :options="items"
              ></b-form-select>
            </b-form-group>
            <b-form-group label="制冷湿度:" v-bind="forGroup">
              <b-form-select
                v-model="air.RefrigerationHumidity"
                :options="items"
              ></b-form-select>
            </b-form-group>
            <b-form-group label="风速:" v-bind="forGroup">
              <b-form-select
                v-model="air.Speed"
                :options="items"
              ></b-form-select>
            </b-form-group>
            <b-form-group label="制热模式:" v-bind="forGroup">
              <b-form-select
                v-model="air.HeatModel"
                :options="items"
              ></b-form-select>
            </b-form-group>
            <b-form-group label="制冷模式:" v-bind="forGroup">
              <b-form-select
                v-model="air.ColdModel"
                :options="items"
              ></b-form-select>
            </b-form-group>
            <b-form-group label="除湿:" v-bind="forGroup">
              <b-form-select
                v-model="air.Dehumidification"
                :options="items"
              ></b-form-select>
            </b-form-group>
            <b-form-group label="加湿:" v-bind="forGroup">
              <b-form-select
                v-model="air.Humidification"
                :options="items"
              ></b-form-select>
            </b-form-group>
            <b-button variant="info" block @click="addDevConstent('air')"
              >提交</b-button
            >
          </b-form>

          <!-- TH -->
          <b-form v-if="ProtocolType == 'th'">
            <b-form-group label="温度:" v-bind="forGroup">
              <b-form-select
                v-model="th.Temperature"
                :options="items"
              ></b-form-select>
            </b-form-group>
            <b-form-group label="湿度:" v-bind="forGroup">
              <b-form-select
                v-model="th.Humidity"
                :options="items"
              ></b-form-select>
            </b-form-group>

            <b-button variant="info" block @click="addDevConstent('th')"
              >提交</b-button
            >
          </b-form>
          <!-- TH -->
          <b-form v-if="ProtocolType == 'ups'">
            <b-form-group label="温度:" v-bind="forGroup">
              <b-form-select
                v-model="th.Temperature"
                :options="items"
              ></b-form-select>
            </b-form-group>
            <b-form-group label="湿度:" v-bind="forGroup">
              <b-form-select
                v-model="th.Humidity"
                :options="items"
              ></b-form-select>
            </b-form-group>

            <b-button variant="info" block @click="addDevConstent('ups')"
              >提交</b-button
            >
          </b-form>
          <!-- TH -->
          <b-form v-if="ProtocolType == 'em'">
            <b-form-group label="温度:" v-bind="forGroup">
              <b-form-select
                v-model="th.Temperature"
                :options="items"
              ></b-form-select>
            </b-form-group>
            <b-form-group label="湿度:" v-bind="forGroup">
              <b-form-select
                v-model="th.Humidity"
                :options="items"
              ></b-form-select>
            </b-form-group>

            <b-button variant="info" block @click="addDevConstent('em')"
              >提交</b-button
            >
          </b-form>
        </b-col>
      </b-row>
    </b-container>
  </div>
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
      forGroup: { "label-align-md": "right", "label-cols-md": "2" },
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
      ups: {},
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
        console.log({Dev,newVal});
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
              Temperature
              Humidity
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
