<template>
  <b-row>
    <b-col>
      <b-row>
        <b-col>
          <separated title="添加参数状态"></separated>
          <b-card>
            <b-form>
              <label class="m-3">
                <h5>Tips:</h5>
                <b>设备运行的参数值不在选中的状态将会触发告警</b>
              </label>
              <b-list-group>
                <b-list-group-item
                  v-for="(row,key) in AlarmStatItems"
                  :key="key+'12098'"
                  class="d-flex"
                >
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
            </b-form>
          </b-card>
        </b-col>
      </b-row>
    </b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { BvTableFieldArray } from "bootstrap-vue";
export default Vue.extend({
  data() {
    const { ProtocolType, Protocol } = this.$route.query;
    return {
      ProtocolType,
      Protocol,
      ProtocolSingle: null,
      //
      addModal: true,
      State: { name: "", value: "", unit: "{0:正常,1:报警}", alarmStat: [0] },
      selectNames: [] as Uart.ConstantAlarmStat[],
      States: [] as Uart.ConstantAlarmStat[]
    };
  },
  computed: {
    // 参数状态
    AlarmStatItems() {
      const ProtocolSingle: Uart.protocol = this.$data.ProtocolSingle;
      const DevConstant = this.States
      let result: any[] = [];
      // 如果协议单例存在
      if (ProtocolSingle && DevConstant) {
        // 转换系统和用户的配置为Map，如果未定义则填入空数组
        const MapSys = new Map(DevConstant.map(el => [el.name, el]));
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
                const alarmStat = MapSys.get(el3.name)?.alarmStat;
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
    },
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
    States: {
      query: gql`
        query getDevConstant($Protocol: String) {
          States: getDevConstant(Protocol: $Protocol) {
            AlarmStat {
              name
              alarmStat
            }
          }
        }
      `,
      variables() {
        return { Protocol: this.$data.Protocol };
      },
      update: data => data.States.AlarmStat
    }
  },
  methods: {
    
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
      }).filter(el => el.alarmStat.length > 0)
      await this.$apollo.mutate({
        mutation: gql`
          mutation addDevConstent( $Protocol: String, $ProtocolType: String,$type: String ,$arg: JSON) {
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
          arg: AlarmStat,
          Protocol: this.Protocol,
          type: "AlarmStat",
          ProtocolType: this.ProtocolType
        }
      });
      this.$apollo.queries.States.refetch();

    },

  }
  /* addState(selectNames: ConstantAlarmStat[]) {
    const AlarmStats = this.States;
    const State = this.State
    selectNames.forEach(S => {
      const n = AlarmStats.findIndex(el => el.name === S.name);
      S.alarmStat = State.alarmStat
      if (n === -1) {
        AlarmStats.push(S);
      } else AlarmStats[n] = S;
    });
  },
  deleteState(data: any) {
    const { item, index }: { item: ConstantAlarmStat; index: number } = data;
    this.States.splice(index, 1);
  },
  pushState(AlarmStats: ConstantAlarmStat[]) {
    const { ProtocolType, Protocol }: { ProtocolType: string; Protocol: string } = this.$data as any;
    this.$apollo.mutate({
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
      variables: { arg: AlarmStats, Protocol, type: "AlarmStat", ProtocolType }
    })
      .then((res: any) => {
        const ok = res.data.addDevConstent.ok;
        if (ok > 0) {
          this.$bvToast.toast("配置success", { variant: "info", title: "Info" });
          this.$apollo.queries.States.refetch();
        }
      });
  }
} */
});
</script>

<style scoped></style>
