
define(function(require){

	var ROLE = {
		DIALOG_MODAL:	"dialog",
		POP_MODAL:		"pop",
	};

	// 默认找不到是 -1，越小越垃圾
	var HIERARCHY = [
		ROLE.DIALOG_MODAL,
		ROLE.POP_MODAL,
	];

	
	var Modal = Backbone.View.extend({

		secret:		null,
		ROLE: 		ROLE,


		initialize: function(){
			this.$modal = $("<div class=\"ui-cmp-glbmodal\"></div>");
			$("body").append(this.$modal);
		},

		show: function(secret){
			var newPriv = HIERARCHY.indexOf(secret);
			var curPriv = HIERARCHY.indexOf(this.secret);
			if(newPriv >= curPriv){
				this.secret = secret;
			}
			
			// secret 仅用于控制 hide api 的权限
			this.$modal.addClass("show");
		},

		hide: function(secret){
			if(this.secret == secret){
				this.$modal.removeClass("show");
				this.secret = null;
			}
		},

		updateZindex: function(num){
			this.$modal.css("z-index", num);
		},

	});

	return new Modal();

});
