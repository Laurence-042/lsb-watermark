let module={
  copyPixel(imageInData, imageOutData, row, col) {
      let originPixel =this.getPixel(imageInData,row,col);
      this.setPixel(imageOutData,row,col,originPixel);
  },
  RgbaToHEX(rgba) {
      return "#" + rgba.r.toString(16) + rgba.g.toString(16) + rgba.b.toString(16) + rgba.a.toString(16);
  },

  GetRgbaDistance(rgba0, rgba1) {
      return (rgba0.r - rgba1.r) ** 2 + (rgba0.g - rgba1.g) ** 2 + (rgba0.b - rgba1.b) ** 2 + (rgba0.a - rgba1.a) ** 2;
  },

  getPixelChannel(imageData, row, col, channel) {
      return imageData.data[row * (imageData.width * 4) + col * 4 + channel];
  },

  setPixelChannel(imageData, row, col, channel, value) {
      imageData.data[row * (imageData.width * 4) + col * 4 + channel] = value;
  },

  getPixel(imageData, row, col) {
      return {
          r: this.getPixelChannel(imageData, row, col, 0),
          g: this.getPixelChannel(imageData, row, col, 1),
          b: this.getPixelChannel(imageData, row, col, 2),
          a: this.getPixelChannel(imageData, row, col, 3)
      }
  },

  setPixel(imageData, row, col, rgba) {
      this.setPixelChannel(imageData, row, col, 0, rgba.r);
      this.setPixelChannel(imageData, row, col, 1, rgba.g);
      this.setPixelChannel(imageData, row, col, 2, rgba.b);
      this.setPixelChannel(imageData, row, col, 3, rgba.a);
  },

  addPixelNoClamp(pixel0,pixel1){
    return{
      r:pixel0.r+pixel1.r,
      g:pixel0.g+pixel1.g,
      b:pixel0.b+pixel1.b,
      a:pixel0.a+pixel1.a,
    }
  },

  clampTo254Copy(imageData){
    let res = new ImageData(imageData.width,imageData.height)

    for(let i=0;i<imageData.width;i++){
      for(let j=0;j<imageData.height;j++){
        let origin = module.getPixel(imageData,j,i)
        origin.r = origin.r==255?254:origin.r
        origin.g = origin.g==255?254:origin.g
        origin.b = origin.b==255?254:origin.b
        this.setPixel(res,j,i,origin)
      }
    }

    return res
  },

  gaussianFilterNoiseReductionCopy(imageData, level){
    if(level==0){
      return
    }

    function getWindowed(row,col){
      let left = Math.max(0,col-level)
      let right = Math.min(imageData.width-1,col+level)
      let up = Math.max(0,row-level)
      let down = Math.min(imageData.height-1,row+level)

      let pixelCount = (right-left)*(down-up)

      let sum = {r:0,g:0,b:0,a:0}

      for(let i=left;i<right;i++){
        for(let j=up;j<down;j++){
          sum = module.addPixelNoClamp(sum,module.getPixel(imageData,j,i))
        }
      }

      return {
        r:sum.r/pixelCount,
        g:sum.g/pixelCount,
        b:sum.b/pixelCount,
        a:sum.a/pixelCount
      }
    }

    let res = new ImageData(imageData.width,imageData.height)
    for(let i=0;i<imageData.width;i++){
      for(let j=0;j<imageData.height;j++){
        this.setPixel(res,j,i,getWindowed(j,i))
      }
    }
    return res

  },

  matrix(rows, cols, defaultValue) {
      var arr = [];
      // Creates all lines:
      for (var i = 0; i < rows; i++) {
          // Creates an empty line
          arr.push([]);
          // Adds cols to the empty line:
          arr[i].push(new Array(cols));
          for (var j = 0; j < cols; j++) {
              // Initializes:
              arr[i][j] = defaultValue;
          }
      }
      return arr;
  }
}

export default module