<template>
  <my-page-user :title="`设备常量配置-${DevMac}-${pid}-${mountDev}`">
    <b-row>
      <b-col>
        <separated title="添加透传终端自定义配置"></separated>
        <b-tabs justified>
          <!-- ShowTag -->
          <b-tab title="显示参数">
            <b-table :items="items.ShowTags" :fields="fieldsSHowTag" selectable select-mode="multi">
              <template v-slot:cell(show)="row">
                <b-form-checkbox v-model="row.value" @change="selects(row.item)"></b-form-checkbox>
              </template>
            </b-table>
          </b-tab>
          <!-- Threshold -->
          <b-tab title="参数限值">
            <b-card>
              <b-form>
                <my-form label="属性:">
                  <b-form-select v-model="Thresholds.name" :options="items.ShowTags.map(el=>el.name)"></b-form-select>
                </my-form>
                <my-form label="最小值:">
                  <b-form-input type="number" v-model="Thresholds.min"></b-form-input>
                </my-form>
                <my-form label="最大值:">
                  <b-form-input type="number" v-model="Thresholds.max"></b-form-input>
                </my-form>
                <b-button size="sm" block variant="info" @click="addThreshold">添加</b-button>
              </b-form>
              <b-table :items="items.Thresholds" :fields="ThresholdsFields">
                <template v-slot:cell(oprate)="data">
                  <b-button-group size="sm">
                    <b-button @click="deleteThreshold(data.item)">删除</b-button>
                  </b-button-group>
                </template>
              </b-table>
            </b-card>
          </b-tab>
          <!-- Constant 
          <b-tab title="Constant"></b-tab>-->
        </b-tabs>
      </b-col>
    </b-row>
  </my-page-user>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import {
  protocol,
  queryResult,
  ProtocolConstantThreshold,
  userSetup,
  Threshold,
  ConstantThresholdType
} from "uart";
import { BvTableFieldArray } from "bootstrap-vue";
interface tags {
  name: string;
  show: boolean;
}
export default Vue.extend({
  data() {
    const { mountDev, pid, protocol, DevMac } = this.$route.query;
    return {
      mountDev,
      pid,
      protocol,
      DevMac,
      // threshold
      Thresholds: {
        name: "",
        min: 0,
        max: 0
      },
      ThresholdsFields: [
        "name",
        "min",
        "max",
        { key: "oprate", label: "操作" }
      ],
      fieldsSHowTag: [
        { key: "name", label: "名称" },
        { key: "show", label: "显示" }
      ] as BvTableFieldArray,
      DevConstant: {} as Pick<
        ProtocolConstantThreshold,
        "ProtocolType" | "ShowTag" | "Threshold"
      >,
      //
      userSetup: {} as ProtocolConstantThreshold
    };
  },
  computed: {
    items() {
      const DevConstant = this.DevConstant;
      const userSetup = this.userSetup;
      //
      let ShowTags: tags[] = [];
      if (DevConstant?.ShowTag) {
        ShowTags = DevConstant.ShowTag.map(el => ({ name: el, show: true }));
        // 判断用户配置是否是null
        if (userSetup && userSetup.ShowTag) {
          ShowTags.forEach(el => {
            if (!userSetup.ShowTag.includes(el.name)) el.show = false;
          });
        }
      }
      //
      let Thresholds = [] as Threshold[];
      if (DevConstant?.Threshold) {
        // 获取默认配置key
        const ThresholdMap = new Map(
          DevConstant.Threshold.map(el => [el.name, el])
        );
        if (userSetup?.Threshold) {
          userSetup.Threshold.forEach(el => {
            ThresholdMap.set(el.name, el);
          });
        }
        Thresholds = Array.from(ThresholdMap.values());
        console.log(Thresholds);
        
      }
      return { ShowTags, Thresholds };
    }
  },
  //
  apollo: {
    DevConstant: {
      query: gql`
        query getDevConstant($Protocol: String) {
          DevConstant: getDevConstant(Protocol: $Protocol) {
            ShowTag
            Threshold
          }
        }
      `,
      variables() {
        return { Protocol: this.$data.protocol };
      }
    },
    // 用户配置
    userSetup: {
      query: gql`
        query getUserDevConstant($Protocol: String) {
          userSetup: getUserDevConstant(Protocol: $Protocol) {
            ShowTag
            Threshold
          }
        }
      `,
      variables() {
        return { Protocol: this.$data.protocol };
      }
    }
  },
  methods: {
    // 添加删除showtags
    async selects(item: tags) {
      // 获取tag表
      const ShowTags = this.items.ShowTags;
      const ShowTag = new Set(
        ShowTags.filter(el => el.show).map(el => el.name)
      );
      if (item.show) {
        ShowTag.delete(item.name);
      } else {
        ShowTag.add(item.name);
      }
      this.pushThreshold(Array.from(ShowTag), "ShowTag");
    },
    // 添加阀值
    addThreshold() {
      const Threshold = JSON.parse(JSON.stringify(this.Thresholds))
      let data = [Threshold] as Threshold[];
      if (this.DevConstant?.Threshold) {
        const ThresholdMap = new Map(
          this.items.Thresholds.map(el => [el.name, el])
        );
        ThresholdMap.set(Threshold.name, Threshold);
        data = Array.from(ThresholdMap.values());
      }
      this.pushThreshold(data, "Threshold");
    },

    deleteThreshold(Threshold: Threshold) {
      const ThresholdMap = new Map(
        this.DevConstant.Threshold.map(el => [el.name, el])
      );
      ThresholdMap.delete(Threshold.name);
      const data = Array.from(ThresholdMap.values());
      this.pushThreshold(data, "Threshold");
    },
    async pushThreshold(
      arg: Threshold[] | string[],
      type: ConstantThresholdType
    ) {
      const isOk = await this.$apollo.mutate({
        mutation: gql`
          mutation setUserSetupProtocol(
            $Protocol: String
            $ProtocolType: String
            $type: String
            $arg: JSON
          ) {
            setUserSetupProtocol(
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
          Protocol: this.protocol,
          type,
          ProtocolType: ""
        }
      });
      this.$apollo.queries.userSetup.refetch({ Protocol: this.$data.protocol })
    }
  }
});
</script>
<style lang="scss" scoped>
.nav-link a {
  color: black;
}
</style>