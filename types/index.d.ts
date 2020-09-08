// 1. 确保在声明补充的类型之前导入 'vue'
import Vue from "vue";
import { CombinedVueInstance } from "vue/types/vue";
import { DollarApollo } from "vue-apollo/types/vue-apollo";
import { VueApolloComponentOptions } from "vue-apollo/types/options";
import { Auth } from "nuxtjs__auth";
import { BvModal, BvToast } from "bootstrap-vue";
import { NuxtAxiosInstance } from "@nuxtjs/axios";
import { Socket, Namespace } from "socket.io";
import { nodeInfo, NodeClient, queryResult, queryObject, DTUoprate, instructQuery } from "uart";

// 2. 定制一个文件，设置你想要补充的类型
//    在 types/vue.d.ts 里 Vue 有构造函数类型
declare module "vue/types/vue" {
  // 3. 声明为 Vue 补充的东西
  interface Vue {
    $axios: NuxtAxiosInstance;
    $apollo: DollarApollo<this>;
    $auth: Auth;
    $socket: SocketIOClient.Socket;
  }
  interface VueConstructor {
    $axios: NuxtAxiosInstance;
    $apollo: DollarApollo<this>;
    $auth: Auth;
    $bvModal: BvModal;
    $bvToast: BvToast;
    $socket: SocketIOClient.Socket;
  }
}
// type DataDef<Data, Props, V> = Data | ((this: Readonly<Props> & V) => Data);
declare module "vue/types/options" {
  interface ComponentOptions<
    V extends Vue,
    Data,
    Methods,
    Computed,
    PropsDef,
    Props
    > {
    apollo?: VueApolloComponentOptions<
      Data extends DataDef<infer D, any, any>
      ? CombinedVueInstance<V, D, Methods, Computed, Props>
      : CombinedVueInstance<V, Data, Methods, Computed, Props>
    >;
  }
  interface ComponentOptions<V extends Vue> {
    auth?: boolean | string;
  }
}

declare module '@nuxt/vue-app' {
  interface Context {
    $auth: Auth;
    $socket: SocketIOClient.Socket;
  }
}

declare module '@nuxt/types' {
  interface Context {
    $auth: Auth;
    $socket: SocketIOClient.Socket;
  }
}

declare module "socket.io" {
  interface Socket extends NodeJS.EventEmitter {
    on(event: 'disconnect', listener: () => void): this

    on(event: 'register', listener: (node: nodeInfo) => void): this

    on(event: 'ready', listener: () => void): this

    on(event: 'startError', listener: (arg: any) => void): this

    on(event: 'alarm', listener: (arg: any) => void): this

    on(event: 'terminalOn', listener: (data: string | string[], reline?: boolean) => void): this

    on(event: 'terminalOff', listener: (mac: string, active: boolean) => void): this
    on(event: 'terminalMountDevTimeOut', listener: (Query: queryResult, instruct: string[]) => void): this
    on(event: 'instructTimeOut', listener: (Query: queryResult, instruct: string[]) => void): this
    on(event: string, listener: (...args: any[]) => void): this

    emit(event: 'registerSuccess', node: NodeClient): this
    emit(event: 'query', Query: queryObject): this
    emit(event: 'instructQuery', Query: instructQuery): this
    emit(event: 'DTUoprate', Query: DTUoprate): this
    emit(event: string, ...args: any[]): this
  }

}
