<template>
  <b-col xl="9" cols="12">
    <b-row class="d-flex">
      <separated class="col-12" title="透传终端信息"></separated>
      <b-col cols="12" md="6">
        <b-jumbotron class="m-0">
          <b-form>
            <b-form-group label="模块ID:" v-bind="label">
              <b-form-text class="terminal text-dark">
                {{
                DevMac
                }}
              </b-form-text>
            </b-form-group>
            <b-form-group label="模块IP:" v-bind="label">
              <b-form-text class="terminal text-dark">
                {{
                Terminals.ip
                }}
              </b-form-text>
            </b-form-group>
            <b-form-group label="模块端口:" v-bind="label">
              <b-form-text class="terminal text-dark">
                {{
                Terminals.port
                }}
              </b-form-text>
            </b-form-group>
            <b-form-group label="通讯参数:" v-bind="label">
              <b-form-text class="terminal text-dark">
                {{
                Terminals.uart
                }}
              </b-form-text>
            </b-form-group>
            <b-form-group label="ICCD:" v-bind="label">
              <b-form-text class="terminal text-dark">
                {{
                Terminals.ICCD
                }}
              </b-form-text>
            </b-form-group>
            <b-form-group label="GPS定位:" v-bind="label">
              <b-form-text class="terminal text-dark">{{ Terminals.jw || '没有gps信息时以IP模糊定位'}}</b-form-text>
            </b-form-group>
            <b-form-group label="模糊地址:" v-bind="label">
              <b-form-text class="terminal text-dark">{{address}}</b-form-text>
            </b-form-group>
            <b-form-group label="在线状态:" v-bind="label">
              <b-icon-toggle-on v-if="devState" variant="success" font-scale="2" class="mt-1"></b-icon-toggle-on>
              <b-icon-toggle-off v-else font-scale="2" class="mt-1"></b-icon-toggle-off>
            </b-form-group>
            <b-form-group label="更新时间:" v-bind="label">
              <b-form-text class="terminal text-dark">{{Terminals.uptime}}</b-form-text>
            </b-form-group>
          </b-form>
        </b-jumbotron>
      </b-col>
      <b-col cols="12" md="6">
        <amap id="terminal1" class="h-100" @ready="mapReady" />
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12">
        <separated title="挂载"></separated>
        <b-card>
          <ve-tree
            :data="chartData"
            :settings="treeSettings"
            @click="selectDev"
            :events="chartEvents"
          ></ve-tree>
        </b-card>
      </b-col>
    </b-row>
  </b-col>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { Terminal, TerminalMountDevs } from "uart";
import { VeTree } from "v-charts";
import { API_Aamp_gps2autoanvi, API_Aamp_local2address, API_Aamp_address2local, API_Aamp_ip2local, gps2AutonaviPosition } from "../../plugins/tools";
interface selectTree {
  Type: string;
  mountDev: string;
  protocol: string;
  pid: number;
}
export default Vue.extend({
  components: { VeTree },
  data() {
    const label = {
      labelCols: "12",
      labelColsSm: "2",
      labelAlignSm: "right"
    };
    return {
      address: "",
      //
      treeSettings: {
        seriesMap: {
          tree1: {
            symbol: (this as any).treeSysbol, //pin
            symbolSize: 36,
            label: {
              show: true,
              position: "top",
              fontSize: 20
            }
          }
        }
      },
      chartEvents: {
        click: (this as any).selectDev
      },
      //
      label,
      devState: false
    };
  },
  async asyncData({ route, query, app }) {
    const client = app.apolloProvider.defaultClient;
    // 路由query
    const DevMac = query.DevMac;
    const { data } = await client.query({
      query: gql`
        query getUserTerminal($DevMac: String) {
          Terminal(DevMac: $DevMac) {
            DevMac
            name
            ip
            port
            jw
            uart
            AT
            ICCID
            uptime
            mountNode
            mountDevs {
              Type
              name: mountDev
              mountDev
              protocol
              pid
            }
          }
        }
      `,
      variables: { DevMac }
    });
    let Terminal: Terminal = data.Terminal;
    // 构建tree对象
    const children = Terminal.mountDevs.map(el =>
      Object.assign(el, { name: el.mountDev + el.pid })
    );
    const Terminals = Object.assign(Terminal, { children });

    const chartData = {
      columns: ["name", "value"],
      rows: [
        { name: "tree1", value: [Terminals] }
      ]
    };
    return { chartData, Terminals, DevMac };
  },
  apollo: {
    devState: {
      query: gql`
        query getDevState($mac: String, $node: String) {
          devState: getDevState(mac: $mac, node: $node)
        }
      `,
      variables() {
        return {
          mac: this.$data.DevMac,
          node: this.$data.Terminals.mountNode
        };
      }
      // pollInterval: 1000
    }
  },

  methods: {
    // 根据设备类型返回不同的svg图标
    treeSysbol(a: null, { data }: { data: TerminalMountDevs }) {
      switch (data.Type) {
        case "温湿度":
          return "path://M349.866667 618.666667c-8.533333-4.266667-17.066667-8.533333-29.866667-8.533334-34.133333 4.266667-64 29.866667-64 68.266667 0 34.133333 29.866667 64 64 64S384 712.533333 384 678.4c0-8.533333-4.266667-17.066667-4.266667-25.6l358.4-358.4c8.533333-8.533333 8.533333-21.333333 0-29.866667-8.533333-8.533333-21.333333-8.533333-29.866666 0l-358.4 354.133334z m-34.133334-89.6L640 204.8c42.666667-42.666667 110.933333-42.666667 149.333333 0s42.666667 110.933333 0 149.333333L469.333333 678.4c0 81.066667-68.266667 149.333333-149.333333 149.333333S170.666667 759.466667 170.666667 678.4c0-85.333333 64-149.333333 145.066666-149.333333z m430.933334 341.333333c-59.733333 0-106.666667-51.2-106.666667-110.933333 0-38.4 34.133333-115.2 106.666667-230.4 72.533333 115.2 106.666667 192 106.666666 230.4 0 59.733333-46.933333 110.933333-106.666666 110.933333z m0-89.6c12.8 0 21.333333-17.066667 21.333333-42.666667 0-12.8-8.533333-34.133333-21.333333-81.066666-12.8 42.666667-21.333333 64-21.333334 81.066666 0 25.6 8.533333 42.666667 21.333334 42.666667z";
        case "电量仪":
          return "path://M547.328 499.712c-3.584-4.096-5.632-9.728-4.608-15.36l24.064-174.592-196.096 208.896h108.544c6.144 0 11.264 2.56 15.36 7.168 3.584 4.608 5.12 10.752 4.096 16.384l-35.84 177.152L662.016 506.88h-99.84c-5.632-0.512-11.264-3.072-14.848-7.168zM529.408 419.84L466.944 489.984c-5.12 5.632-13.312 6.144-18.944 1.024l-1.024-1.024c-5.632-5.12-6.144-13.312-1.024-18.944l62.464-70.144c5.12-5.632 13.312-6.144 18.944-1.024l1.024 1.024c5.632 4.608 6.144 13.312 1.024 18.944z";
        case "UPS":
          return "path://M1353.91512836 406.06401914V617.92755411c14.5365973 0 26.91587935-5.29216393 37.27267845-15.53098492 10.25567521-10.42421528 15.42986104-22.95518388 15.42986102-37.60975931V458.85082902c0-14.47760862-5.17418581-27.0085765-15.42143355-37.4327925-10.36522584-10.23882099-22.74450789-15.53098493-37.28110592-15.53098492v0.16854007zM1195.90020631 247.13897989H405.884587c-14.5365973 0-26.91587935 5.12362387-37.27267846 15.53941167-10.25567521 10.41578781-15.42986104 22.77821634-15.42986103 37.4327925v423.76077838c0 14.65457543 5.17418581 27.01700397 15.42143356 37.43279177 10.36522584 10.41578781 22.74450789 15.53941239 37.28110592 15.53941167h790.00719258c14.57873251 0 26.9495878-5.12362387 37.27267845-15.53941167 10.25567521-10.41578781 15.42986104-22.77821634 15.42986103-37.43279177V300.11961081c0-14.65457543-5.17418581-27.01700397-15.42143355-37.43279177-10.33151813-10.41578781-22.71080017-15.53941239-37.28110593-15.53941241zM405.884587 141.21142578h790.00719257c43.60979268 0 80.84876341 15.53941239 111.71691221 46.60980898 30.8681488 30.90185653 46.29800983 68.51161583 46.29800982 112.29837605 43.57608422 0 80.84876341 15.53941239 111.71691148 46.61823647 30.8681488 30.89342978 46.29800983 68.51161583 46.29800983 112.28994855v105.94440834c0 43.78675948-15.42986104 81.21955198-46.29800983 112.28994855-30.8681488 31.07882407-68.14082726 46.61823646-111.71691148 46.61823647 0 43.78675948-15.42986104 81.21955198-46.29800982 112.29837605-30.8681488 31.07039732-68.10711953 46.60980898-111.71691221 46.60980898H405.884587c-43.59293844 0-80.8656169-15.53941239-111.71691221-46.60980898C263.30795346 805.09151368 247.87809243 767.66714867 247.87809243 723.88038919V300.11961081c0-43.78675948 15.42986104-81.39651879 46.29800983-112.29837605C325.0189701 156.75083818 362.3000753 141.21142578 405.89301447 141.21142578z";
        case "空调":
          return "path://M862.16 592l-31.2-176.96A47.52 47.52 0 0 0 784 376H240a47.52 47.52 0 0 0-46.8 39.28L161.84 592a47.52 47.52 0 0 0 46.8 56h606.72a47.52 47.52 0 0 0 46.8-56zM672 584H216v-16h456z m88 0h-40v-16h40z";
        default:
          return "path://M934.438195 421.270603c-18.502399-1.678222-74.67577-13.710256-89.405239-45.833885-12.845563-27.965935 8.392134-67.408249 28.458145-95.573729l12.461823-17.498536L763.945149 133.835148l-18.564821 13.906731c-16.749476 12.559037-71.459518 45.049009-102.633518 30.248931-25.025976-11.906168-31.866778-54.790884-33.218566-88.652086l-0.975211-25.047466L415.090856 64.291259l-0.989537 25.042349c-1.343601 33.860179-8.18952 76.745918-33.206286 88.657202-31.117718 14.800078-85.903485-17.689894-102.645798-30.248931l-18.588357-13.93743L137.679709 262.36343l12.4608 17.502629c20.040429 28.120454 41.270962 67.524906 28.519544 95.485725-14.638395 32.06837-69.589938 44.023656-89.465614 45.922912l-23.707958 2.165316 0 78.425164-0.010233 0 0 95.952352 23.707958 2.164293c19.874653 1.90028 74.830289 13.860682 89.465614 45.925982 12.750395 27.957749-8.473999 67.3622-28.513404 95.477538L137.679709 758.89718l121.976052 128.556934 18.588357-13.938454c16.737196-12.559037 71.523987-45.052079 102.640682-30.257118 25.015743 11.917424 40.312124 54.340629 41.659819 88.204901l0 25.50386 178.535209 0 0-25.50386c1.353834-33.864272 16.641005-76.2885 41.657772-88.204901 31.179117-14.794961 85.888136 17.698081 102.642728 30.257118l18.564821 13.913894L885.947807 758.89718l-12.456706-17.510816c-20.075221-28.160363-41.313941-67.607794-28.468378-95.573729 14.734586-32.119535 70.90898-44.149523 89.410356-45.829791l23.712051-2.164293 0-95.173616 0.00614 0 0-79.204923L934.438195 421.270603zM919.893944 561.63956c-32.118512 6.79987-100.567463 15.175631-122.253368 62.420655-16.672728 36.346813 2.127454 79.118965 32.985252 128.866996l-76.514651 76.514651c-30.098505-18.252713-85.068468-56.340169-133.638673-33.32192-34.189683 16.189727-54.700833 65.454758-61.145615 121.447003l-95.036493 0c-6.439666-55.992245-26.954909-105.258299-61.151755-121.447003-48.544623-22.982434-106.653065 4.412496-136.76692 22.681582l-61.785182-65.123206c30.861892-49.748031 38.062897-93.270267 21.388123-129.618103-21.683858-47.245024-90.13588-55.620785-122.242112-62.420655l0-102.020558c32.111349-6.801916 100.567463-15.175631 122.257461-62.420655 16.667611-36.346813 9.468652-79.873142-21.393239-129.616056l61.784158-65.13344c30.108738 18.273179 88.212064 45.668109 136.767943 22.691815 68.775386-32.586163 57.653071-122.591059 57.653071-122.591059l102.020558 0c6.441713 55.993269 23.470551 106.397239 57.660234 122.591059 48.565089 23.017226 106.659205-4.433986 136.756687-22.691815l61.801555 65.13344c-30.861892 49.743938-38.061874 93.269243-21.400403 129.616056 21.685905 47.245024 90.14509 55.618738 122.253368 62.420655L919.893944 561.63956zM503.676427 317.805136c-107.792005 0-195.473997 87.716784-195.473997 195.550745 0 107.829867 83.065857 188.561563 190.857862 188.561563 107.782795 0 191.288674-83.457784 191.288674-191.286628C690.348967 402.796856 611.458199 317.805136 503.676427 317.805136zM499.086899 663.512762c-84.387969 0-153.032372-68.602448-153.032372-152.933111 0-84.334757 68.644403-152.936181 153.032372-152.936181 84.379783 0 153.025209 68.600401 153.025209 152.936181C652.112108 594.911338 583.466682 663.512762 499.086899 663.512762z";
      }
    },
    // 修改map
    async mapReady(map: AMap.Map) {
      const terminal = (this as any).Terminals as Terminal;
      let position = terminal.jw as AMap.LngLat;

      if (position) position = await gps2AutonaviPosition(position as any, window);
      else position = await API_Aamp_ip2local(terminal.ip as string);
      /* {
        console.log({lng:position.getLng(),lat:position.getLat()});
        
        if(position.getLng() === 0 && position.getLat() === 0){
          console.log("sss");
          
          position = await API_Aamp_ip2local(terminal.ip as string);
        }
      } */
      map.setCenter(position);
      map.setZoom(9);
      map.add(new window.AMap.Marker({ position }));
      const address = await API_Aamp_local2address([position.getLng(), position.getLat()].join(","));
      this.$data.address = address.regeocode.formatted_address;
    },
    //
    selectDev(item: any) {
      const { Type, mountDev, pid, protocol }: selectTree = item.data;
      if (!Type) return;
      const DevMac = <string>this.$route.query.DevMac;
      const query = { DevMac, pid: String(pid), mountDev, protocol };
      this.$router.push({ name: "main-device", query });
    }
  }
});
</script>
<style>
.terminal {
  font-size: 0.9rem;
  padding-top: 5px;
}
.text-muted {
  color: black !important;
}
.tree {
  min-height: 368px;
}
.treeclass .nodetree text {
  font-size: 18px !important;
  word-wrap: break-word;
}
.custom-control-input:checked ~ .custom-control-label::before {
  color: #fff;
  border-color: #28a745;
  background-color: #28a745;
}
@media (min-width: 576px) {
  .jumbotron {
    padding: 0;
  }
}
.jumbotron {
  padding: 2rem 1rem;
  margin-bottom: 2rem;
  background-color: #e9ecef;
  border-radius: 0.3rem;
}
.bm-view {
  width: 100%;
  height: 100%;
  padding-bottom: 32px;
}
</style>
