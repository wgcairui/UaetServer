<template>
  <div>
    <my-head title="图表" />
    <b-container>
      <b-row>
        <b-col cols="12">
          <separated title="选择参数"></separated>
          <b-form>
            <b-form-group label="Colletion:" label-for="colletion" v-bind="label">
              <b-form-select v-model="select.value" :options="select.option"></b-form-select>
            </b-form-group>
            <b-form-group label="选择时间:" label-for="TimePicker" v-bind="label">
              <b-form-datepicker id="TimePicker" v-model="datetime"></b-form-datepicker>
            </b-form-group>
          </b-form>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <separated title="折线图"></separated>
          <ve-line :data="line" />
        </b-col>
      </b-row>
      <!-- <b-row>
        <b-col cols="12">
          <b-form>
            <b-form-group
              label="选择时间:"
              label-for="TimePicker"
              v-bind="label"
            >
              <b-form-datepicker v-model="datetime"></b-form-datepicker>
            </b-form-group>
          </b-form>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="12">
          <ve-line :data="HisLine" />
        </b-col>
      </b-row>-->
    </b-container>
  </div>
</template>
<script>
import MyHead from "@/components/MyHead";
import separated from "../../components/separated";
import VeLine from "v-charts/lib/line.common";
import gql from "graphql-tag";
export default {
  components: {
    MyHead,
    VeLine,
    separated
  },
  data() {
    return {
      label: {
        labelCols: "12",
        labelColsSm: "2",
        labelAlignSm: "right"
      },
      select: {
        value: this.$route.query.name,
        option: []
      },
      Data: null,
      datetime: ""
    };
  },
  computed: {
    query() {
      return this.$route.query;
    },
    line() {
      const chartData = {
        columns: ["date", "PV"],
        rows: [
          { date: "01-01", PV: 1231 },
          { date: "01-02", PV: 1223 },
          { date: "01-03", PV: 2123 },
          { date: "01-04", PV: 4123 },
          { date: "01-05", PV: 3123 },
          { date: "01-06", PV: 7123 }
        ]
      };
      if (this.Data) {
        const colletion = this.select.value;
        chartData.rows = this.parseResult(this.Data, colletion);
        chartData.columns = ["time", colletion];
      }
      return chartData;
    }
  },
  watch: {
    datetime: function(newVal) {
      if (newVal === "") this.$apollo.queries.Data.pollInterval = 10 * 1000;
      else this.$apollo.queries.Data.pollInterval = 0;
    }
  },
  apollo: {
    Data: {
      query() {
        switch (this.query.type) {
          case "ut":
            return gql`
              query getUartTerminalData(
                $DevMac: String
                $pid: Int
                $datatime: String
              ) {
                UartTerminalDatas(
                  DevMac: $DevMac
                  pid: $pid
                  datatime: $datatime
                ) {
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
              datatime: this.datetime
            };
            break;
        }
      },
      update: data => data.UartTerminalDatas,
      fetchPolicy: "no-cache",
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
      const rows = [];
      if (this.select.option.length === 0) {
        data.forEach(({ result, time }) => {
          for (const i of result) {
            this.select.option.push(i.name);
          }
        });
      }
      data.forEach(({ result, time }) => {
        for (const i of result) {
          if (i.name == colletion) {
            rows.push({ [colletion]: i.value, time: this.parseTime(time) });
            continue;
          }
        }
      });
      return rows;
    }

    // 查询历史数据
    /* queryHisResultData() {
      const { start, end } = this.demo.value;
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
    }*/
  }
};
</script>
