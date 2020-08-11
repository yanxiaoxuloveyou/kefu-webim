define(function(require){

	var webapiObj = {

		api: "",

		get: function(obj){
			var url = utils.formatTpl(this.api, obj);
			return $.get(url);
		},

		put: function(dat, obj){
			var url = utils.formatTpl(this.api, obj);
			return $.ajax({
				url: url,
				type: "put",
				contentType: "application/json",
				data: JSON.stringify(dat),
			});
		},

		post: function(dat, obj){
			var url = utils.formatTpl(this.api, obj);
			return $.ajax({
				url: url,
				type: "post",
				contentType: "application/json",
				data: JSON.stringify(dat),
			});
		},

		del: function(obj){
			var url = utils.formatTpl(this.api, obj);
			return $.ajax({
				url: url,
				type: "delete",
				contentType: "application/json",
			});
		},

	};

	var utils = {
		/**
		 * 获取服务器当前时间：非严格精准时间，采用简单的同步计时策略,
		 * @return {int} timestamp
		 */
		// serverNow: function(){
		// 	var now = $.now();
		// 	var timeSpent = now - startClientTime;
		// 	var serverNow = startServerTime + timeSpent;
		// 	return serverNow;
		// },

		encode: function(str){
			if(!str) return "";
			var s = str || "";
			if(str.length == 0) return "";
			s = s.replace(/[<]/g, "&lt;");
			s = s.replace(/[>]/g, "&gt;");
			s = s.replace(/[']/g, "&#39;");
			s = s.replace(/["]/g, "&quot;");
			s = s.replace(/\n/g, "<br>");
			return s;
		},

		decode: function(str){
			return $("<div>").html(str).text();
		},

		// 99 过滤 url
		filterDomain: function(msg, tobe){
			if(!msg) return "";

			// 主要目的是让商户不会被接近 chuchujie.com 的 url 欺骗
			// 仅针对域名过滤，path 和 param 不处理。太复杂容易误伤。
			var re = /(?:https?:)?(?:\/\/)?(?:[a-z0-9_-]+\.)+(?:net|com|cn|[a-z]+):?(?:[0-9]{1,4})?\/?/ig;
			msg = msg.replace(re, function(match){
				return tobe || app.t("uikit.illegal_link");
			});
			return msg;
		},

		showLogin: function(){
			// 当后台返回 401 时，跳转登录页
			this.deleteAuthFlag();
			window.location.href = "/mo/signin";
		},

		showRobotLogin: function(){
		// 当后台返回 401 时，跳转登录页
			// this.deleteAuthFlag();
			window.location.href = "/mo/botLogin";
		},

		showAgent: function(domain){
			domain
				? window.location.href = "//" + domain + "/mo/agent"
				: window.location.href = "/mo/agent";
		},

		showRobotThridparty: function(domain){
			domain
				? window.location.href = "//" + domain + "/mo/admin/robot/thridparty"
				: window.location.href = "/mo/admin/robot/thridparty";
		},

		deleteAuthFlag: function(){
			$.cookie("authpass", null, {
				path: "/"
			});
			$.cookie("memberpass", null, {
				path: "/"
			});
		},

		showError: function(status){
			// 这里暂时不显示，如果有其它错误，也可以显示出来。

		},

		startCheckActivity: function(){
			var me = this;
			var isActivity = false;
			$("body").mousedown(function(){
				isActivity = true;
			});
			$("body").keydown(function(){
				isActivity = true;
			});
			$("body").mouseover(function(){
				isActivity = true;
			});
			setInterval(function(){
				if(!isActivity){
					// 没有活动
					// alert("checking activity, show login");
					me.showLogin();
				}

				// 检查完后，复位变成不活动。
				isActivity = false;
			}, 1000 * 60 * 30);
		},

		CallbackCache: function(){
			var funcArr = [];
			var paramsArr = [];

			// notice：params 最好就是原 arguments
			this.addCallback = function(func, params){
				funcArr.push(func);
				paramsArr.push(params);
			};

			this.run = function(){
				var i;
				for(i = 0; i < funcArr.length; i++){

					// null 了，减少传参吧，让各自 bind this 好了
					funcArr[i].apply(null, paramsArr[i]);
				}
				this.clear();
			};

			this.clear = function(){
				funcArr.length = paramsArr.length = 0;
			};

			this.getLen = function(){
				return funcArr.length;
			};
		},

		// showTooltip: function(x, y, contents){
		// 	tips
		// 	.text(contents)
		// 	.css({
		// 		left: 0,
		// 		top: 0
		// 	});

		// 	var legalX = $(document.body).width() - tips.outerWidth() - 38;
		// 	if(x > legalX){
		// 		tips.css("left", legalX);
		// 	}
		// 	else{
		// 		tips.css("left", x + 5);
		// 	}

		// 	tips.
		// 	css({
		// 		top:		y + 5,
		// 		visibility: "visible"
		// 	})
		// 	.show();
		// },

		cutText: function(str, len, suffix){
			var me = this;

			function leftB(str, len){
				var s = str.replace(/\*/g, " ").replace(/[^\x00-\xff]/g, "**");
				str = str.slice(0, s.slice(0, len).replace(/\*\*/g, " ").replace(/\*/g, "").length);
				if(me.byteLength(str) > len){
					str = str.slice(0, str.length - 1);
				}
				return str;
			}

			function shorten(str, len, suffix){
				if(me.byteLength(str) <= len){
					return str;
				}
				len = len - me.byteLength(suffix);
				suffix = suffix || "...";
				return leftB(str, len) + suffix;
			}
			return shorten(str, len, suffix);
		},

		byteLength: function(str){
			if(typeof str == "undefined"){
				return 0;
			}
			var aMatch = str.match(/[^\x00-\x80]/g);
			return (str.length + (!aMatch ? 0 : aMatch.length));
		},

		getDatByPath: function(obj, path){
			var found = false;
			var propPath = path.split(".");
			r(propPath.shift());

			function r(prop){
				if(typeof prop != "string"){
					return;
				}
				if((typeof obj != "object") || (obj == null)){
					found = false;
					return;
				}
				found = prop in obj;
				if(found){
					obj = obj[prop];
					r(propPath.shift());
				}
			}
			return found ? obj : false;
		},

		parseDuration: function(duration, opt){
			var h, m, s, ms,
				dur,
				o = {
					h: 0,
					m: 0,
					s: 0,
					ms: 0
				};
			if(duration != undefined){
				dur = Number(duration);
				opt || (opt = {});
				if(opt.type == "ms"){
					ms = dur % 1000;
					dur = Math.floor(dur / 1000);
				}
				h = Math.floor(dur / 3600);
				dur = dur % 3600;
				m = Math.floor(dur / 60);
				dur = dur % 60;
				s = dur;
				if(String(s).match(/(\.\d+)$/)){
					s = Number(dur.toFixed(opt.toFixed != undefined ? opt.toFixed : 1));
				}
				o = {
					h: h,
					m: m,
					s: s,
					ms: ms
				};
			}
			return o;
		},

		parseUrlSearch: function(url){
			var result = {};
			var kv = url ? (url.split("?")[1] || "") : window.location.search;
			kv = $.trim(kv.replace("?", ""));

			var tmp;
			var i;
			if(kv){
				kv = kv.split("&");
				for(i = 0; i < kv.length; i++){
					tmp = kv[i].split("=");
					result[tmp[0]] = (tmp[1] ? decodeURIComponent(tmp[1]) : null);
				}
			}
			return result;
		},

		parseUrl: function(url){
			var a = document.createElement("a");
			a.href = url;
			return {
				href:		url,
				origin:		a.protocol + "//" + a.hostname,
				hostname:	a.hostname,
				host:		a.host,
			};
		},

		formatTpl: function(tpl, oParam){
			var formatReg = new RegExp("{#([a-z0-9]+)}", "ig");
			tpl = tpl.replace(formatReg, function(match, f1, index, srcStr){
				return oParam[f1];
			});
			return tpl;
		},

		// random(20) => [0, 19] 随机数
		random: function(domain){
			return Math.random() * domain >> 0;
		},

		getImgBin: function(url, cb){
			url = this.proxyHttpsAvatar(url);
			var xhr = new XMLHttpRequest();

			// 此方法加载，如果抓到的是 cache 的，会报跨域错误
			var divChar = ~url.indexOf("?") ? "&" : "?";
			xhr.open("GET", url + divChar + new Date().getTime());
			xhr.responseType = "blob";

			// xhr.withCredentials = true;
			// xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			xhr.onload = function(e){
				xhr.onload = null;
				xhr = null;
				cb(e.target.response);
			};
			xhr.onerror = function(xhrProgEvt){
				cb();
			};
			xhr.send();
		},

		getAudioBin: function(tenantId, mediaId, cb){
			var url = "/v1/tenants/" + tenantId + "/mediafiles/" + mediaId + "/mp3";
			var xhr = new XMLHttpRequest();

			// 此方法加载，如果抓到的是 cache 的，会报跨域错误
			xhr.open("GET", url + "?" + new Date().getTime());
			xhr.setRequestHeader("accept", "audio/mp3");
			xhr.responseType = "blob";

			// xhr.withCredentials = true;
			// xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			xhr.onload = function(e){
				xhr.onload = null;
				xhr = null;
				cb(e.target.response);
			};
			xhr.onerror = function(xhrProgEvt){
				cb();
			};
			xhr.send();
		},

		proxyHttpsAvatar: function(url){
			// 是 ali 的图片
			if(url.indexOf("img-cn") > -1){
				// 但是还没有 proxy 过
				if(url.indexOf("ossimages") == -1){
					url = "/ossimages/" + url.slice(2);
				}
			}
			return url;
		},

		getWebAPI: function(){
			return _.extend({}, webapiObj);
		},

		getRemoteClass: function(name){
			var df = new $.Deferred();
			require([name], function(clz){
				df.resolve(clz);
			});
			return df;
		},

		getRemoteJs: function(name){
			var df = new $.Deferred();
			require([name], function(){
				df.resolve();
			});
			return df;
		},



		UUID: {
			/**
			 * The simplest function to get an UUID string.
			 * @returns {string} A version 4 UUID string.
			 */
			generate: function(){
				var rand = this._gri,
					hex = this._ha;
				return hex(rand(32), 8) // time_low
					+ "-" + hex(rand(16), 4) // time_mid
					+ "-" + hex(0x4000 | rand(12), 4) // time_hi_and_version
					+ "-" + hex(0x8000 | rand(14), 4) // clock_seq_hi_and_reserved clock_seq_low
					+ "-" + hex(rand(48), 12); // node
			},

			/**
			 * Returns an unsigned x-bit random integer.
			 * @param {int} x A positive integer ranging from 0 to 53, inclusive.
			 * @returns {int} An unsigned x-bit random integer (0 <= f(x) < 2^x).
			 */
			_gri: function(x){ // _getRandomInt
				if(x < 0){
					return NaN;
				}
				if(x <= 30){
					return (0 | Math.random() * (1 << x));
				}
				if(x <= 53){
					return (0 | Math.random() * (1 << 30)) + (0 | Math.random() * (1 << x - 30)) * (1 << 30);
				}
				return NaN;
			},

			/**
			 * Converts an integer to a zero-filled hexadecimal string.
			 * @param {int} num
			 * @param {int} length
			 * @returns {string}
			 */
			_ha: function(num, length){ // _hexAligner
				var str = num.toString(16),
					i = length - str.length,
					z = "0";
				for(; i > 0; i >>>= 1, z += z){
					if(i & 1){
						str = z + str;
					}
				}
				return str;
			},

		},

		getFulfillSize: function(pw, ph, w, h, mode){
			var isFit = false;
			switch(mode){
			case "full":
				isFit = false;
				break;
			case "fit":
				isFit = true;
				break;
			default:
				isFit = true;
				break;
			}
			var hRatio = 0;
			var wRatio = 0;
			if(pw / ph > w / h){
				if(isFit){ // 表示容器更长，图片缩放的瓶颈在 h，按照 h 来
					hRatio = ph / h;
				}
				else{ // 表示容器更长，图片要填满的是 w，按照 w 来
					wRatio = pw / w;
				}
			}
			else if(isFit){ // 表示容器更短，图片缩放的瓶颈在 w，按照 w 来
				wRatio = pw / w;
			}
			else{ // 表示容器更短，图片要填满的是 h，按照 h 来
				hRatio = ph / h;
			}
			if(wRatio && wRatio < 1){
				return {
					size: {
						width: pw,
						height: h * wRatio,
						top: (ph - h * wRatio) / 2,
						left: 0,
					},
					ratio: wRatio,
				};
			}
			else if(hRatio && hRatio < 1){
				return {
					size: {
						width: w * hRatio,
						height: ph,
						top: 0,
						left: (pw - w * hRatio) / 2,
					},
					ratio: hRatio,
				};
			}
			// 原样
			return {
				size: {
					width: w,
					height: h,
					top: (ph - h) / 2,
					left: (pw - w) / 2,
				},
				ratio: 1,
			};

		},

		// 验证密码含有“大写字母，小写字母、数字，符号至少包含两种”
		pswTypeValidate: function(val){
			var count = 0;
			if(/\d/.test(val)){
				count++;
			}
			if(/[A-Z]/.test(val)){
				count++;
			}
			if(/[a-z]/.test(val)){
				count++;
			}
			if(/[^A-Za-z0-9]/.test(val)){
				count++;
			}
			return count;
		},

		checkDomain: {
			HUANXIN:		{ domain: "kefu.",			name: app.t("domain.easemob") },
			AUTOHOME:		{ domain: "autohome.",		name: app.t("domain.autohome") },
			QIAO_FEI:		{ domain: "qiaofei.",		name: app.t("domain.qiaofei") },
			QIAO_FEI_ALIAS:	{ domain: "znkfys.",		name: app.t("domain.qiaofei") },
			WEIBO:			{ domain: "weibo.",			name: app.t("domain.weibo") },
			HOTTECH:		{ domain: "hottech.",		name: app.t("domain.hottech") },	// 火图
			KOREAN:			{ domain: "koreandemo.",	name: "" },
			ENGLISH:		{ domain: "rulai.",			name: "" },
			XDF:			{ domain: "xdf.",			name: "" },							// 新东方
			VAILLANT:		{ domain: "vaillant.",		name: app.t("domain.vaillant") },	// 狼烟科技
			WENDA:			{ domain: "wenda.",			name: app.t("domain.shanghao") },	// 尚好
			CWLY:			{ domain: "cwly1118.",		name: app.t("domain.cwly1118") },	// 翠微
			PEANUT_PLAN:	{ domain: "huashengplan.",	name: "" },							// 花生计划
			BEYOND_TEST:	{ domain: "bkb.",			name: app.t("domain.beyondtest") },	// BeyondSoft
			HUIXIAOYUN:		{ domain: "sz-sess.",		name: "" },							// 慧效云
			TAIBAO:			{ domain: "taibao.",		name: app.t("domain.taibao") },		// 太保
			HANGTIAN:		{ domain: "hangkezhineng.",	name: app.t("domain.szhtkc") },		// 深圳航天科创
			CIO_PAAS:		{ domain: "ciopaas.",		name: "全渠道智能客服平台" },			// 小 A 智能
			// 与百度合作的广东电网
			BAI_DU: {
				domain: [ "baidu.", "95598." ],
				name: ""
			},
			isDomain: function(val){
				val = _.isArray(val) ? val : [val];
				return _.some(val, function(d){ return ~window.location.host.toLowerCase().indexOf(d); });
			},
			hasSubDomain: function(){
				var host = window.location.host.toLowerCase();
				return !/^sandbox|^kefu|^localhost/.test(host);
			},
		},

		// Window版本和内核对应
		systemArr: [
			{
				system: "Windows 2000 ",
				system_core: "Windows NT 5.0",
			},
			{
				system: "Windows XP ",
				system_core: "Windows NT 5.1",
			},
			{
				system: "Windows XP ",
				system_core: "Windows NT 5.2",
			},
			{
				system: "Windows Vista ",
				system_core: "Windows NT 6.0",
			},
			{
				system: "Windows 7 ",
				system_core: "Windows NT 6.1",
			},
			{
				system: "Windows 8.0 ",
				system_core: "Windows NT 6.2",
			},
			{
				system: "Windows 8.1 ",
				system_core: "Windows NT 6.3",
			},
			{
				system: "Windows 10 ",
				system_core: "Windows NT 10.0",
			}
		],

		PromisePool: {

			_pair: {},

			getDeferred: function(uuid, key){
				var deferred,
					item = this._pair[key];

				if(item){
					if(!item.uuid){
						this._pair[key].uuid = uuid;
						deferred = item.df;
					}
					else if(uuid == item.uuid){
						deferred = item.df;
					}
					else{
						throw new Error("invalid uuid.");
					}
				}
				else{
					deferred = $.Deferred();
					this._pair[key] = { uuid: uuid, df: deferred };
				}

				return deferred;
			},

			getPromise: function(key){
				var deferred,
					item = this._pair[key];

				if(item){
					deferred = item.df;
				}
				else{
					deferred = $.Deferred();
					this._pair[key] = { df: deferred };
				}

				return deferred.promise();
			},

		},

		// $.get("http://").done(latest(function(dat){}));
		// 异步并发时，只执行最后一次异步的回调，不同于 _.throttle 和 _.debounce：
		// 1、没有时间参数，不异步启动。
		// 2、按发起异步时的顺序，而不是回调时的顺序。
		latestFunc: function(){
			var callback;
			return function(cb){
				callback = cb;
				return function(){
					cb === callback && cb.apply(this, arguments);
				};
			};
			// console 测试
			// var latest = latestFunc();
			// function onClick(e){
			// 	$.get("http://kefu.easemob.com/mo/login")
			// 	.done(latest(function(dat){
			// 		console.log("!!!!");
			// 	}));
			// }
			// function latestFunc(){
			// 	var callback;
			// 	var count = 0;
			// 	return function(cb){
			// 		count++;
			// 		callback = cb;
			// 		return (function(c){
			// 			return function(){
			// 				console.log(c);
			// 				cb === callback && cb.apply(null, arguments);
			// 			};
			// 		})(count);
			// 	};
			// }
			// for(var i=0; i<10; i++){
			// 	onClick();
			// }
		},

		getOrganizationDomain: function(){
			var protocol = window.location.protocol;
			var domain = "sandbox.kefuorg.easemob.com";
			var host = window.location.host.toLowerCase();
			if(host == "kefu.easemob.com"){
				domain = "kefuorg.easemob.com";
			}
			domain = protocol + "//" + domain;
			return domain;
		},

		// 根据userAgent判断浏览器的版本
		browserTypeByUserAgent: function(userAgent){

			var system = "";
			// 系统版本
			var systemInfo = _.find(this.systemArr, function(item){
				return userAgent.indexOf(item.system_core) > -1;
			});

			if(systemInfo){
				system = systemInfo.system;
			}
			else if(userAgent.indexOf("Mac OS") > -1){
				system = userAgent.match(/Mac OS\s*X?[\/:\s]*(\d_*)*/)[0] + " ";
			}
			else if(userAgent.indexOf("Ubuntu") > -1){
				system = userAgent.match(/(Ubuntu)[\/:\s]*(\d+\.*)*/)[0] + " ";
			}
			else if(userAgent.indexOf("Linux") > -1){
				system = userAgent.match(/(Linux)[\/:\s]*(\d+\.*)*/)[0] + " ";
			}

			// 判断Chrome浏览器
			if(userAgent.indexOf("Chrome") > -1){
				return system + userAgent.match(/(Chrome)[\/:\s]*(\d+\.*)*/)[0];
			}

			// 判断是否Safari浏览器
			if(userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") == -1){
				return system + userAgent.match(/(Safari)[\/:\s]*(\d+\.*)*/)[0];
			}

			// 判断是否Firefox浏览器
			if(userAgent.indexOf("Firefox") > -1){
				return system + userAgent.match(/(Firefox)[\/:\s]*(\d+\.*)*/)[0];
			}

			// 判断是否IE浏览器
			if(userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1){
				return system + userAgent.match(/(IE)[\/:\s]*(\d+\.*)*/)[0];
			}

			// 判断是否IE的Edge浏览器
			if(userAgent.indexOf("Trident/7.0;") > -1){
				return system + "IE 11";
			}

			// 判断是否Opera浏览器
			if(userAgent.indexOf("Opera") > -1){
				return system + userAgent.match(/(Opera)[\/:\s](\d+\.*)*/)[0];
			}

			return userAgent;
		},

	};

	return utils;

});
