# Preview

![Preview](http://images2017.cnblogs.com/blog/105416/201707/105416-20170731173956990-1895070647.jpg)

# Install

You can install it via npm:

```html
npm install alloycrop
```

## API

```js
new AlloyCrop({
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

## Demo

![./asset/alloycrop.png](./asset/alloycrop.png)

# License
This content is released under the [MIT](http://opensource.org/licenses/MIT) License.