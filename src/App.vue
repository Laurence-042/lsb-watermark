<template>
  <v-app>
    <v-app-bar
      app
      :clipped-left="$vuetify.breakpoint.lgAndUp"
      color="blue darken-3"
      dark
    >
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

      <v-btn
        href="https://github.com/Laurence-042/color-change-image"
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
              <li>点击顶栏上传图片</li>
              <li>通过点击在图片中选中将要成为变色图变色部分的颜色</li>
              <li>
                在侧边栏中选择标记器（marker）进行标记，使用左键点击设置标记点，右键点击移除标记点（可选）
                <ol>
                  <li>
                    相似颜色标记器：选中与标记点相连通的，颜色差异小于阈值的区域
                  </li>
                  <li>曲线标记器：利用标记点圈出待处理区域的路径</li>
                </ol>
              </li>
              <li>
                使用标记区操作蒙版（mask），进行加工时会将当前标记区加入蒙版后，将蒙版区域当作待加工区域（可选）
              </li>
              <li>点“开始加工”按钮</li>
              <li>
                耐心等待加工完成，然后使用切换主题或者自定义背景色按钮来调整背景颜色预览变色图效果
              </li>
              <li>提示：替换对比度较低且不过亮过暗的颜色效果会比较好</li>
              <li>提示：按住左键可以拖动图片，滚轮可以缩放图片</li>
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
      if(file==null){
        this.firstImg=null
        this.secondImg=null
        this.imageOut=null
        return
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
      if(file==null){
        this.secondImg=null
        return
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

      for (let i = this.dy; i < mainImage.height - this.dy; i++) {
        for (let j = this.dx; j < mainImage.width - this.dx; j++) {
          let mainPix = ImageToolKit.getPixel(mainImage, i, j);
          let secondPix = ImageToolKit.getPixel(secondImage, i, j);

          if(i==100&&j==100){
            console.log(mainPix)
            console.log(secondPix)
          }

          mainPix.r =
            Math.floor(mainPix.r / 4) * 4 + Math.floor(secondPix.r / 64);
          mainPix.g =
            Math.floor(mainPix.g / 4) * 4 + Math.floor(secondPix.g / 64);
          mainPix.b =
            Math.floor(mainPix.b / 4) * 4 + Math.floor(secondPix.b / 64);

          if(i==100&&j==100){
            console.log(mainPix)
          }

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

      console.log("main:" + mainCtx.width + " " + mainCtx.height);

      let mainImage = mainCtx.getImageData(
        0,
        0,
        this.main_canvas.width,
        this.main_canvas.height
      );

      for (let i = 0; i < mainImage.height; i++) {
        for (let j = 0; j < mainImage.width; j++) {
          let mainPix = ImageToolKit.getPixel(mainImage, i, j);

          if(i==100&&j==100){
            console.log(mainPix)
          }

          mainPix.r = (mainPix.r % 4) * 64;
          mainPix.g = (mainPix.g % 4) * 64;
          mainPix.b = (mainPix.b % 4) * 64;

          if(i==100&&j==100){
            console.log(mainPix)
          }

          ImageToolKit.setPixel(mainImage, i, j, mainPix);
        }
        // console.log(i + "/" + mainImage.height);
      }
      mainCtx.putImageData(mainImage, 0, 0);

      this.imageOut = this.main_canvas.toDataURL();
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
