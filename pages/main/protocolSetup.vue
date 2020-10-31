<template>
  <b-col xl="9" cols="12">
    <separated title="添加透传终端自定义配置"></separated>
    <b-tabs justified>
      <!-- ShowTag -->
      <b-tab title="显示参数">
        <label class="m-3">
          <h5>Tips:</h5>
          <b>勾选的参数会显示在设备状态列表中,默认全部显示</b>
        </label>
        <b-table :items="items.ShowTags" :fields="fieldsSHowTag" selectable select-mode="multi">
          <template v-slot:cell(show)="row">
            <b-form-checkbox v-model="row.value" @change="selects(row.item)"></b-form-checkbox>
          </template>
        </b-table>
      </b-tab>
      <!-- Threshold -->
      <b-tab title="参数限值">
        <label class="m-3">
          <h5>Tips:</h5>
          <b>设备运行的参数值超出设定的最大值或最小值将会触发告警</b>
        </label>
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
      </b-tab>
      <!-- Constant -->
      <b-tab title="参数状态">
        <label class="m-3">
          <h5>Tips:</h5>
          <b>设备运行的参数值不在选中的状态将会触发告警</b>
        </label>
        <b-list-group>
          <b-list-group-item v-for="(row,key) in AlarmStatItems" :key="key+'12098'" class="d-flex">
            <span>{{row.name}}</span>
            <div class="ml-auto">
              <label v-for="(val,key) in row.show" :key="key" class="mx-1">
                <input
                  class
                  name="Fruit"
                  :checked="row.alarmStat.includes(val.value)"
                  type="checkbox"
                  :value="val.value"
                  @change="StateAlarmSelects(row,val.value)"
                />
                {{val.text}}
              </label>
            </div>
          </b-list-group-item>
        </b-list-group>
      </b-tab>
    </b-tabs>
  </b-col>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
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
      fieldsAlarmStat: [
        { key: "name", label: "名称" },
        { key: "show", label: "勾选正常状态" }
      ] as BvTableFieldArray,
      DevConstant: {} as Pick<
        Uart.ProtocolConstantThreshold,
        "ProtocolType" | "ShowTag" | "Threshold" | "AlarmStat"
      >,
      //
      userSetup: {} as Uart.ProtocolConstantThreshold,
      ProtocolSingle: null
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
      let Thresholds = [] as Uart.Threshold[];
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
      }
      // 参数状态

      return { ShowTags, Thresholds };
    },
    // 参数状态
    AlarmStatItems() {
      const DevConstant = this.$data.DevConstant as Uart.ProtocolConstantThreshold;
      const ProtocolSingle: Uart.protocol = this.$data.ProtocolSingle;
      const userSetup = this.userSetup;
      let result: any[] = [];
      // 如果协议单例存在
      if (ProtocolSingle) {
        // 转换系统和用户的配置为Map，如果未定义则填入空数组
        //console.log(DevConstant?.AlarmStat);

        const MapSys = new Map(
          DevConstant?.AlarmStat
            ? DevConstant.AlarmStat.map(el => [el.name, el])
            : []
        );
        const MapUser = new Map(
          userSetup?.AlarmStat
            ? userSetup.AlarmStat.map(el => [el.name, el])
            : []
        );
        console.log({ MapSys, MapUser });

        let i = 0;
        // 迭代协议参数值，取出状态值，把unit转为obj，如果参数有定义监控则写入监控，优先使用用户定义
        result = ProtocolSingle.instruct
          .map(el => {
            return el.formResize
              .filter(el2 => el2.isState)
              .map(el3 => {
                const show = (<string>el3.unit)
                  .replace(/(\{|\}| )/g, "")
                  .split(",")
                  .map(el4 => el4.split(":"))
                  .map(el5 => ({ text: el5[1], value: el5[0] }));
                const showKeys = show.map(el => el.value)
                const alarmStat =
                  MapUser.get(el3.name)?.alarmStat ||
                  MapSys.get(el3.name)?.alarmStat;
                return {
                  name: el3.name,
                  show,
                  alarmStat: Array.from(new Set(alarmStat || [])).filter(el => showKeys.includes(el))
                };
              });
          })
          .flat();
      }
      return result;
    }
  },
  //
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
        return { Protocol: this.$data.protocol };
      }
    },
    DevConstant: {
      query: gql`
        query getDevConstant($Protocol: String) {
          DevConstant: getDevConstant(Protocol: $Protocol) {
            ShowTag
            Threshold
            AlarmStat {
              name
              alarmStat
            }
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
            AlarmStat {
              name
              alarmStat
            }
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
    // 添加删除showtags
    async StateAlarmSelects(item: Uart.ConstantAlarmStat, value: string) {
      const StatSet = new Set(item.alarmStat);
      if (StatSet.has(value)) {
        StatSet.delete(value);
      } else {
        StatSet.add(value);
      }
      item.alarmStat = Array.from(StatSet);

      const AlarmStat = this.AlarmStatItems.map(el => {
        return {
          name: el.name,
          alarmStat: (<any[]>el.alarmStat).filter(el => el).map(el => String(el))
        }
      }).filter(el => el.alarmStat.length > 0) as any
      this.pushThreshold(AlarmStat, "AlarmStat");
    },
    // 添加阀值
    addThreshold() {
      const Threshold = JSON.parse(JSON.stringify(this.Thresholds));
      let data = [Threshold] as Uart.Threshold[];
      if (this.DevConstant?.Threshold) {
        const ThresholdMap = new Map(
          this.items.Thresholds.map(el => [el.name, el])
        );
        ThresholdMap.set(Threshold.name, Threshold);
        data = Array.from(ThresholdMap.values());
      }
      this.pushThreshold(data, "Threshold");
    },
    // 删除阈值
    deleteThreshold(Threshold: Uart.Threshold) {
      const ThresholdMap = new Map(
        this.DevConstant.Threshold.map(el => [el.name, el])
      );
      ThresholdMap.delete(Threshold.name);
      const data = Array.from(ThresholdMap.values());
      this.pushThreshold(data, "Threshold");
    },
    // 统一提交配置
    async pushThreshold(
      arg: Uart.Threshold[] | string[],
      type: Uart.ConstantThresholdType
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
      this.$apollo.queries.userSetup.refetch({ Protocol: this.$data.protocol });
    }
  }
});
</script>
<style lang="scss" scoped>
.nav-link a {
  color: black;
}
</style>