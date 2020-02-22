<template>
  <div>
    <my-head title="图表"></my-head>
    <b-container>
      <b-row>
        <b-col>
          <ve-line :data="line"></ve-line>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="12">
          <b-form>
            <b-form-group label="选择时间:" label-for="TimePicker" v-bind="label">
              <VueCtkDateTimePicker
                id="TimePicker"
                v-model="demo.value"
                :range="demo.options.range"
                :format="demo.options.format"
                :formatted="demo.options.formatted"
                :color="demo.options.color"
                :locale="demo.options.locale"
                :custom-shortcuts="demo.customShortcuts"
              ></VueCtkDateTimePicker>
            </b-form-group>
            <b-button @click="queryHisResultData">查询历史</b-button>
          </b-form>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="12">
          <ve-line :data="HisLine"></ve-line>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import MyHead from "@/components/MyHead";
import VeLine from "v-charts/lib/line.common";
import VueCtkDateTimePicker from "vue-ctk-date-time-picker";
import "vue-ctk-date-time-picker/dist/vue-ctk-date-time-picker.css";
import gql from "graphql-tag";
export default {
  components: {
    MyHead,
    VeLine,
    VueCtkDateTimePicker
  },
  data() {
    return {
      label: {
        labelCols: "12",
        labelColsSm: "2",
        labelAlignSm: "right"
      },
      chartData: {
        columns: ["date", "PV"],
        rows: [
          { date: "01-01", PV: 1231 },
          { date: "01-02", PV: 1223 },
          { date: "01-03", PV: 2123 },
          { date: "01-04", PV: 4123 },
          { date: "01-05", PV: 3123 },
          { date: "01-06", PV: 7123 }
        ]
      },
      Data: null,

      demo: {
        value: {
          start: "",
          end: ""
        },
        options: {
          locale: "zh-CN",
          range: true,
          formatted: "ll",
          format: "YYYY-MM-DD",
          color: "green"
        },
        customShortcuts: [
          { key: "thisWeek", label: "本周", value: "isoWeek" },
          { key: "lastWeek", label: "上周", value: "-isoWeek" },
          { key: "last7Days", label: "7天内", value: 7 },
          { key: "last30Days", label: "30天内", value: 30 },
          { key: "thisMonth", label: "本月", value: "month" },
          { key: "lastMonth", label: "上月", value: "-month" }
        ]
      },
      // HisData
      HisData: null
    };
  },
  computed: {
    query() {
      return this.$route.query;
    },
    line() {
      let chartData = JSON.parse(JSON.stringify(this.chartData));
      if (this.Data) {
        let colletion = this.query.name;
        chartData.rows = this.parseResult(this.Data, colletion);
        chartData.columns = ["time", colletion];
      }
      return chartData;
    },
    HisLine() {
      let chartData = JSON.parse(JSON.stringify(this.chartData));
      if (this.HisData) {
        if (this.HisData.length > 10000) {
          this.$bvModal.msgBoxOk("数据长度超过10000条，将截断超出数据");
          this.HisData = this.HisData.slice(
            this.HisData.length - 10000,
            this.HisData.length
          );
        }
        let colletion = this.query.name;
        chartData.rows = this.parseResult(this.HisData, colletion).reverse();
        chartData.columns = ["time", colletion];
      }
      return chartData;
    }
  },
  apollo: {
    Data: {
      query() {
        switch (this.query.type) {
          case "ut":
            return gql`
              query getUartTerminalData($DevMac: String, $pid: Int, $num: Int) {
                UartTerminalDatas(DevMac: $DevMac, pid: $pid, num: $num) {
                  result {
                    name
                    value
                  }
                  time
                }
              }
            `;
            break;
        }
      },
      variables() {
        switch (this.query.type) {
          case "ut":
            return {
              pid: Number.parseInt(this.$route.query.pid),
              DevMac: this.$route.query.DevMac,
              num: 100
            };
            break;
        }
      },
      update: (data) => data.UartTerminalDatas,
      fetchPolicy: "network-first",
      pollInterval: 10 * 1000
    }
  },
  methods: {
    // 格式化时间
    parseTime(time) {
      const T = new Date(time);
      return `${T.getMonth() +
        1}/${T.getDate()} ${T.getHours()}:${T.getMinutes()}:${T.getSeconds()}`;
    },
    parseResult(data, colletion) {
      let rows = [];
      data.forEach(({ result, time }) => {
        for (let i of result) {
          if (i.name == colletion) {
            rows.push({ [colletion]: i.value, time: this.parseTime(time) });
            continue;
          }
        }
      });
      return rows;
    },
    // 查询历史数据
    queryHisResultData() {
      let { start, end } = this.demo.value;
      if (start === "" || end === "")
        return this.$bvModal.msgBoxOk("请选择时间范围");
      this.$apollo
        .query({
          query: gql`
            query getUartTerminalFragmentDatas(
              $DevMac: String
              $pid: Int
              $start: String
              $end: String
            ) {
              UartTerminalFragmentDatas(
                DevMac: $DevMac
                pid: $pid
                start: $start
                end: $end
              ) {
                result {
                  name
                  value
                }
                time
              }
            }
          `,
          variables: {
            pid: Number.parseInt(this.query.pid),
            DevMac: this.$route.query.DevMac,
            start,
            end: end + " 23:59:59"
          }
        })
        .then(({ data }) => (this.HisData = data.UartTerminalFragmentDatas));
    }
  }
};
</script>
