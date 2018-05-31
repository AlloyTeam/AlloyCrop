## AlloyCrop 1.0 发布

[AlloyCrop](https://github.com/AlloyTeam/AlloyCrop) 这个项目是8个月前发布的，作为[AlloyFinger](https://github.com/AlloyTeam/AlloyFinger) 的典型案例，发布之后被BAT等其他公司广泛使用。但是发布之后，有两个问题一直没有抽出时间去解决:

* 裁剪图像的分辨率太小，是否可配？
* pinch双指放大的时候，放大的中心不是双指中心，是否可以优化？

现在很高兴地告诉大家，AlloyCrop 已经完全搞定了上面两个问题，本文将解释新版本的变化和AlloyCrop背后的原理。当然AlloyFinger的原理这里就不再阐述，以前有分享过 [超小Web手势库AlloyFinger原理](./asset/alloyfinger.md)

先看全新的API变化。

## API

```js
new AlloyCrop({
	className: 'crop-box',
    image_src: "img src",
    circle: true, // optional parameters , the default value is false
    width: 200, // crop width
    height: 100, // crop height
    output: 2, // output resolution --> 400*200
    ok: function (base64, canvas) { },
    cancel: function () { },
    ok_text: "yes", // optional parameters , the default value is ok
    cancel_text: "no" // optional parameters , the default value is cancel
});
```

参数 |是否必填 | 意义
----|------|----
className | 不必须  | 裁剪 DOM 容器的 class
image_src | 必须  | 需要裁剪图片的src地址
circle | 不必须，默认是false  | 代表选取的是否是圆形还是矩形，默认是矩形，注意:圆形选取裁剪出来的也是正方形图片
width | 必须  | 选区的宽
height | 必须  | 选区的高
output | 必须 | 输出的倍率。比如如果output为2，选区的宽300，选区的高100，输出的图像的分辨率为 (2×300，2×100）
ok | 必须  | 点击ok按钮的回调
cancel | 必须  | 点击cancel按钮的回调
ok_text | 不必须，默认是ok  | ok按钮的文本
cancel_text | 不必须，默认是cancel  | cancel按钮的文本

与之前版本最主要的变化就是新增了 output 支持自定义倍率分辨率的图像输出。

## output原理

```js
crop: function () {
    this.calculateRect();
    this.ctx.drawImage(this.img, this.crop_rect[0], this.crop_rect[1], this.crop_rect[2], this.crop_rect[3], 0, 0, this.canvas.width, this.canvas.height);

},
```

其中 this.calculateRect() 是计算选取和图片重叠在一起的矩形区域，drawImage 是把裁剪的区域绘制到 canvas 上。注意 canvas 的宽高是多少？且看:

```js
this.canvas.width = option.width * this.output;
this.canvas.height = option.height * this.output;
```

所以就达到了自定义倍率分辨率的目的。当然这里图片的失真又或者超分辨，都取决于 drawImage 插值过程。关于插值，以前特意对比过，使用三次卷积插值完爆了其他几个,但是三次卷积插值速度也是最慢，所以浏览器内核要权衡效率和插值结果去实现 drawImage。

![img](http://images2017.cnblogs.com/blog/105416/201708/105416-20170801102838052-884320030.jpg)

## calculateRect计算裁剪区域

因为我们需要把图片的某个区域绘制到整个canvas上。所以drawImage的后四个参数为（0, 0, this.canvas.width, this.canvas.height），然后我们需要去计算图片裁剪的区域。

![pv](http://images2017.cnblogs.com/blog/105416/201708/105416-20170801103251646-2132149523.jpg)

大概就分上面两种情况，一种是完全包含，一种部分相交。

![](http://images2017.cnblogs.com/blog/105416/201708/105416-20170801104639005-638761920.jpg)

![](http://images2017.cnblogs.com/blog/105416/201708/105416-20170801104749802-38131761.jpg)

因为图片会被放大或者缩小(scale)，所以情况会变得稍微复杂一点点。求出相交的矩形区域后，要对图片scale进行校正，校正回到1的比例，才能用于drawImage。具体代码参见 [https://github.com/AlloyTeam/AlloyCrop/blob/master/alloy-crop.js#L227-L255](https://github.com/AlloyTeam/AlloyCrop/blob/master/alloy-crop.js#L227-L255)

## pinch 缩放优化

使用AlloyCrop是可以放大或者缩小再进行裁剪，怎么基于 pinch 的两个手指的中间进行放大呢？所以的秘密都在这个multipointStart里。

* multipointStart是AlloyFinger抛出的多手指开始碰到屏幕的回调函数，通过evt.touches拿到前两个手指的坐标去计算中心坐标
* 重置 originX 和 originY　到两手指的中心
* 再重置 translateX 和 translateY　去抹平　originX和originY变更带来的位移
	
```js
 new AlloyFinger(this.croppingBox, {
	multipointStart: function (evt) {
	    //reset origin x and y
	    var centerX = (evt.touches[0].pageX + evt.touches[1].pageX) / 2;
	    var centerY = (evt.touches[0].pageY + evt.touches[1].pageY) / 2;
	    var cr = self.img.getBoundingClientRect();
	    var img_centerX = cr.left + cr.width / 2;
	    var img_centerY = cr.top + cr.height / 2;
	    var offX = centerX - img_centerX;
	    var offY = centerY - img_centerY;
	    var preOriginX = self.img.originX
	    var preOriginY = self.img.originY
	    self.img.originX = offX / self.img.scaleX;
	    self.img.originY = offY / self.img.scaleY;
	    //reset translateX and translateY
	    self.img.translateX += offX - preOriginX * self.img.scaleX;
	    self.img.translateY += offY - preOriginY * self.img.scaleX;
	    self.initScale = self.img.scaleX;
	},
	pinch: function (evt) {
	    self.img.scaleX = self.img.scaleY = self.initScale * evt.zoom;
	},
	pressMove: function (evt) {
	    self.img.translateX += evt.deltaX;
	    self.img.translateY += evt.deltaY;
	    evt.preventDefault();
	}
});
```

* 注意，translateX, translateY, translateZ, scaleX, scaleY, scaleZ, rotateX, rotateY, rotateZ, skewX, skewY, originX, originY, originZ 都是 [css3transform 类库](https://alloyteam.github.io/AlloyTouch/transformjs/) 注入到DOM元素上的属性。


## Preview

![Preview](http://images2017.cnblogs.com/blog/105416/201707/105416-20170731173956990-1895070647.jpg)

## Install

You can install it via npm:

```html
npm install alloycrop
```

Or get it from CDN:

[https://unpkg.com/alloycrop@1.0.4/alloy-crop.js](https://unpkg.com/alloycrop@1.0.4/alloy-crop.js)

## Demo

![./asset/alloycrop.png](./asset/alloycrop.png)

## Dependencies

* [AlloyFinger](https://github.com/AlloyTeam/AlloyFinger)
* [css3transform](https://alloyteam.github.io/AlloyTouch/transformjs/)


## License
This content is released under the [MIT](http://opensource.org/licenses/MIT) License.