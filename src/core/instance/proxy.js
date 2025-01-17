/* not type checking this file because flow doesn't play well with Proxy */

import config from "core/config";
import { warn, makeMap, isNative } from "../util/index";

let initProxy;

if (process.env.NODE_ENV !== "production") {
  const allowedGlobals = makeMap(
    "Infinity,undefined,NaN,isFinite,isNaN," +
      "parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent," +
      "Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl," +
      "require" // for Webpack/Browserify
  );

  const warnNonPresent = (target, key) => {
    // 没有在实例上定义属性或方法${key}，请确保${key}是反应性的
    warn(
      `Property or method "${key}" is not defined on the instance but ` +
        "referenced during render. Make sure that this property is reactive, " +
        "either in the data option, or for class-based components, by " +
        "initializing the property. " +
        "See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.",
      target
    );
  };

  const warnReservedPrefix = (target, key) => {
    warn(
      `Property "${key}" must be accessed with "$data.${key}" because ` +
        'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
        "prevent conflicts with Vue internals. " +
        "See: https://vuejs.org/v2/api/#data",
      target
    );
  };

  const hasProxy = typeof Proxy !== "undefined" && isNative(Proxy);

  if (hasProxy) {
    const isBuiltInModifier = makeMap(
      "stop,prevent,self,ctrl,shift,alt,meta,exact"
    );
    // v-on 可绑定的键盘按键
    config.keyCodes = new Proxy(config.keyCodes, {
      set(target, key, value) {
        if (isBuiltInModifier(key)) {
          warn(
            `Avoid overwriting built-in modifier in config.keyCodes: .${key}`
          );
          return false;
        } else {
          target[key] = value;
          return true;
        }
      },
    });
  }

  // handler.has in操作符捕捉器
  const hasHandler = {
    has(target, key) {
      const has = key in target; // 查找本身的property，包括原型链
      // 是否是全局的property || _开头的key并且不属于target.$data
      // allowedGlobals:  "Infinity,undefined,NaN,isFinite,isNaN," +
      // "parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent," +
      // "Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl," +
      // "require"
      // if (isAllowed === true) return has || false
      // if(isAllowed === false) return true
      // key以'_'开头 并且不是$data里的属性  => !isAllowed = false   _a  _b
      // 1。'_'开头 是$data里的属性 _parent _vnode， 2.不是_开头的属性 otherKey   => !isAllowed = true

      // isAllowed : global方法里有 或者 _开头 并且不在$data里
      const isAllowed =
        allowedGlobals(key) ||
        (typeof key === "string" &&
          key.charAt(0) === "_" &&
          !(key in target.$data));
      if (!has && !isAllowed) {
        if (key in target.$data) warnReservedPrefix(target, key);
        else warnNonPresent(target, key);
      }
      return has || !isAllowed;
    },
  };

  const getHandler = {
    get(target, key) {
      if (typeof key === "string" && !(key in target)) {
        // vm上没有该属性，vm.$data中却存在该属性
        if (key in target.$data) warnReservedPrefix(target, key);
        else warnNonPresent(target, key);
      }
      return target[key];
    },
  };

  initProxy = function initProxy(vm) {
    if (hasProxy) {
      // determine which proxy handler to use
      const options = vm.$options;
      const handlers =
        options.render && options.render._withStripped
          ? getHandler
          : hasHandler;
      vm._renderProxy = new Proxy(vm, handlers);
    } else {
      vm._renderProxy = vm;
    }
  };
}

export { initProxy };
