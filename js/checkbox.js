var utils = {};
utils.createDelegate = function(instance, method) {
	return function() {
		return method.apply(instance, arguments);
	};
};

utils.assignToInstance = function(instance, sender, eventName, callBack, eventArgument) {
	var callBackWrapper = function(e) {
		e = e || event;
		return callBack.call(instance, sender, eventArgument, e);
	}

	eventName = (eventName.substring(0, 2) == 'on') ? eventName.substring(2) : eventName;
	if(document.addEventListener) {
		sender.addEventListener(eventName, callBackWrapper, true);
	} else {
		sender.attachEvent('on' + eventName, callBackWrapper);
	}

	return callBackWrapper;
};

utils.norm = function(etalon, opt) {
	if(etalon === null || typeof etalon === "undefined") {
		etalon = {};
	}
	if(opt instanceof Array) { return opt; } //esli opt massiv nenado copirovat' elementy iz etalona
	if(typeof etalon == 'object') {
		opt = opt || (etalon instanceof Array ? [] : {}); //opt ostanetsja opt esli on ok
	} else {
		return opt || etalon; //a esli ok ne ok to vozvrasheeem primitivnyj opt
	}

	if(opt instanceof Array) { //no esli byl undefined, to copirovat; nuzhno
		if(!(etalon instanceof Array)) { throw new Error("invalid types"); } //nichego ne podelaesh
		for(var i = 0;i < etalon.length;i++) {
			opt.push(norm(etalon[i], opt[i])); //mozhet toit v tezhe indeksy vstavljat'
		}
	} else {
		if(etalon instanceof Array) { throw new Error("invalid types"); } //nichego ne podelaesh
		for(var prop in etalon) {
			if(typeof etalon[prop] == "object") {
				opt[prop] = norm(etalon[prop], opt[prop]);
			} else {
				opt[prop] = prop in opt ? opt[prop] : etalon[prop];
			}
		}
	}
	return opt;
};

(function(typeLocation) {
	"use strict";
	//utility methods specific for checkboxes, but not really part of checkbox functionality
	var getCheckbox = function(container, checkboxId) {
		if (typeof (checkboxId) != 'undefined') {
			return document.getElementById(checkboxId);
		} else {
			var ci = null;
			for (var i = 0; i < container.childNodes.length; i++) {
				ci = container.childNodes[i];
				if (ci.tagName == "INPUT" && ci.type == "checkbox") {
					return ci;
				}
			}
		}
		return null;
	};

	var copyEvents = function(from, to) {
		if (from.onclick !== null && typeof from.onclick != 'undefined') {
			this.addOnStateChanged(utils.createDelegate(this, from.onclick));
			delete from.onclick;
		}
		if (from.onchange != null && typeof from.onchange != 'undefined') {
			this.addOnStateChanged(utils.createDelegate(this, from.onchange));
			delete from.onchange;
		}
	};
	
	typeLocation.Checkbox = function(containerId, checkboxId, config) {
		var container = document.getElementById(containerId);
		if(!container) { throw new Error("Can't find container element"); }
		var checkbox = getCheckbox(container, checkboxId);
		if(!checkbox) { throw new Error("Can't find checkbox element"); }


		var publish = function() {
			this.addOnStateChanged = addOnStateChanged;
			this.disable = disable;
			this.enable = enable;
			this.check = check;
			this.uncheck = uncheck;
			this.toggle = toggle;
			this.undefine = undefine;
			this.getState = getState;
			this.getElement = getElement;
			this.getContainer = getContainer;
			this.setValue = setValue;
			this.getId = getId;
			this.getValue = getValue;
		};

		var onStateChangedHandlers = [];
		var fireOnStateChanged = function(propertyChanged) {
			for(var i = 0;i < onStateChangedHandlers.length;i++) {
				onStateChangedHandlers[i](this, state, propertyChanged);
			}
		};
		var state = {
			checked: checkbox.checked
			, disabled: checkbox.disabled
			, focused: false
		};

		var adjust = function() {
			var classPostfix = state.focused ? config.focusedClassPostfix : "";
			if(typeof (state.checked) == 'undefined') {
				container.className = !state.disabled ? config.undefinedClass + classPostfix : config.disabledUndefinedClass;
			} else {
				if(!checkbox.disabled) {
					container.className = (state.checked ? config.checkedClass : config.uncheckedClass) + classPostfix;
				} else {
					container.className = state.checked ? config.disabledCheckedClass : config.disabledUncheckedClass;
				}
			}
		};

		var onfocus = function() {
			state.focused = true;
			adjust();
			fireOnStateChanged("focused");
		};

		var onblur = function() {
			state.focused = false;
			adjust();
			fireOnStateChanged("focused");
		};

		var onclick = function(elem, dummy, event) {
			if(checkbox.disabled) { return; }
			if((event.originalTarget || event.srcElement) != checkbox) {
				return;
			}
			this.toggle();
		};
		var disable = function() {
			if(!state.disabled) {
				state.disabled = checkbox.disabled = true;
				adjust();
				fireOnStateChanged("disabled");
			}
		};

		var enable = function() {
			if(state.disabled) {
				state.disabled = checkbox.disabled = false;
				adjust();
				fireOnStateChanged("disabled");
			}
		};

		var check = function() {
			if(!state.checked || typeof state.checked == 'undefined') {
				state.checked = checkbox.checked = true;
				adjust();
				fireOnStateChanged("checked");
			}
		};
	
		var uncheck = function() {
			if(state.checked || typeof state.checked == 'undefined') {
				state.checked = checkbox.checked = false;
				adjust();
				fireOnStateChanged("checked");
			}
		};
	
		var toggle = function() {
			if(state.checked) {
				this.uncheck();
			} else {
				this.check();
			}
		};
	
		var undefine = function() {
			if(typeof state.checked != 'undefined') {
				state.checked = checkbox.checked = undefined;
				adjust();
				fireOnStateChanged("checked");
			}
		};

		var addOnStateChanged = function(func) {
			if(typeof func !== 'function') {
				throw new Error('Invalid argument');
			}
			onStateChangedHandlers.push(func);
		};

		var getState = function() {
			return state;
		};

		var getElement = function() {
			return checkbox;
		};
		var getContainer = function() {
			return container;
		};

		var setValue = function(value) {
			if(value) {
				this.check();
			} else if(typeof value == 'undefined') {
				this.undefine();
			} else {
				this.uncheck();
			}
		};

		var getId = function() {
			return this.getElement().id;
		};

		var getValue = function() {
			if(this.getState().checked) {
				return this.getElement().value;
			}
			return "";
		};

		(function() {
			config = utils.norm(this.defaultConfig, config);
			adjust();
			copyEvents(checkbox, container);
			utils.assignToInstance(this, container, 'click', onclick);
			utils.assignToInstance(this, checkbox, 'focus', onfocus);
			utils.assignToInstance(this, checkbox, 'blur', onblur);
			publish.apply(this);
		}).apply(this);
	};

	typeLocation.Checkbox.prototype = {
		defaultConfig: {
			uncheckedClass: "checkbox"
			, checkedClass: "checkbox-checked"
			, disabledUncheckedClass: "checkbox-disabled"
			, disabledCheckedClass: "checkbox-checked-disabled"
			, undefinedClass: "checkbox-undefined"
			, disabledUndefinedClass: "checkbox-undefined-disabled"
			, focusedClassPostfix: "-focused"
		}
	};
})(window);
