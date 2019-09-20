/* AlloyCrop v1.0.4
 * By dntzhang
 * Github: https://github.com/AlloyTeam/AlloyCrop
 */
;(function(){
    var AlloyFinger = typeof require === 'function'
        ? require('alloyfinger')
        : window.AlloyFinger
    var Transform = typeof require === 'function'
        ? require('css3transform').default
        : window.Transform

    var AlloyCrop = function (option) {
        this.renderTo = document.body;
        this.canvas = document.createElement("canvas");
        this.output = option.output;
        this.width = option.width;
        this.height = option.height;
        this.canvas.width = option.width * this.output;
        this.canvas.height = option.height * this.output;
        this.circle = option.circle;
        if (option.width !== option.height && option.circle) {
            throw "can't set circle to true when width is not equal to height"
        }
        this.ctx = this.canvas.getContext("2d");
        this.croppingBox = document.createElement("div");
        this.croppingBox.style.visibility = "hidden";
        this.croppingBox.className = option.className || '';
        this.cover = document.createElement("canvas");
        this.type = option.type || "png";
        this.cover.width = window.innerWidth;
        this.cover.height = window.innerHeight;
        this.cover_ctx = this.cover.getContext("2d");
        this.img = document.createElement("img");

        if(option.image_src.substring(0,4).toLowerCase()==='http') {
            this.img.crossOrigin = 'anonymous';//resolve base64 uri bug in safari:"cross-origin image load denied by cross-origin resource sharing policy."
        }
        this.cancel = option.cancel;
        this.ok = option.ok;

        this.ok_text = option.ok_text || "ok";
        this.cancel_text = option.cancel_text || "cancel";

        this.croppingBox.appendChild(this.img);
        this.croppingBox.appendChild(this.cover);
        this.renderTo.appendChild(this.croppingBox);
        this.img.onload = this.init.bind(this);
        this.img.src = option.image_src;

        this.cancel_btn = document.createElement('a');
        this.cancel_btn.innerHTML = this.cancel_text;
        this.ok_btn = document.createElement('a');
        this.ok_btn.innerHTML = this.ok_text;

        this.croppingBox.appendChild(this.ok_btn);
        this.croppingBox.appendChild(this.cancel_btn);

        this.alloyFingerList = [];
    };

    AlloyCrop.prototype = {
        init: function () {

            this.img_width = this.img.naturalWidth;
            this.img_height = this.img.naturalHeight;
            Transform(this.img,true);
            var scaling_x = window.innerWidth / this.img_width,
                scaling_y = window.innerHeight / this.img_height;
            var scaling = scaling_x > scaling_y ? scaling_y : scaling_x;
            /*this.initScale = scaling;
            this.originScale = scaling;
            this.img.scaleX = this.img.scaleY = scaling;*/
            this.initScale = scaling_x;
            this.originScale = scaling_x;
            this.img.scaleX = this.img.scaleY = scaling_x;
            this.first = 1;
            var self = this;
            this.alloyFingerList.push(new AlloyFinger(this.croppingBox, {
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

                    
                    if(self.first == 1){
                        self.img.scaleX = self.img.scaleY = self.initScale * 1.1;
                        ++self.first;
                    }

                    self.initScale = self.img.scaleX;
                    self.initcr = self.img.getBoundingClientRect();
                },
                pinch: function (evt) {
                    
                    var boxOffX = (document.documentElement.clientWidth - self.width) / 2;
                    var boxOffY = (document.documentElement.clientHeight - self.height)/2;
                    
                    var tempo = evt.zoom;
                    var dw = (self.initcr.width * tempo - self.initcr.width) / 2;
                    var dh = (self.initcr.height - self.initcr.height * tempo) / 2;
                    if ((self.initScale * tempo <= 10) && (self.initcr.left - dw <= boxOffX) && (self.initcr.right +
              		dw >= self.width + boxOffX) && (self.initcr.top + dh <= boxOffY) && (self.initcr.bottom -
          		dh >= self.height + boxOffY)) {
                        self.img.scaleX = self.img.scaleY = self.initScale * tempo;
                    }
                },
                pressMove: function (evt) {
                    var cr = self.img.getBoundingClientRect();
                    var boxOffY = (document.documentElement.clientHeight - self.height)/2;
                    if((boxOffY - cr.top - evt.deltaY >= 0) && (cr.bottom + evt.deltaY - boxOffY>= self.height)){
                        self.img.translateY += evt.deltaY;
                    }
                    var boxOffX = (document.documentElement.clientWidth - self.width)/2;
                    if((cr.left + evt.deltaX <= boxOffX) && (cr.right + evt.deltaX - boxOffX >= self.width)){
                        self.img.translateX += evt.deltaX;  
                    }
                    evt.preventDefault();
                }
            }));

            this.alloyFingerList.push(new AlloyFinger(this.cancel_btn, {
                touchStart:function(){
                    self.cancel_btn.style.backgroundColor = '#ffffff';
                    self.cancel_btn.style.color = '#3B4152';
                },
                tap: this._cancel.bind(this)
            }));

            this.alloyFingerList.push(new AlloyFinger(this.ok_btn, {
                touchStart:function(){
                    self.ok_btn.style.backgroundColor = '#2bcafd';
                    self.ok_btn.style.color = '#ffffff';
                },
                tap: this._ok.bind(this)
            }));

            this.alloyFingerList.push(new AlloyFinger(document, {
                touchEnd: function () {
                    self.cancel_btn.style.backgroundColor = '#ffffff';
                    self.ok_btn.style.backgroundColor = '#2bcafd';
                }
            }));

            this.renderCover();
            this.setStyle();

        },
        _cancel: function () {
            var self = this;
            setTimeout(function () {
                self.croppingBox && self._css(self.croppingBox, {
                    display: "none"
                });
            }, 300);
            this.cancel();
        },
        _ok: function () {
            this.crop();
            var self = this;
            setTimeout(function () {
                self.croppingBox && self._css(self.croppingBox, {
                    display: "none"
                });
            }, 300);
            this.ok(this.canvas.toDataURL("image/" + this.type), this.canvas);
        },
        renderCover: function () {
            var ctx = this.cover_ctx,
                w = this.cover.width,
                h = this.cover.height,
                cw = this.width,
                ch = this.height;
            ctx.save();
            ctx.fillStyle = "black";
            ctx.globalAlpha = 0.7;
            ctx.fillRect(0, 0, this.cover.width, this.cover.height);
            ctx.restore();
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            ctx.beginPath();
            if (this.circle) {
                ctx.arc(w / 2, h / 2, cw / 2 - 4, 0, Math.PI * 2, false);
            } else {
                ctx.rect(w / 2 - cw / 2, h / 2 - ch / 2, cw, ch)
            }
            ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = "white";
            if (this.circle) {
                ctx.arc(w / 2, h / 2, cw / 2 - 4, 0, Math.PI * 2, false);
            } else {
                ctx.rect(w / 2 - cw / 2, h / 2 - ch / 2, cw, ch)
            }
            ctx.stroke();
        },
        setStyle: function () {
            this._css(this.cover, {
                position: "fixed",
                zIndex: "100",
                left: "0px",
                top: "0px"
            });

            this._css(this.croppingBox, {
                color: "white",
                textAlign: "center",
                fontSize: "18px",
                textDecoration: "none",
                visibility: "visible"
            });

            this._css(this.img, {
                position: "fixed",
                zIndex: "99",
                left: "50%",
                // error position in meizu when set the top  50%
                top: window.innerHeight / 2 + "px",
                marginLeft: this.img_width / -2 + "px",
                marginTop: this.img_height / -2 + "px"
            });


            this._css(this.ok_btn, {
                position: "fixed",
                zIndex: "101",
                width: "100px",
                right: "50px",
                lineHeight: "40px",
                height: "40px",
                bottom: "20px",
                borderRadius: "2px",
                color: "#ffffff",
                backgroundColor: "#2bcafd"

            });

            this._css(this.cancel_btn, {
                position: "fixed",
                zIndex: "101",
                width: "100px",
                height: "40px",
                lineHeight: "40px",
                left: "50px",
                bottom: "20px",
                borderRadius: "2px",
                color: "#3B4152",
                backgroundColor: "#ffffff"

            });
        },
        crop: function () {
            this.calculateRect();
            //this.ctx.drawImage(this.img, this.crop_rect[0], this.crop_rect[1], this.crop_rect[2], this.crop_rect[3], 0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.img, this.crop_rect[0], this.crop_rect[1], this.crop_rect[2], this.crop_rect[3], 0, 0, this.crop_rect[2]*this.img.scaleX*this.output, this.crop_rect[3]*this.img.scaleY*this.output);

        },
        calculateRect: function () {
            var cr = this.img.getBoundingClientRect();
            var c_left = window.innerWidth / 2 - this.width / 2;
            var c_top = window.innerHeight / 2 - this.height / 2;
            var cover_rect = [c_left, c_top, this.width + c_left, this.height + c_top];
            var img_rect = [cr.left, cr.top, cr.width + cr.left, cr.height + cr.top];
            var intersect_rect = this.getOverlap.apply(this, cover_rect.concat(img_rect));
            var left = (intersect_rect[0] - img_rect[0]) / this.img.scaleX;
            var top = (intersect_rect[1] - img_rect[1]) / this.img.scaleY;
            var width = intersect_rect[2] / this.img.scaleX;
            var height = intersect_rect[3] / this.img.scaleY;

            if (left < 0) left = 0;
            if (top < 0) top = 0;
            if (left + width > this.img_width) width = this.img_width - left;
            if (top + height > this.img_height) height = this.img_height - top;

            this.crop_rect = [left, top, width, height];
        },
        // top left (x1,y1) and bottom right (x2,y2) coordination
        getOverlap: function (ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
            if (ax2 < bx1 || ay2 < by1 || ax1 > bx2 || ay1 > by2) return [0, 0, 0, 0];

            var left = Math.max(ax1, bx1);
            var top = Math.max(ay1, by1);
            var right = Math.min(ax2, bx2);
            var bottom = Math.min(ay2, by2);
            return [left, top, right - left, bottom - top]
        },
        _css: function (el, obj) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    el.style[key] = obj[key];
                }
            }
        },
        destroy: function () {
            this.alloyFingerList.forEach(function (alloyFinger) {
                alloyFinger.destroy();
            });
            this.renderTo.removeChild(this.croppingBox);
            for(var key in this) {
                delete this[key];
            }
        }
    };

    if (typeof module !== 'undefined' && typeof exports === 'object') {
        module.exports = AlloyCrop;
    }else {
        window.AlloyCrop = AlloyCrop;
    }
})();
