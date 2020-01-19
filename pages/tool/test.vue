<template>
  <div>
    <my-head title="test" />
    <b-container>
      <b-row>
        <b-col cols="12">
          <b-form>
            <b-form-group label="code:">
              <b-form-text>{{ code }}</b-form-text>
            </b-form-group>
            <b-form-group label="format:">
              <b-form-text>{{ format }}</b-form-text>
            </b-form-group>
            <b-button @click="start">start</b-button>
          </b-form>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="12">
          <b-card :title="error">
            <div id="interactive" class="viewport scanner">
                <video autoplay="true" preload="auto"></video>
            </div>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import MyHead from "@/components/MyHead";
import Quagga from "@ericblade/quagga2";
export default {
  components: { MyHead },
  data() {
    return {
      initData: {},
      code: "",
      format: "",
      error: ""
    };
  },
  methods: {
    start() {
      this.init();
      this.code = ""
      this.format = ""
      console.log("start");
    },
    onDetected(data) {
      console.log("onDetected");
      let { code, format } = data.codeResult;
      console.log({ code, format });
      this.format = format;
      this.code = code;
      Quagga.offDetected();
      Quagga.stop();
    },
    init() {
      Quagga.init(
        {
          // 给定图像中定位条形码
          locate: true,
          // 定义QuaggaJS中图像/视频的来源
          inputStream: {
            name: "Live",
            type: "LiveStream"
          },
          decoder: {
            readers: [
              "code_128_reader",
             /*  "ean_reader",
              "ean_8_reader",
              "code_39_reader",
              "code_39_vin_reader",
              "codabar_reader",
              "upc_reader",
              "upc_e_reader",
              "i2of5_reader",
              "2of5_reader",
              "code_93_reader" */
            ]
          },
          // 定义了输入图像的物理尺寸和其他属性
          constraints: {
            width: 440,
            height: 180,
            facingMode: "environment",
            aspectRatio: { min: 1, max: 2 }
          },
          locator: {
            patchSize: "medium",
            halfSample: true
          },
          frequency: 10,
          //  限制了图像的解码区域
          area: {
            // defines rectangle of the detection/localization area
            top: "40%", // top offset
            right: "20%", // right offset
            left: "20%", // left offset
            bottom: "40%" // bottom offset
          },
          // 有人要调试解码器的错误行为时才有用
          // singleChannel: false,
          // 解码器在找到有效条形码后是否应继续解码
          multiple: true,
          // 标志告诉定位器进程是否应该对缩小的图像
          halfSample: true,
          // 定义搜索网格的密度
          patchSize: "medium" // x-small, small, medium, large, x-large
        },
        (err) => {
          if (err) return (this.error = err.message);
          Quagga.onDetected(this.onDetected);
          Quagga.start();
        }
      );
    }
  },
  destroyed() {
    Quagga.stop();
  }
};
</script>
