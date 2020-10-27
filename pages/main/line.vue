<template>
  <b-col xl="9" cols="12">
    <b-row>
      <b-col cols="12">
        <separated title="选择参数"></separated>
        <b-form>
          <b-form-group label="Colletion:" label-for="colletion" v-bind="label">
            <b-form-select
              v-model="select.value"
              :options="ShowTag"
            ></b-form-select>
          </b-form-group>
          <b-form-group label="选择时间:" label-for="TimePicker" v-bind="label">
            <b-form-datepicker
              id="TimePicker"
              v-model="datetime"
            ></b-form-datepicker>
          </b-form-group>
        </b-form>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <separated title="折线图" :back="false">{{ line.dates }}</separated>
        <b-overlay :show="$apollo.loading">
          <ve-line
            :data="line.chartData"
            :mark-line="markLine"
            :mark-point="markPoint"
            :data-zoom="dataZoom"
            :toolbox="toolbox"
          />
        </b-overlay>
      </b-col>
    </b-row>
  </b-col>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { queryResultSave } from "uart";
import 'echarts/lib/component/markLine'
import 'echarts/lib/component/markPoint'
import 'echarts/lib/component/dataZoom'
import 'echarts/lib/component/toolbox'
export default Vue.extend({
  data() {
    const query = this.$route.query;
    const label = {
      labelCols: "12",
      labelColsSm: "2",
      labelAlignSm: "right",
    };
    const markLine = {
      data: [
        {
          name: '平均线',
          type: 'average'
        }
      ]
    }
    const markPoint = {
      data: [
        {
          name: '最大值',
          type: 'max'
        }
      ]
    }
    const toolbox = {
      feature: {
        saveAsImage: {}
      }
    }
    return {
      markLine, markPoint, toolbox,
      query, label, select: { value: decodeURI(this.$route.query.name) }, Data: [] as queryResultSave[], datetime: "", ShowTag: []
    };
  },
  computed: {
    line() {
      const name = this.select.value as string;
      const Data = this.Data;
      const chartData = { columns: ["time", name], rows: [] as { [x: string]: any }[] };
      let dates = "";
      if (Data?.length > 0) {
        const ReverData = Data.reverse();
        const start = this.parseTime(ReverData[0].timeStamp as any);
        const endData = ReverData.pop();
        const end = this.parseTime(endData?.timeStamp as any);
        dates = `${start}--${end}`;
        chartData.rows = this.parseResult(ReverData);
      }
      return { chartData, dates };
    },
    dataZoom() {
      const Data = this.Data
      const Zoom: echarts.EChartOption.DataZoom.Slider = [
        {
          type: 'slider',
          start: 0
        }
      ]
      if (Data[0]) {
        Zoom[0].start = Data[0].timeStamp
      }
      return Zoom
    }
  },
  apollo: {
    Data: {
      query: gql`
        query getUartTerminalData( $DevMac: String, $name: String, $pid: Int, $datatime: String) {
          Data: UartTerminalDatas( DevMac: $DevMac, name: $name, pid: $pid, datatime: $datatime ) {
            result {
              name
              value
            }
            timeStamp
          }
        }
      `,
      variables() {
        const { pid, DevMac } = this.query;
        return { pid: parseInt(pid), name: this.select.value, DevMac, datatime: this.datetime };
      },
      fetchPolicy: "network-only",
      pollInterval: 10 * 1000
    },
    ShowTag: {
      query: gql`
        query getDevConstant($Protocol: String) {
          ShowTag: getDevConstant(Protocol: $Protocol) {
            ShowTag
          }
        }
      `,
      variables() {
        return { Protocol: this.query.protocol };
      },
      update: data => data.ShowTag.ShowTag
    }
  },
  methods: {
    // 格式化时间
    parseTime(time: string) {
      const T = new Date(parseInt(time));
      return `${T.getMonth() + 1}/${T.getDate()} ${T.getHours()}:${T.getMinutes()}:${T.getSeconds()}`;
    },
    parseResult(data: queryResultSave[]) {
      return data.map(el => {
        const { name, value } = el.result[0];
        return { time: this.parseTime(el.timeStamp as any), [name]: value };
      });
    }
  }
});
</script>
