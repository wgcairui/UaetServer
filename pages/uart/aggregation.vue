<template>
  <my-page-user :title="aggregation.name" :fluid="true">
    <div class="d-flex flex-column h-100">
      <b-row id="img" class="flex-grow-1 aggregation">
        <b-ocl>
          <b-row no-gutters>
            <b-col>
              <span>ups</span>
              <div v-for="dev in devs.ups" :key="dev.DevMac+dev.pid">
                <p
                  v-for="(val,key) in Object.values(dev.parse)"
                  :key="val.name+dev.DevMac+dev.pid+key"
                  class="text-danger"
                >{{val.name+':'+val.value+(val.unit||'')}}{{val.alarm}}</p>
              </div>
            </b-col>
            <b-col>
              <span>air</span>
              <span v-for="dev in devs.air" :key="dev.DevMac+dev.pid">
                <p
                  v-for="(val,key) in Object.values(dev.parse)"
                  :key="val.name+dev.DevMac+dev.pid+key"
                  class="text-danger"
                >{{val.name+':'+val.value+(val.unit||'')}}{{val.alarm}}</p>
              </span>
            </b-col>
          </b-row>
          <b-row no-gutters>
            <b-col class="float-left">
              <b-col class="float-left">
                <span>em</span>
                <span v-for="dev in devs.em" :key="dev.DevMac+dev.pid">
                  <p
                    v-for="(val,key) in Object.values(dev.parse)"
                    :key="val.name+dev.DevMac+dev.pid+key"
                    class="text-danger"
                  >{{val.name+':'+val.value+(val.unit||'')}}{{val.alarm}}</p>
                </span>
              </b-col>
            </b-col>
            <b-col>
              <b-col class="float-left">
                <span>th</span>
                <span v-for="dev in devs.th" :key="dev.DevMac+dev.pid">
                  <p
                    v-for="(val,key) in Object.values(dev.parse)"
                    :key="val.name+dev.DevMac+dev.pid+key"
                    class="text-warning"
                  >{{val.name+':'+val.value+(val.unit||'')}}{{val.alarm}}</p>
                </span>
              </b-col>
            </b-col>
          </b-row>
        </b-ocl>
      </b-row>
      <b-row class="h-25 bg-dark mt-auto">
        <b-col
          cols="4"
          class="p-3 border shadow-sm rounded-sm h-100 overflow-auto"
          v-for="(devs,key) in [devs.ups,devs.air,devs.em]"
          :key="key"
        >
          <div v-for="dev in devs" :key="dev.DevMac+dev.pid" class="row p-3">
            <span class="col-12 text-light border-bottom">
              <i>{{dev.mountDev}}{{dev.time}}</i>
            </span>
            <span
              v-for="(val,key) in Object.values(dev.parse)"
              :key="val.name+dev.DevMac+dev.pid+key"
              class="text-light col-6"
            >{{val.name+':'+val.value+(val.unit||'')}}{{val.alarm}}</span>
          </div>
        </b-col>
      </b-row>
    </div>
  </my-page-user>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { Aggregation, AggregationDevParse } from "../../server/bin/interface";
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
        aggregation.devs.forEach(el => {
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
</style>