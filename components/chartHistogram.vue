/* eslint-disable */
<template>
  <ve-histogram
    :data="chartData"
    :extend="extend"
    :settings="chartSettings"
    :height="height"
  />
</template>

<script>
import { mapGetters } from "vuex"
export default {
  name: "ChartHistogram",
  computed: {
    ...mapGetters(["lang"]),
    chartSettings() {
      const label = {}
      Object.keys(this.items_filter).forEach(key => {
        label[key] = this.lang.get(key)
      })
      return {
        labelMap: label
      }
    },

    extend() {
      return {
        series: {
          label: { show: true, position: "top" }
        }
      }
    },
    chartData() {
      return {
        columns: ["日期", ...Object.keys(this.items_filter)],
        rows: [Object.assign({}, { 日期: "1/1" }, this.items_filter)]
      }
    },
    items_filter() {
      const item = {}
      for (const [key, val] of Object.entries(this.items)) {
        if (Number(val) && !key.includes("Time")) item[key] = val
      }
      return item
    },
    height() {
      let h = Object.keys(this.items_filter).length * 38
      if (h < 300) h = 300
      return `${h}px`
    }
  },
  props: {
    items: Object
  }
}
</script>
