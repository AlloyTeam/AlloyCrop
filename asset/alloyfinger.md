# 超小Web手势库AlloyFinger原理

目前[AlloyFinger](https://github.com/AlloyTeam/AlloyFinger)作为腾讯手机QQ web手势解决方案，在各大项目中都发挥着作用。
感兴趣的同学可以去Github看看：[https://github.com/AlloyTeam/AlloyFinger](https://github.com/AlloyTeam/AlloyFinger)

在腾讯，如：兴趣部落、QQ群、QQ动漫、腾讯学院、TEDxTencent、 AlloyTeam、腾讯CDC等多个部门、团队和项目都在使用AlloyFinger。如下图所示：

![](http://images2015.cnblogs.com/blog/105416/201611/105416-20161111095753405-852368951.png)


基本上只要有图像裁剪、图像查看的地方都会使用到AlloyFinger。因此AlloyFinger也入选了腾讯code平台的精品组件：


![](http://images2015.cnblogs.com/blog/105416/201611/105416-20161111095828124-1504358796.png)



除了国内外的项目团队都在使用AlloyFinger，国内外的各大IT网站也进行了转载报道，作为超级小的手势库，腾讯的web项目为什么不选择hammerjs而选择[AlloyFinger](https://github.com/AlloyTeam/AlloyFinger)?下面从各个角度、架构、原理上进行一下分析。

## 体积

![](http://images2015.cnblogs.com/blog/105416/201611/105416-20161111095834749-1098555058.png)


可以看到hammerjs体积远远大于AlloyFinger，对于手机QQ web加载速度性能追求极致的同学来说，使用hammerjs的大小是不可以接受的！
那么，为什么hammerjs这么大？看下架构设计便可知晓。

##架构设计

![](http://images2015.cnblogs.com/blog/105416/201611/105416-20161111095852327-1033161544.png)

![](http://images2015.cnblogs.com/blog/105416/201611/105416-20161111095857280-1590883491.png)


其实，hammerjs抽象出的Class还没有列举全，还有许多。所以过度工程化，导致其体积特别大。
一个好的设计并不需要把每个逻辑点都抽象出来，局部过程化，整体OO是可以。如AlloyFinger的设计。仅仅只有Vector2和AlloyFinger，在touchstart、touchmove、touchend是可以trigger出相关的手势事件的，简单、直接！hammerjs能支持的手势，AlloyFinger都能支持。

## 具体实现
众所周知，浏览器暴露了四个事件给开发者，touchstart touchmove touchend touchcancel，在这四个事件的回调函数可以拿到TouchEvent。
TouchEvent:
touches：当前位于屏幕上的所有手指动作的列表
targetTouches：位于当前 DOM 元素上的手指动作的列表
changedTouches：涉及当前事件的手指动作的列表
TouchEvent里可以拿到各个手指的坐标，那么可编程性就这么产生了。

## Tap点按

![](http://images2015.cnblogs.com/blog/105416/201611/105416-20161111095906045-733957741.png)


移动端click有300毫秒延时，tap的本质其实就是touchend。但是要判断touchstart的手的坐标和touchend时候手的坐标x、y方向偏移要小于30。小于30才会去触发tap。

## longTap长按

![](http://images2015.cnblogs.com/blog/105416/201611/105416-20161111095918014-817827393.png)

touchstart开启一个750毫秒的settimeout，如果750ms内有touchmove或者touchend都会清除掉该定时器。超过750ms没有touchmove或者touchend就会触发longTap

## swipe划

![](http://images2015.cnblogs.com/blog/105416/201611/105416-20161111095922889-1492134948.png)


这里需要注意，当touchstart的手的坐标和touchend时候手的坐标x、y方向偏移要大于30，判断swipe，小于30会判断tap。那么用户到底是从上到下，还是从下到上，或者从左到右、从右到左滑动呢？可以根据上面三个判断得出，具体的代码如下：
```js
_swipeDirection: function (x1, x2, y1, y2) {
        return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
}
```

## pinch捏
这个手势是使用频率非常高的，如图像裁剪的时候放大或者缩小图片，就需要pinch。

![](http://images2015.cnblogs.com/blog/105416/201611/105416-20161111095941233-1102331240.png)


如上图所示，两点之间的距离比值求pinch的scale。这个scale会挂载在event上，让用户反馈给dom的transform或者其他元素的scale属性。

##rotate旋转

![](http://images2015.cnblogs.com/blog/105416/201611/105416-20161111095946795-1685550144.png)


如上图所示，利用内积，可以求出两次手势状态之间的夹角θ。但是这里怎么求旋转方向呢？那么就要使用差乘（Vector Cross）。
利用cross结果的正负来判断旋转的方向。

![](http://images2015.cnblogs.com/blog/105416/201611/105416-20161111100002889-1355904474.png)


cross本质其实是面积，可以看下面的推导：

![](http://images2015.cnblogs.com/blog/105416/201611/105416-20161111100020467-1719129808.png)


所以，物理引擎里经常用cross来计算转动惯量，因为力矩其实要是力乘矩相当于面积：

![](http://images2015.cnblogs.com/blog/105416/201611/105416-20161111100026124-2061653823.png)


# 总结

主要的一些事件触发原理已经在上面讲解，还有如multipointStart、doubleTap、singleTap、multipointEnd可以看源码，不到200行的代码应该很容易消化。trigger手势事件的同时，touchStart、touchMove、touchEnd和touchCancel同样也可以监听。
详细的Vector2和AlloyFinger代码可以去Github上查阅：

* [https://github.com/AlloyTeam/AlloyFinger](https://github.com/AlloyTeam/AlloyFinger)

任何意见或者建议欢迎提issue：

* [https://github.com/AlloyTeam/AlloyFinger/issues](https://github.com/AlloyTeam/AlloyFinger/issues)