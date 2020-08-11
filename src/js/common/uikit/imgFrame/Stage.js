define(function(require){

	var Stage;
	var utils = require("./Utils");

	var COME_EVT_PREFIX = "ui.window.comemsg.";
	var POST_EVT_PREFIX = "ui.window.postmsg.";
	var POST_EVENT = {};
	var COME_EVENT = {};
	(function(evts){
		_.each(evts, function(v){
			POST_EVENT[v] = POST_EVT_PREFIX + v.toLowerCase();
		});
	})([
		"PREVIEW_WEBIM",
		"PRINT",
		"VISITOR",
		"VISITOR_MSG",
		"ALICCC"
	]);
	(function(evts){
		_.each(evts, function(v){
			COME_EVENT[v] = COME_EVT_PREFIX + v.toLowerCase();
		});
	})([
		"ARTICLES",
		"AICPMSG",
		"ROBOT",
		"OPEN_SSID",
		"SENDMSG",
		"ONINIT",
		"ONSTATUSCHANGE",
		"ONCALLCOMING",
		"ONCALLDIALING",
		"ONCALLESTABLISH",
		"ONCALLRELEASE",
		"ONHANGUP",
		"ONERRORNOTIFY"
	]);


	Stage = Backbone.View.extend({

		isFocus:	true,
		width:		0,
		height:		0,
		title:		"",


		// 业务中使用 ui.window.postmsg/comemsg 前缀
		POST_EVENT:	POST_EVENT,
		COME_EVENT: COME_EVENT,

		// 向 iframe 发送时，使用 easemob.kefu. 做包名前缀
		pkgPostMsg: function(ifm, type, dat){
			var info = { easemob: { kefu: {} } };
			if(!~_.values(POST_EVENT).indexOf(type)){
				throw new Error("illegal postmessage type");
			}
			info.easemob.kefu[type.replace(POST_EVT_PREFIX, "")] = dat;
			ifm.postMessage(info, "*");
		},
		// 从 iframe 发送时，解包前缀 news. / easemob.kefu.
		onPostMessage: function(e){
			var me = this;
			// news 是兼容之前已经开放出去的文档（图文消息）
			// easemob.kefu 是正式定义的 postmsg 的包名（南京银行 -> 知识库）
			var oldFormPayload = utils.getDatByPath(e, "originalEvent.data.news");
			var payload = oldFormPayload || utils.getDatByPath(e, "originalEvent.data.easemob.kefu");
			if(typeof payload == "object"){
				_.each(payload, function(v, k){
					// 因为是第三方操作的，要验证数据有效性
					var t = COME_EVENT[k.toUpperCase()];
					if(v && t){
						me.trigger(
							t,
							// 1. 文档放出去的是 news.articles，发送后要和文档匹配，所以 news 又补回来了
							// 2. 如果 easemob.kefu.articles 发送过来也会触发本逻辑，只不过不再封包一层 news
							oldFormPayload
								? {
									news: {
										articles: v
									}
								}
								: v,
							e.originalEvent
						);
					}
				});
			}
		},

		initialize: function(){
			$(document.body).on("mouseleave", this.onWindowLeave.bind(this));

			$(window).on("click", this.onWindowClick.bind(this));
			$(window).on("mousemove", this.onWindowMove.bind(this));
			$(window).on("mouseup", this.onWindowUp.bind(this));

			$(window).on("resize", _.throttle(this.onWindowResize.bind(this), 100));
			$(window).on("focus", this.windowFocus.bind(this));
			$(window).on("blur", this.windowBlur.bind(this));

			$(window).on("message", this.onPostMessage.bind(this));

			$(document).on("dragenter", this.onWindowDragEnter.bind(this));
			$(document).on("drop", this.onWindowDrop.bind(this));

			$(window).on("online", this.getOnlineState.bind(this));
			$(window).on("offline", this.getOfflineState.bind(this));

			this.getWH();
		},

		getWH: function(){
			this.width = $("body").width();
			this.height = $("body").height();
		},

		onWindowClick: function(e){
			this.trigger("ui.window.click", e);
		},

		onWindowResize: function(e){
			this.getWH();
			this.trigger("ui.window.resize", e);
		},

		windowBlur: function(e){
			this.isFocus = false;
			this.trigger("ui.window.blur");
		},

		windowFocus: function(e){
			this.isFocus = true;
			this.trigger("ui.window.focus");
		},

		onWindowMove: function(e){
			this.trigger("ui.window.move", e);
		},

		onWindowUp: function(e){
			this.trigger("ui.window.up", e);
		},

		onWindowLeave: function(e){
			this.trigger("ui.window.leave", e);
		},

		onWindowDragEnter: function(e){
			// 阻止元素发生默认的行为。
			e.preventDefault();
			this.trigger("ui.window.dragenter", e);
		},

		onWindowDrop: function(e){
			e.preventDefault();
			this.trigger("ui.window.drop", e);
		},

		getOnlineState: function(e){
			this.trigger("ui.window.online", e);
		},

		getOfflineState: function(e){
			this.trigger("ui.window.offline", e);
		},

	})
	.superable({

		on: function(type){
			if(
				// 属于从 iframe 发送事件
				~type.indexOf(COME_EVT_PREFIX)
				// 并且找到实际映射
				&& !~_.values(COME_EVENT).indexOf(type)
			){
				throw new Error("illegal postmessage type");
			}
			this["super"]();
		},

	});

	return new Stage();

});
