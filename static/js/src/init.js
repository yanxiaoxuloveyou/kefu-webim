;
(function(window, undefined) {
	'use strict';

	var utils = easemobim.utils;
	var api = easemobim.api;
	var eventCollector = easemobim.eventCollector;
	var webim = document.getElementById('EasemobKefuWebim');

	getConfig();

	function getConfig() {
		if (utils.isTop) {
			var tenantId = utils.query('tenantId');
			var config = {};
			//get config from referrer's config
			try {
				config = JSON.parse(utils.code.decode(utils.getStore('emconfig' + tenantId)));
			} catch (e) {}

			config.tenantId = tenantId;
			config.hide = true;
			config.offDutyType = utils.query('offDutyType');
			config.grUserId = utils.query('grUserId');

			// H5 方式集成时不支持eventCollector配置
			config.to = utils.convertFalse(utils.query('to'));
			config.xmppServer = utils.convertFalse(utils.query('xmppServer'));
			config.restServer = utils.convertFalse(utils.query('restServer'));
			config.agentName = utils.convertFalse(utils.query('agentName'));
			config.satisfaction = utils.convertFalse(utils.query('sat'));
			config.resources = utils.convertFalse(utils.query('resources'));
			config.hideStatus = utils.convertFalse(utils.query('hideStatus'));
			config.satisfaction = utils.convertFalse(utils.query('sat'));
			config.wechatAuth = utils.convertFalse(utils.query('wechatAuth'));
			config.hideKeyboard = utils.convertFalse(utils.query('hideKeyboard'));

			config.appKey = utils.convertFalse(decodeURIComponent(utils.query('appKey')));
			config.domain = config.domain || '//' + location.host;
			config.offDutyWord = decodeURIComponent(utils.query('offDutyWord'));
			config.language = utils.query('language') || 'zh_CN';
			config.ticket = utils.query('ticket') === '' ? true : utils.convertFalse(utils.query('ticket')); //true default
			try {
				config.emgroup = decodeURIComponent(utils.query('emgroup'));
			} catch (e) {
				config.emgroup = utils.query('emgroup');
			}


			//没绑定user直接取cookie
			if (!utils.query('user')) {
				config.user = {
					username: utils.get('root' + config.tenantId + config.emgroup),
					password: '',
					token: ''
				};
			} else if (!config.user || (config.user.username && config.user.username !== utils.query('user'))) {
				config.user = {
					username: '',
					password: '',
					token: ''
				};
			}
			initUI(config, initAfterUI);
		} else {
			window.transfer = new easemobim.Transfer(null, 'main').listen(function(msg) {
				if (msg.event) {
					// window.chat || initUI(msg, initAfterUI);
					switch (msg.event) {
						case easemobim.EVENTS.SHOW.event:
							chatEntry.open();
							break;
						case easemobim.EVENTS.CLOSE.event:
							chatEntry.close();
							break;
						case easemobim.EVENTS.EXT.event:
							chat.sendTextMsg('', false, msg.data.ext);
							break;
						case easemobim.EVENTS.TEXTMSG.event:
							chat.sendTextMsg(msg.data.data, false, msg.data.ext);
							break;
						default:
							break;
					}
				} else if (msg.parentId) {
					window.transfer.to = msg.parentId;
					initUI(msg, initAfterUI);
				} else {}
			}, ['easemob']);
		}
	}

	function initAfterUI(config) {
		window.chat = easemobim.chat(config);

		config.base = location.protocol + config.domain;

		//load modules
		easemobim.leaveMessage = easemobim.leaveMessage(chat, config.tenantId);
		easemobim.paste = easemobim.paste(chat);
		easemobim.satisfaction(chat);

		// 访客回呼功能
		if (config.eventCollector && !eventCollector.isStarted()) {
			eventCollector.startToReport(config, function(targetUserInfo) {
				chatEntry.init(config, targetUserInfo);
			});
		} else {
			// 获取关联，创建访客，调用聊天窗口
			chatEntry.init(config);
		}
	}

	function initUI(config, callback) {
		//render Tpl
		webim.innerHTML = '\
<div id="em-widgetPopBar" class="em-hide">\
	<a class="em-widget-pop-bar bg-color" href="javascript:;"><i></i><span>联系客服</span></a>\
	<span class="em-widget-msgcount em-hide"></span>\
</div>\
<div id="em-kefu-webim-chat" class="em-widget-wrapper em-hide">\
	<div id="em-widgetHeader" class="em-widgetHeader-wrapper bg-color border-color">\
		<div id="em-widgetDrag">\
			<p></p>\
			<img class="em-widgetHeader-portrait border-color"/>\
			<span class="em-widgetHeader-nickname"></span>\
			<span class="em-header-status-text"></span>\
			<i id="em-widgetNotem" class="em-widget-notem em-hide"></i>\
			<i id="em-widgetAgentStatus" class="em-widget-agent-status em-hide"></i>\
		</div>\
	</div>\
	<div class="em-widget-tip"><span class="em-widget-tip-text"></span><a class="icon-close em-widget-tip-close" href="javascript:;"></a></div>\
	<div class="em-widget-video">\
		<div class="prompt-wait">\
			<span>等待坐席接入...</span>\
		</div>\
		<video class="main" autoplay></video>\
		<div class="sub-win">\
			<video class="sub" autoplay muted></video>\
			<span class="btn-minimize icon-minimize"></span>\
		</div>\
		<div class="toolbar-dial">\
			<i class="btn-accept-call hide icon-answer"></i>\
			<i class="btn-end-call icon-decline"></i>\
		</div>\
		<div class="toolbar-control">\
			<i class="btn-toggle icon-camera"></i>\
		</div>\
		<span class="btn-maximize icon-maximize"></span>\
	</div>\
	<div id="em-widgetBody" class="em-widgetBody-wrapper"></div>\
	<div id="EasemobKefuWebimFaceWrapper" class="em-bar-face-wrapper e-face em-hide">\
		<ul class="em-bar-face-container"></ul>\
	</div>\
	<div id="em-widgetSend" class="em-widget-send-wrapper">\
		<i class="em-bar-face icon-face e-face fg-hover-color" title="表情"></i>\
		<i class="em-widget-file icon-picture fg-hover-color" id="em-widgetFile" title="图片"></i>\
		<i class="em-widget-note icon-note em-hide fg-hover-color" id="em-widgetNote" title="留言"></i>\
		<i class="icon-video fg-hover-color em-video-invite" title="视频通话"></i>\
		<input id="em-widgetFileInput" type="file" accept="image/*"/>\
		<textarea class="em-widget-textarea" spellcheck="false"></textarea>\
		<span id="EasemobKefuWebimSatisfy" class="em-widget-satisfaction em-hide">请对服务做出评价</span>\
		<a href="javascript:;" class="em-widget-send bg-color disabled" id="em-widgetSendBtn">连接中</a>\
	</div>\
	<iframe id="EasemobKefuWebimIframe" class="em-hide" src="' + config.domain + '/webim/transfer.html?v=<%= v %>">\
</div>';

		utils.on(utils.$Dom('EasemobKefuWebimIframe'), 'load', function() {
			easemobim.getData = new easemobim.Transfer('EasemobKefuWebimIframe', 'data');
			callback(config);
		});

		// em-widgetPopBar
		utils.toggleClass(
			utils.$Dom('em-widgetPopBar'),
			'em-hide',
			(utils.isTop || !config.minimum || config.hide)
		);

		// em-kefu-webim-chat
		utils.toggleClass(
			utils.$Dom('em-kefu-webim-chat'),
			'em-hide', !(utils.isTop || !config.minimum)
		);

		// 联系客服按钮
		var $button = utils.$Class('a.em-widget-pop-bar', webim)[0];

		// 设置按钮文字
		$button.getElementsByTagName('span')[0].innerText = config.buttonText;

		// mobile
		if (utils.isMobile) {
			// 联系客服按钮改为弹窗
			$button.href = location.href;
			$button.target = '_blank';
			// 添加移动端样式类
			utils.addClass(document.body, 'em-mobile');
		}

		// em-widgetNote
		utils.toggleClass(
			utils.$Dom('em-widgetNote'),
			'em-hide', !config.ticket
		);

		// EasemobKefuWebimSatisfy
		utils.toggleClass(
			utils.$Dom('EasemobKefuWebimSatisfy'),
			'em-hide',
			utils.isMobile || !config.satisfaction
		);

		//不支持异步上传则加载swfupload
		if (!Easemob.im.Utils.isCanUploadFileAsync && Easemob.im.Utils.isCanUploadFile) {
			var script = document.createElement('script');
			script.onload = script.onreadystatechange = function() {
				if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
					easemobim.uploadShim(config, chat);
				}
			};
			script.src = location.protocol + config.staticPath + '/js/swfupload/swfupload.min.js';
			webim.appendChild(script);
		}
	}

	var chatEntry = {
		init: function(config, targetUserInfo) {
			var me = this;

			config.toUser = config.toUser || config.to;

			//上下班状态
			api('getDutyStatus', {
				tenantId: config.tenantId
			}, function(msg) {
				config.offDuty = msg.data ? msg.data && config.offDutyType !== 'chat' : false;

				chat.setOffline(config.offDuty); //根据状态展示上下班不同view
			});

			config.orgName = config.appKey.split('#')[0];
			config.appName = config.appKey.split('#')[1];

			//获取关联信息
			api('getRelevanceList', {
				tenantId: config.tenantId
			}, function(msg) {
				if (msg.data.length === 0) {
					chat.errorPrompt('未创建关联', true);
					return;
				}
				config.relevanceList = msg.data;
				config.tenantAvatar = utils.getAvatarsFullPath(msg.data[0].tenantAvatar, config.domain);
				config.defaultAvatar = config.staticPath ? config.staticPath + '/img/default_avatar.png' : 'static' + '/img/default_avatar.png';
				config.defaultAgentName = msg.data[0].tenantName;
				config.logo = config.logo || msg.data[0].tenantLogo;
				config.toUser = config.toUser || msg.data[0].imServiceNumber;
				config.orgName = config.orgName || msg.data[0].orgName;
				config.appName = config.appName || msg.data[0].appName;
				config.channelid = config.channelid || msg.data[0].channelId;
				config.appKey = config.appKey || config.orgName + '#' + config.appName;
				config.restServer = config.restServer || msg.data[0].restDomain;

				var cluster = config.restServer ? config.restServer.match(/vip\d/) : '';
				cluster = cluster && cluster.length ? '-' + cluster[0] : '';
				config.xmppServer = config.xmppServer || 'im-api' + cluster + '.easemob.com';
				chat.init();

				if (targetUserInfo) {

					config.toUser = targetUserInfo.agentName;
					config.user = {
						username: targetUserInfo.userName,
						password: targetUserInfo.userPassword
					};

					chat.ready();
					chat.show();
					// 发送空的ext消息
					chat.sendTextMsg('', false, {weichat: {agentUsername: '301@1.cn'}});
					transfer.send(easemobim.EVENTS.SHOW, window.transfer.to);
					easemobim.EVENTS.CACHEUSER.data = {
						username: targetUserInfo.userName,
						group: config.user.emgroup
					};
					transfer.send(easemobim.EVENTS.CACHEUSER, window.transfer.to);
				} else if (config.user.username && (config.user.password || config.user.token)) {
					chat.ready();
				}
				//检测微信网页授权
				else if (config.wechatAuth) {
					easemobim.wechat(function(data) {
						try {
							data = JSON.parse(data);
						} catch (e) {
							data = null;
						}
						if (!data) { //失败自动降级，随机创建访客
							me.go();
						} else {
							config.visitor = config.visitor || {};
							config.visitor.userNickname = data.nickname;
							var oid = config.tenantId + '_' + config.orgName + '_' + config.appName + '_' + config.toUser + '_' + data.openid;
							easemobim.emajax({
								url: '/v1/webimplugin/visitors/wechat/' + oid + '?tenantId=' + config.tenantId,
								data: {
									orgName: config.orgName,
									appName: config.appName,
									imServiceNumber: config.toUser
								},
								type: 'POST',
								success: function(info) {
									try {
										info = JSON.parse(info);
									} catch (e) {
										info = null;
									}
									if (info && info.status === 'OK') {
										config.user.username = info.entity.userId;
										config.user.password = info.entity.userPassword;
										chat.ready();
									} else {
										me.go();
									}

								},
								error: function(e) {
									//失败自动降级，随机创建访客
									me.go();
								}
							});
						}
					});
				} else if (config.user.username) {
					api('getPassword', {
						userId: config.user.username,
						tenantId: config.tenantId
					}, function(msg) {
						if (!msg.data) {
							me.go();
						} else {
							config.user.password = msg.data;
							chat.ready();
						}
					});
				} else {
					me.go(config);
				}
			});
		},
		go: function(config) {
			api('createVisitor', {
				orgName: config.orgName,
				appName: config.appName,
				imServiceNumber: config.toUser,
				tenantId: config.tenantId
			}, function(msg) {
				config.newuser = true;
				config.user.username = msg.data.userId;
				config.user.password = msg.data.userPassword;
				if (utils.isTop) {
					utils.set('root' + config.tenantId + config.emgroup, config.user.username)
				} else {
					easemobim.EVENTS.CACHEUSER.data = {
						username: config.user.username,
						group: config.user.emgroup
					};
					transfer.send(easemobim.EVENTS.CACHEUSER, window.transfer.to);
				}
				chat.ready();
			});
		},
		open: function() {
			// config.toUser = config.toUser || config.to;
			// 停止上报访客
			eventCollector.stopReporting();
			chat.show();
		},
		close: function() {
			chat.close();
			eventCollector.startToReport();
			// todo 重新上报访客开始
		}
	};

}(window, undefined));