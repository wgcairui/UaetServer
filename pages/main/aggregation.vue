<template>
  <div class="d-md-flex flex-column h-100">
    <b-row id="img" class="flex-grow-1 aggregation d-none d-sm-block">
      <b-col class="p-5">
        <div
          v-for="dev in devs.th"
          :key="dev.DevMac+dev.pid"
          class="my-3"
          @click="toDev(dev.DevMac,dev.pid,dev.mountDev,dev.protocol,dev.Type)"
        >
          <h6>
            <i class="text-success">{{dev.mountDev+'-'+dev.pid}}</i>
          </h6>
          <span class="mr-5">
            <i class="iconfont text-success">&#xe604;</i>
            <b class="text-light">{{dev.parse.Temperature.value }}&#8451;</b>
          </span>
          <span>
            <i class="iconfont text-primary">&#xe601;</i>
            <b class="text-light">{{ dev.parse.Humidity.value }}%</b>
          </span>
        </div>
      </b-col>
    </b-row>
    <b-row class="mian-bottom bg-dark mt-auto">
      <b-col
        cols="12"
        md="4"
        class="p-3 overflow-auto"
        v-for="(devs,key) in [devs.ups,devs.air,devs.em]"
        :key="key"
      >
        <div
          v-for="dev in devs"
          :key="dev.DevMac+dev.pid"
          class="row p-3"
          @click="toDev(dev.DevMac,dev.pid,dev.mountDev,dev.protocol,dev.Type)"
        >
          <span class="col-12 text-light border-bottom">
            <i>{{dev.mountDev}}{{dev.time}}</i>
          </span>
          <span
            v-for="(val,key) in Object.values(dev.parse)"
            :key="val.name+dev.DevMac+dev.pid+key"
            class="text-light col-12 col-md-6"
          >
            {{val.name+':'+val.value+(val.unit||'')}}
            <b-spinner
              v-if="val.alarm"
              small
              variant="danger"
              type="grow"
              label="Spinning"
              v-b-tooltip
              :title="`${val.name} 值超限`"
            ></b-spinner>
          </span>
        </div>
      </b-col>
    </b-row>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { Aggregation, AggregationDevParse } from "uart";
export default Vue.extend({
  data() {
    return {
      id: this.$route.query.id as string,
      aggregation: {} as Aggregation
    };
  },
  computed: {
    devs() {
      const a = {
        ups: [] as AggregationDevParse[],
        air: [] as AggregationDevParse[],
        em: [] as AggregationDevParse[],
        th: [] as AggregationDevParse[]
      };
      const aggregation = this.aggregation;
      if (aggregation?.devs) {
        aggregation.devs
          .filter(el => el.parse)
          .forEach(el => {
            switch (el.Type) {
              case "温湿度":
                a.th.push(el);
                break;
              case "空调":
                a.air.push(el);
                break;
              case "电量仪":
                a.em.push(el);
                break;
              case "UPS":
                a.ups.push(el);
                break;
            }
          });
      }
      return a;
    }
  },
  apollo: {
    aggregation: {
      query: gql`
        query aggregation($id: String) {
          aggregation: Aggregation(id: $id) {
            name
            devs
          }
        }
      `,
      variables() {
        return { id: this.$data.id };
      }
    }
  },
  methods: {
    toDev(
      DevMac: string,
      pid: string,
      mountDev: string,
      protocol: string,
      Type: string
    ) {
      const query = { DevMac, pid, mountDev, protocol };
      switch (Type) {
        case "温湿度":
          this.$router.push({ name: "uart-th", query });
          break;
        case "空调":
          this.$router.push({ name: "uart-air", query });
          break;
        case "电量仪":
          this.$router.push({ name: "uart-em", query });
          break;
        case "UPS":
          this.$router.push({ name: "uart-ups", query });
          break;
      }
    }
  }
});
</script>
<style lang="scss">
.container-fluid {
  margin-bottom: 0 !important;
}
.aggregation {
  opacity: 1;
  background-image: url("../../assets/aggregation.jpg");
  background-size: cover;
}
.mian-bottom {
  min-height: 25%;
}
</style>