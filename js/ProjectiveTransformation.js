/**
 * @author Manato0x2cc
 * @version 1.0.0
 *
 *  __  __             ___  _   _
 * |  \/  | __ _  ___ / _ \| \ | |
 * | |\/| |/ _` |/ __| | | |  \| |
 * | |  | | (_| | (__| |_| | |\  |
 * |_|  |_|\__,_|\___|\___/|_| \_|
 *
 * MacON, the software which can paste your image to the coolest mac images.
 *
 * Copyright (c) 2017 Manato0x2cc
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 */

 // Some codes from http://jsdo.it/yaju3D/zUk5
 // Really thanks!!


var Point = (function() {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
})();


const BASEIMAGE_SIZE_BIG = 0;
const BASEIMAGE_SIZE_MEDIUM = 1;
const BASEIMAGE_SIZE_SMALL = 2;

function getTypefromString(str){
  switch(str){
    case "big":
      return BASEIMAGE_SIZE_BIG;
    case "medium":
      return BASEIMAGE_SIZE_MEDIUM;
    case "small":
      return BASEIMAGE_SIZE_SMALL;
  }
}

/**
 * BaseImage object
 * @arg
 * image(Image) ... image object
 * type(int) ... [0 => "big", 1 =>"medium", 2 => "small"]
 * name(string) ... mac image name
 */

var BaseImage = (function() {

    function BaseImage(image, type, name) {
        this.image = image;
        this.type = type;
        this.name = name;
    };

    var prot = BaseImage.prototype;

    BaseImage.prototype.getImage = function(){
      return this.image;
    };

    BaseImage.prototype.getType = function(){
      return this.type;
    };

    BaseImage.prototype.getName = function(){
      return this.name;
    };

    return BaseImage;
})();

var ProjectiveTransformation = (function() {

    /**
     * @param
     * canvasId(string)     ... canvas id which is drawn.
     * baseImage(BaseImage)   ... mac image.
     * pasteImage(Image)  ... image which is uploaded.
     * callback(function) ... function which is executed when finishing image processing.
     */
    function ProjectiveTransformation(canvasId, baseImage, pasteImage, callback) {
        var _this = this;
        this.origin = [];
        this.markers = [];
        this.vertexs = [];

        var canvas = document.getElementById(canvasId);

        this.width = canvas.width;
        this.height = canvas.height;
        this.context = canvas.getContext("2d");

        this.image = pasteImage;

        this.baseImage = baseImage;

        this.callback = callback;

        if(this.image.width < 2000){

          this.resize(function(){_this._imageReady()});

        }else this._imageReady();
    }

    ProjectiveTransformation.prototype.resize = function (callback) {

      var ctx = this.context;
      var canvas = ctx.canvas;

      var dstWidth = 2000;
      var dstHeight = 2000 / this.image.width * this.image.height;

      canvas.width = dstWidth;
      canvas.height = dstHeight;
      this.width = canvas.width;
      this.height = canvas.height;

      ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height, 0, 0, dstWidth, dstHeight);
      this.image.onload = function(e){
        callback();
      }
      this.image.src = ctx.canvas.toDataURL("image/png");
    };

    ProjectiveTransformation.prototype._imageReady = function(){
      var ctx = this.context;
      var w = this.image.width;
      var h = this.image.height;

      ctx.drawImage(this.image, 0, 0)

      this.input = ctx.getImageData(0, 0, w, h);

      this.origin = [
          [0, 0],
          [w, 0],
          [w, h],
          [0, h]
      ];

      this.markers = this.getMarkers();

      if(this.markers === null){
         alert("unknown error occurered");
         return;
      }

      this.render();
    }

    ProjectiveTransformation.prototype.rotate2d = function(x, y, rad) {
        var pt = new Point();
        pt.x = Math.cos(rad) * x - Math.sin(rad) * y;
        pt.y = Math.sin(rad) * x + Math.cos(rad) * y;
        return pt;
    };

    // http://sourceforge.jp/projects/nyartoolkit/document/tech_document0001/ja/tech_document0001.pdf
    ProjectiveTransformation.prototype.getParam = function(src, dest) {
        // X1 Y1 -X1x1 -Y1x1  A   x1 - C
        // X2 Y2 -X2x2 -Y2x2  B = x2 - C
        // X3 Y3 -X3x3 -Y3x3  G   x3 - C
        // X4 Y4 -X4x4 -Y4x4  H   x4 - C

        var Z = function(val) {
            return val == 0 ? 0.5 : val;
        }; //for division by 0

        var X1 = Z(src[0][0]);
        var X2 = Z(src[1][0]);
        var X3 = Z(src[2][0]);
        var X4 = Z(src[3][0]);
        var Y1 = Z(src[0][1]);
        var Y2 = Z(src[1][1]);
        var Y3 = Z(src[2][1]);
        var Y4 = Z(src[3][1]);

        var x1 = Z(dest[0][0]);
        var x2 = Z(dest[1][0]);
        var x3 = Z(dest[2][0]);
        var x4 = Z(dest[3][0]);
        var y1 = Z(dest[0][1]);
        var y2 = Z(dest[1][1]);
        var y3 = Z(dest[2][1]);
        var y4 = Z(dest[3][1]);

        var tx = mat4.create(new Float32Array([
            X1, Y1, -X1 * x1, -Y1 * x1, // 1st column
            X2, Y2, -X2 * x2, -Y2 * x2, // 2nd column
            X3, Y3, -X3 * x3, -Y3 * x3, // 3rd column
            X4, Y4, -X4 * x4, -Y4 * x4 // 4th column
        ]));

        mat4.inverse(tx);

        // A = tx11x1 + tx12x2 + tx13x3 + tx14x4 " C(tx11 + tx12 + tx13 + tx14)
        // B = tx21x1 + tx22x2 + tx32x3 + tx42x4 " C(tx21 + tx22 + tx23 + tx24)
        // G = tx31x1 + tx23x2 + tx33x3 + tx43x4 " C(tx31 + tx32 + tx33 + tx34)
        // H = tx41x1 + tx24x2 + tx34x3 + tx44x4 " C(tx14 + tx24 + tx34 + tx44)
        var kx1 = tx[0] * x1 + tx[1] * x2 + tx[2] * x3 + tx[3] * x4;
        var kc1 = tx[0] + tx[1] + tx[2] + tx[3];
        var kx2 = tx[4] * x1 + tx[5] * x2 + tx[6] * x3 + tx[7] * x4;
        var kc2 = tx[4] + tx[5] + tx[6] + tx[7];
        var kx3 = tx[8] * x1 + tx[9] * x2 + tx[10] * x3 + tx[11] * x4;
        var kc3 = tx[8] + tx[9] + tx[10] + tx[11];
        var kx4 = tx[12] * x1 + tx[13] * x2 + tx[14] * x3 + tx[15] * x4;
        var kc4 = tx[12] + tx[13] + tx[14] + tx[15];

        //Y point
        var ty = mat4.create(new Float32Array([
            X1, Y1, -X1 * y1, -Y1 * y1, // 1st column
            X2, Y2, -X2 * y2, -Y2 * y2, // 2nd column
            X3, Y3, -X3 * y3, -Y3 * y3, // 3rd column
            X4, Y4, -X4 * y4, -Y4 * y4 // 4th column
        ]));

        mat4.inverse(ty);

        // A = tx11x1 + tx12x2 + tx13x3 + tx14x4 " C(tx11 + tx12 + tx13 + tx14)
        // B = tx21x1 + tx22x2 + tx32x3 + tx42x4 " C(tx21 + tx22 + tx23 + tx24)
        // G = tx31x1 + tx23x2 + tx33x3 + tx43x4 " C(tx31 + tx32 + tx33 + tx34)
        // H = tx41x1 + tx24x2 + tx34x3 + tx44x4 " C(tx14 + tx24 + tx34 + tx44)
        var ky1 = ty[0] * y1 + ty[1] * y2 + ty[2] * y3 + ty[3] * y4;
        var kf1 = ty[0] + ty[1] + ty[2] + ty[3];
        var ky2 = ty[4] * y1 + ty[5] * y2 + ty[6] * y3 + ty[7] * y4;
        var kf2 = ty[4] + ty[5] + ty[6] + ty[7];
        var ky3 = ty[8] * y1 + ty[9] * y2 + ty[10] * y3 + ty[11] * y4;
        var kf3 = ty[8] + ty[9] + ty[10] + ty[11];
        var ky4 = ty[12] * y1 + ty[13] * y2 + ty[14] * y3 + ty[15] * y4;
        var kf4 = ty[12] + ty[13] + ty[14] + ty[15];

        var det_1 = kc3 * (-kf4) - (-kf3) * kc4;
        if (det_1 == 0) {
            det_1 = 0.0001;
        }

        det_1 = 1 / det_1;
        var param = new Array(8);
        var C = (-kf4 * det_1) * (kx3 - ky3) + (kf3 * det_1) * (kx4 - ky4);
        var F = (-kc4 * det_1) * (kx3 - ky3) + (kc3 * det_1) * (kx4 - ky4);

        param[2] = C; // C
        param[5] = F; // F
        param[6] = kx3 - C * kc3; // G
        param[7] = kx4 - C * kc4; // G
        param[0] = kx1 - C * kc1; // A
        param[1] = kx2 - C * kc2; // B
        param[3] = ky1 - F * kf1; // D
        param[4] = ky2 - F * kf2; // E

        return param;
    };

    ProjectiveTransformation.prototype.computeH = function(src, dest, min, max) {

        for (var i = 0; i < dest.length; i++) {
            var x = dest[i][0];
            var y = dest[i][1];
            if (x > max.x) {
                max.x = x;
            }
            if (y > max.y) {
                max.y = y;
            }
            if (x < min.x) {
                min.x = x;
            }
            if (y < min.y) {
                min.y = y;
            }
        }

        for (var i = 0; i < dest.length; i++) {
            dest[i][0] -= min.x;
            dest[i][1] -= min.y;
        }

        var param = this.getParam(src, dest);

        var mx = mat4.create(new Float32Array([
            param[0], param[1], param[2], 0, // 1st column
            param[3], param[4], param[5], 0, // 2nd column
            param[6], param[7], 1, 0, // 3rd column
            0, 0, 0, 1 // 4th column
        ]));

        mat4.inverse(mx);

        var inv_param = new Array(9);
        inv_param[0] = mx[0];
        inv_param[1] = mx[1];
        inv_param[2] = mx[2];
        inv_param[3] = mx[4];
        inv_param[4] = mx[5];
        inv_param[5] = mx[6];
        inv_param[6] = mx[8];
        inv_param[7] = mx[9];
        inv_param[8] = mx[10];

        return inv_param;
    };

    // Bilinear
    ProjectiveTransformation.prototype.drawBilinear = function(ctx, param, sx, sy, w, h) {
        var imgW = this.image.width;
        var imgH = this.image.height;
        var output = ctx.createImageData(w, h);
        for (var i = 0; i < h; ++i) {
            for (var j = 0; j < w; ++j) {
                //u = (x*a + y*b + c) / (x*g + y*h + 1)
                //v = (x*d + y*e + f) / (x*g + y*h + 1)
                var tmp = j * param[6] + i * param[7] + param[8];
                var tmpX = (j * param[0] + i * param[1] + param[2]) / tmp;
                var tmpY = (j * param[3] + i * param[4] + param[5]) / tmp;

                var floorX = tmpX | 0;
                var floorY = tmpY | 0;

                if (floorX >= 0 && floorX < imgW && floorY >= 0 && floorY < imgH) {

                    var dx = tmpX - floorX;
                    var dy = tmpY - floorY;

                    var rgb00 = this.getPixel(this.input, floorX, floorY, imgW, imgH);
                    var rgb10 = this.getPixel(this.input, floorX + 1, floorY, imgW, imgH);
                    var rgb01 = this.getPixel(this.input, floorX, floorY + 1, imgW, imgH);
                    var rgb11 = this.getPixel(this.input, floorX + 1, floorY + 1, imgW, imgH);

                    var r0 = (rgb00.R * (1 - dx)) + (rgb10.R * dx);
                    var r1 = (rgb01.R * (1 - dx)) + (rgb11.R * dx);
                    var R = (r0 * (1 - dy) + r1 * dy) | 0;

                    var g0 = (rgb00.G * (1 - dx)) + (rgb10.G * dx);
                    var g1 = (rgb01.G * (1 - dx)) + (rgb11.G * dx);
                    var G = (g0 * (1 - dy) + g1 * dy) | 0;

                    var b0 = (rgb00.B * (1 - dx)) + (rgb10.B * dx);
                    var b1 = (rgb01.B * (1 - dx)) + (rgb11.B * dx);
                    var B = (b0 * (1 - dy) + b1 * dy) | 0;

                    this.setPixel(output, j, i, R, G, B, 255);
                }
            }
        }
        ctx.putImageData(output, sx, sy);
    };

    ProjectiveTransformation.prototype.getPixel = function(imageData, x, y, w, h) {
        if (x == w) {
            x = w - 1;
        }
        if (y == h) {
            y = h - 1;
        }

        var pixels = imageData.data;
        var index = (imageData.width * y * 4) + (x * 4);
        if (index < 0 || index + 3 > pixels.length) {
            return undefined;
        }

        return {
            R: pixels[index + 0],
            G: pixels[index + 1],
            B: pixels[index + 2],
            A: pixels[index + 3]
        };
    };

    ProjectiveTransformation.prototype.setPixel = function(imageData, x, y, r, g, b, a) {
        var pixels = imageData.data;
        var index = (imageData.width * y * 4) + (x * 4);
        if (index < 0 || index + 3 > pixels.length) {
            return false;
        }

        pixels[index + 0] = r;
        pixels[index + 1] = g;
        pixels[index + 2] = b;
        pixels[index + 3] = a;

        return true;
    };


    ProjectiveTransformation.prototype.render = function() {
        var ctx = this.context;

        var min = new Point(0, 0);
        var max = new Point(0, 0);

        var inv_param = this.computeH(this.origin, this.markers, min, max);

        var w = max.x - min.x;
        var h = max.y - min.y;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        this.drawBilinear(ctx, inv_param, min.x, min.y, w, h);

        var baseImage = this.baseImage.image;

        var cback = this.callback;

        var im = new Image();
        im.onload = function(e){
          ctx.canvas.width = baseImage.width;
          ctx.canvas.height = baseImage.height;
          ctx.drawImage(baseImage, 0, 0);
          ctx.drawImage(im, 0, 0)
          var url = ctx.canvas.toDataURL("image/png");
          cback(url);
        }

        im.src = ctx.canvas.toDataURL("image/png");
    };


    ProjectiveTransformation.prototype.getMarkers = function() {
        var markers;

        switch (this.baseImage.getType()) {
            case BASEIMAGE_SIZE_BIG: //type big
                markers = MAC_MARKERS_BIG;
                break;

            case BASEIMAGE_SIZE_MEDIUM: //type medium
                markers = MAC_MARKERS_MEDIUM;
                break;

            case BASEIMAGE_SIZE_SMALL: //type small
                markers = MAC_MARKERS_SMALL;
                break;

            default: //unknown type
                console.log(`Type ${this.baseImage.getType()} is Unknown`);
        }

        var index = BASEIMAGE_NAMES.indexOf(this.baseImage.getName());

        return index === -1 ? null : markers[index];
    };

    return ProjectiveTransformation;
})();
