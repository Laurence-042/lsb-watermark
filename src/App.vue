<template>
  <v-app>
    <v-app-bar app color="blue darken-3" dark>
      <v-file-input
        accept="image/*"
        label="选择待加工图片"
        @change="selectMainImage"
      ></v-file-input>

      <v-file-input
        accept="image/*"
        label="选择水印（提取模式置空）"
        @change="selectSecondImage"
      ></v-file-input>

      <v-btn @click="process" text>执行</v-btn>

      <v-slider
        v-model="watermarkBits"
        label="水印位数"
        min="2"
        max="4"
      ></v-slider>

      <v-spacer></v-spacer>

      <!-- <v-text-field type="number" label="水印位数" v-model="watermarkBits"></v-text-field> -->

      <v-btn
        href="https://github.com/Laurence-042/lsb-watermark"
        target="_blank"
        text
      >
        <span>在Github查看代码</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-app-bar>
    <v-main>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <!-- 操作提示 -->
          <div v-show="firstImg == null">
            <p class="text-center text-h6">请先在顶栏处选取图片</p>
            <p class="text-center">使用方法：</p>
            <ol>
              <li>
                添加水印
                <ol>
                  <li>使用顶栏左侧上传待处理图片</li>
                  <li>使用顶栏右侧上传作为水印的图片</li>
                  <li>点击顶栏上的“执行”按钮</li>
                </ol>
              </li>
              <li>
                提取水印
                <ol>
                  <li>使用顶栏左侧上传待处理图片</li>
                  <li>（右侧留空）</li>
                  <li>点击顶栏上的“执行”按钮</li>
                </ol>
              </li>
              <li>
                水印位数默认为4，但对于某些图来说这个值高到足以让水印显现，您可能会想将其调到3或2
                <br />
                （请不要试图将其调到4以上或者2以下。我试过，那不好玩，所以我用滑条把它固定在了2、3、4这三个值）
              </li>
              <li>
                如果您使用4提取水印时发现还掺杂了原图的元素，那么可能是因为加水印时使用了2或3。
                <br />
                简单地调整水印位数然后再次点击执行即可！
                <br />
                但加水印时请不要这么做，除非您准备增大水印位数
                <br />
                ——因为我很懒，我没用加第三块canvas，加水印时是直接在原canvas上改的
              </li>
            </ol>
          </div>

          <!-- 输入区 -->
          <div
            id="inputArea"
            class="d-flex flex-column justify-center align-center full-width"
            v-show="firstImg != null"
          >
            <!-- 输出图片img -->
            <img :src="imageOut" class="full-width center-background" />
          </div>

          <!-- 辅助画布 -->
          <canvas v-show="false" class="full-width" id="main_canvas"></canvas>
          <canvas v-show="false" class="full-width" id="second_canvas"></canvas>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import ImageToolKit from "./util/ImageToolKit";

export default {
  name: "App",
  data: () => ({
    watermarkBits: 4,

    /**图片是否已加载 */
    firstImg: null,
    secondImg: null,
    imageOut: null,

    dx: 0,
    dy: 0,

    /**辅助画布 */
    main_canvas: null,
    second_canvas: null,
  }),
  mounted() {
    this.main_canvas = document.getElementById("main_canvas");
    this.second_canvas = document.getElementById("second_canvas");
  },
  methods: {
    selectMainImage(file) {
      if (file == null) {
        this.firstImg = null;
        this.secondImg = null;
        this.imageOut = null;
        return;
      }
      this.selectImage(file, (img) => {
        let ctx = this.main_canvas.getContext("2d");
        this.main_canvas.width = img.width;
        this.main_canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        this.firstImg = img;
      });
    },
    selectSecondImage(file) {
      if (file == null) {
        this.secondImg = null;
        return;
      }
      if (this.firstImg == null) {
        console.log("main first");
        return;
      }
      this.selectImage(file, (img) => {
        let ctx = this.second_canvas.getContext("2d");
        this.second_canvas.width = this.main_canvas.width;
        this.second_canvas.height = this.main_canvas.height;

        console.log(
          "main:" + this.main_canvas.width + " " + this.main_canvas.height
        );
        console.log(
          "main img:" + this.firstImg.width + " " + this.firstImg.height
        );
        console.log(
          "set second canvas to:" +
            this.second_canvas.width +
            " " +
            this.second_canvas.height
        );

        console.log(
          this.firstImg.width / img.width +
            " " +
            this.firstImg.height / img.height
        );

        let scale = Math.min(
          this.firstImg.width / img.width,
          this.firstImg.height / img.height
        );
        let newImageWidth = Math.ceil(img.width * scale);
        let newImageHeight = Math.ceil(img.height * scale);

        console.log("scale second from:" + img.width + " " + img.height);
        console.log("to:" + newImageWidth + " " + newImageHeight);

        this.dx = Math.ceil(this.second_canvas.width / 2 - newImageWidth / 2); //目标图像的坐标
        this.dy = Math.ceil(this.second_canvas.height / 2 - newImageHeight / 2); //目标图像的坐标

        ctx.drawImage(img, this.dx, this.dy, newImageWidth, newImageHeight);

        this.secondImg = img;
      });
    },
    /**选取本机图片作为输入 */
    selectImage(file, callback) {
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        let imageDataUrl = e.target.result;
        console.log("image readed");

        let img = new Image();
        img.onload = () => {
          console.log("image loaded");
          callback(img);
        };
        img.src = imageDataUrl;
      };
    },
    process() {
      if (this.secondImg != null) {
        this.merge();
      } else {
        this.split();
      }
      this.processed = true;
    },
    merge() {
      console.log("merge");
      let mainCtx = this.main_canvas.getContext("2d");
      let secondCtx = this.second_canvas.getContext("2d");

      console.log("main:" + mainCtx.width + " " + mainCtx.height);
      console.log("second:" + secondCtx.width + " " + secondCtx.height);

      let mainImage = mainCtx.getImageData(
        0,
        0,
        this.main_canvas.width,
        this.main_canvas.height
      );
      let secondImage = secondCtx.getImageData(
        0,
        0,
        this.second_canvas.width,
        this.second_canvas.height
      );

      let mainPixDivisor = 2 ** this.watermarkBits;
      let secondPixDivisor = 256 / 2 ** this.watermarkBits;

      for (let i = this.dy; i < mainImage.height - this.dy; i++) {
        for (let j = this.dx; j < mainImage.width - this.dx; j++) {
          let mainPix = ImageToolKit.getPixel(mainImage, i, j);
          let secondPix = ImageToolKit.getPixel(secondImage, i, j);

          mainPix.r =
            Math.floor(mainPix.r / mainPixDivisor) * mainPixDivisor +
            Math.floor(secondPix.r / secondPixDivisor);
          mainPix.g =
            Math.floor(mainPix.g / mainPixDivisor) * mainPixDivisor +
            Math.floor(secondPix.g / secondPixDivisor);
          mainPix.b =
            Math.floor(mainPix.b / mainPixDivisor) * mainPixDivisor +
            Math.floor(secondPix.b / secondPixDivisor);

          ImageToolKit.setPixel(mainImage, i, j, mainPix);
        }
        // console.log(i + "/" + mainImage.height);
      }
      mainCtx.putImageData(mainImage, 0, 0);

      this.imageOut = this.main_canvas.toDataURL();
      this.isImageProcessed = true;
    },
    split() {
      console.log("split");
      let mainCtx = this.main_canvas.getContext("2d");
      let secondCtx = this.second_canvas.getContext("2d");
      this.second_canvas.width = this.main_canvas.width;
      this.second_canvas.height = this.main_canvas.height;

      console.log("main:" + mainCtx.width + " " + mainCtx.height);

      let mainImage = mainCtx.getImageData(
        0,
        0,
        this.main_canvas.width,
        this.main_canvas.height
      );
      let secondImage = secondCtx.getImageData(
        0,
        0,
        this.second_canvas.width,
        this.second_canvas.height
      );

      let mainPixDivisor = 2 ** this.watermarkBits;
      let secondPixDivisor = 256 / 2 ** this.watermarkBits;

      for (let i = 0; i < mainImage.height; i++) {
        for (let j = 0; j < mainImage.width; j++) {
          let mainPix = ImageToolKit.getPixel(mainImage, i, j);

          mainPix.r = (mainPix.r % mainPixDivisor) * secondPixDivisor;
          mainPix.g = (mainPix.g % mainPixDivisor) * secondPixDivisor;
          mainPix.b = (mainPix.b % mainPixDivisor) * secondPixDivisor;

          ImageToolKit.setPixel(secondImage, i, j, mainPix);
        }
        // console.log(i + "/" + mainImage.height);
      }
      secondCtx.putImageData(secondImage, 0, 0);

      this.imageOut = this.second_canvas.toDataURL();
      this.isImageProcessed = true;
    },
  },
};
</script>

<style>
.full-width {
  width: 100%;
}
.margin-auto {
  margin: auto;
}
.canvas-group-wrapper {
  position: relative;
  overflow: hidden;
  /* background-image: linear-gradient(to bottom, #66ccff, #ee82ee); */
}
.center-background {
  background-position-x: center;
  background-position-y: center;
  background-size: cover;
}
.fixed-right-bottom {
  position: fixed !important;
  bottom: 1em;
  right: 1em;
}
</style>
