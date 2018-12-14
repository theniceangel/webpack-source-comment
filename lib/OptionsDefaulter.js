/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const getProperty = (obj, name) => {
	name = name.split(".");
	for (let i = 0; i < name.length - 1; i++) {
		obj = obj[name[i]];
		if (typeof obj !== "object" || !obj || Array.isArray(obj)) return;
	}
	return obj[name.pop()];
};

const setProperty = (obj, name, value) => {
	name = name.split(".");
	for (let i = 0; i < name.length - 1; i++) {
		if (typeof obj[name[i]] !== "object" && obj[name[i]] !== undefined) return;
		if (Array.isArray(obj[name[i]])) return;
		if (!obj[name[i]]) obj[name[i]] = {};
		obj = obj[name[i]];
	}
	obj[name.pop()] = value;
};

class OptionsDefaulter {
	constructor() {
		this.defaults = {};
		this.config = {};
	}

	process(options) {
		options = Object.assign({}, options);
		for (let name in this.defaults) {
			switch (this.config[name]) {
				// 尊重用户传入的 options 值
				case undefined:
					if (getProperty(options, name) === undefined) {
						setProperty(options, name, this.defaults[name]);
					}
					break;

				// 不尊重用户传入的 options值，
				// 就算 options 上的 name 属性值存在，也会强制设置成 defaults 函数的返回值，不过会把 options 的属性值传入		
				case "call":
					setProperty(
						options,
						name,
						this.defaults[name].call(this, getProperty(options, name), options)
					);
					break;

				// 尊重用户传入的 options值，如果 options 不存在对应的 name 属性，将 options 传入得到函数的返回值，
				// 作为 options	的 name 属性对应的 value 值	
				case "make":
					if (getProperty(options, name) === undefined) {
						setProperty(options, name, this.defaults[name].call(this, options));
					}
					break;
				case "append": {
					let oldValue = getProperty(options, name);
					if (!Array.isArray(oldValue)) {
						oldValue = [];
					}
					oldValue.push(...this.defaults[name]);
					setProperty(options, name, oldValue);
					break;
				}
				default:
					throw new Error(
						"OptionsDefaulter cannot process " + this.config[name]
					);
			}
		}
		return options;
	}

	set(name, config, def) {
		if (def !== undefined) {
			this.defaults[name] = def;
			this.config[name] = config;
		} else {
			this.defaults[name] = config;
			delete this.config[name];
		}
	}
}

module.exports = OptionsDefaulter;
