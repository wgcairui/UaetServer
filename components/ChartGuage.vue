/* eslint-disable */
<template>
  <div class=" d-flex flex-row justify-content-center">
    <div
      class=" d-flex flex-column align-items-center"
      v-for="(v, key) in devs[devType]"
      :key="key"
    >
      <ve-gauge
        :data="chartDatas(v)"
        :settings="chartSettings(v)"
        height="290px"
        width="290px"
      ></ve-gauge>
      <b>{{ lang.get(v) }}</b>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  name: "ChartGuage",
  data() {
    return {
      chartData: {
        columns: ["type", "value"],
        rows: [{ type: "speed", value: 60 }]
      },
      devs: {
        ups: ["residual_capacity", "load_ratio"],
        power: [
          "active_power",
          "reactive_power",
          "power_factor",
          "quantity" /*
          "input_voltage" */
          /* "input_current",
          "input_current_l1",
          "input_current_l2",
          "input_current_l3", */
          /* "input_frequency",
          "input_frequency_l1",
          "input_frequency_l2",
          "input_frequency_l3"  */
        ]
      }
    };
  },
  computed: {
    ...mapGetters(["lang", "unit"])
  },
  props: { items: Object, devType: String },
  methods: {
    chartDatas(key) {
      let data = {
        columns: ["type", "value"],
        rows: [
          {
            type: this.unit.get(key),
            value: this.items[key][2]
              ? Math.round((this.items[key][2] / this.items[key][0]) * 10)
              : this.items[key]
          }
        ]
      };
      return data;
    },
    chartSettings(key) {
      let sets = {
        labelMap: {
          [this.unit.get(key)]: this.lang.get(this.unit.get(key))
        },
        dataName: {
          [this.unit.get(key)]: this.unit.get(key)
        }
      };
      return sets;
    }
  }
};
</script>

<style lang="scss" scoped></style>
