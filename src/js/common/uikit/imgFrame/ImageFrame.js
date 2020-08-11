
define(function(require){

	// var $modal = require("./Modal");
	var tpl = require("../template/ImageFrame.html");
	// var tpl = require("text!../template/ImageFrame.html");
	var stg = require("./Stage");
	// var utils = require("./Utils");


	var ImageFrame = Backbone.View.extend({

		template:	Handlebars.compile(tpl),
		loading:	null,
		img:		null,
		body:		null,
		imgW:		null,
		imgH:		null,
		rotate:      0,
		events: {
			"click .font-close": "hide",
			"click .font-rotate": "rotateImg",
			"click .cover-floor": "hide",
			"click .prev": "showPrevImg",
			"click .next": "showNextImg",
		},

		timer:		0,


		initialize: function(){
			this.setElement(this.template());
			this.loading = this.$el.find("> svg");
			this.close = this.$el.find(".font-close");
			this.uiIconbtn = this.$el.find(".ui-cmp-iconbtn");
			this.hide();
			$("body").append(this.$el);
			this.listenTo(stg, "ui.window.resize", this.onWindowResize);
		},

		onMouseWheel: function(e){
			var x = e.pageX;
			var y = e.pageY;
			if(typeof (x) == "undefined"){
				x = e.originalEvent.pageX; // firefox
				y = e.originalEvent.pageY;
			}

			this.mousePoint = {
				x: x,
				y: y,
			};
			if(!this.img){
				return;
			}
			var ratio = 1.0;
			var delta = (e.originalEvent.wheelDelta && (e.originalEvent.wheelDelta > 0 ? 1 : -1)) || // chrome & ie
				(e.originalEvent.detail && (e.originalEvent.detail > 0 ? -1 : 1)); // firefox
			if(delta > 0){
				ratio = 1.05;
			}
			else if(delta < 0){
				ratio = 0.95;
			}
			this.changeSize(ratio);
			return false;
		},

		changeSize: function(ratio){
			clearTimeout(this.timer);
			var newW = this.img.width() * ratio;
			var newH = this.img.height() * ratio;
			this.newW = newW;
			this.newH = newH;
			var top = this.img.position().top;
			var left = this.img.position().left;
			var relativePosition = newW - newH;

			// 根据鼠标的当前位置计算移动缩放的偏移量
			var x_offsetRatio = (this.mousePoint.x - this.img.offset().left) / this.img.width();
			var y_offsetRatio = (this.mousePoint.y - this.img.offset().top) / this.img.height();
			var x_offset = x_offsetRatio * (this.img.width() - newW);
			var y_offset = y_offsetRatio * (this.img.height() - newH);
			this.img.css({
				width: newW,
				height: newH,
			});
			this.img.css({
				top: (this.rotate / 90) % 2 == 0 ? top + y_offset : relativePosition / 2 + top + y_offset,
				left: (this.rotate / 90) % 2 == 0 ? left + x_offset : -relativePosition / 2 + left + x_offset,
			});

			var me = this;
			// x,y方向超出可见区域，重新将图片中心位置移动到可见区域中心
			this.timer = setTimeout(function(){
				if(me.img.width() < me.$el.width()){
					var left = me.$el.width() / 2 - me.img.width() / 2;
					me.img.css({
						left: left,
					});
				}
				if(me.img.height() < me.$el.height()){
					var top = me.$el.height() / 2 - me.img.height() / 2;
					me.img.css({
						top: top,
					});
				}
			}, 1000);
		},

		show: function(src, chatGroupId, chatGroupSeqId){
			this.img = $("<img>");
			this.img.on("load", this.onLoaded.bind(this));
			this.img.on("error", this.onError.bind(this));
			this.$el.prepend(this.img);
			this.chatGroupId = chatGroupId;
			this.chatGroupSeqId = chatGroupSeqId;
			// $modal.show();
			this.$el.show();
			this.wait();
			this.img.attr("src", src);
			this.img.attr("data-chatgroupseqid", chatGroupSeqId);
			this.drap = false;
		},

		onLoaded: function(e){
			var targ = e.currentTarget;
			this.imgW = targ.clientWidth;
			this.imgH = targ.clientHeight;
			this.ready();
			this.fulfill(this.imgW, this.imgH);
			this.img.on("mousewheel DOMMouseScroll", this.onMouseWheel.bind(this));
		},

		onError: function(){
			this.hide();
		},

		hide: function(){
			clearTimeout(this.timer);
			this.rotate = 0;
			// $modal.hide();
			if(this.img){
				this.img.remove();
			}
			this.$el.hide();
			var prev = this.$el.find(">span.prev.font-path-arrow");
			var next = this.$el.find(">span.next.font-path-arrow");
			$(next).removeClass("disable");
			$(next).css("background", "#333");
			$(next).css("color", "#fff");
			$(prev).removeClass("disable");
			$(prev).css("background", "#333");
			$(prev).css("color", "#fff");
			this.wait();
			this.trigger("ui.dialog.hide");
			// 部分图片预览不需要展示左右翻页按钮，调用的地方隐藏，关闭时候恢复原状
			$(".ui-cmp-imgframe>.prev").show();
			$(".ui-cmp-imgframe>.next").show();
		},

		rotateImg: function(){
			this.rotate += 90;
			$(".ui-cmp-imgframe").find("img").css("transform", "rotate(" + this.rotate + "deg)");
		},

		fulfill: function(w, h){
			var pw = this.$el.width();
			var ph = this.$el.height();
			// var rect = utils.getFulfillSize(pw, ph, w, h, "fit");
			// this.img.css(rect.size);
		},

		onWindowResize: function(e){
			if(this.$el.is(":visible")){
				this.fulfill(this.imgW, this.imgH);
			}
		},

		wait: function(){
			this.close.hide();
			this.loading.show();
			this.img && this.img.css("visibility", "hidden");
		},

		ready: function(){
			this.close.show();
			this.loading.hide();
			this.img.css("visibility", "visible");
		},

		removing: function(){

		},

		getDef: function(){
			return ImageFrame;
		}

	});

	return new ImageFrame();

});
