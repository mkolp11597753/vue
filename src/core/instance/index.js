import { initMixin } from "./init";
import { stateMixin } from "./state";
import { renderMixin } from "./render";
import { eventsMixin } from "./events";
import { lifecycleMixin } from "./lifecycle";
import { warn } from "../util/index";

// Vue的构造函数
function Vue(options) {
  if (process.env.NODE_ENV !== "production" && !(this instanceof Vue)) {
    warn("Vue is a constructor and should be called with the `new` keyword");
  }
  this._init(options);
}

// 分成多个模块，对Vue的原型进行扩展
initMixin(Vue); // 初始化相关
stateMixin(Vue); //
eventsMixin(Vue);
lifecycleMixin(Vue); // 生命周期相关
renderMixin(Vue); // render相关

export default Vue;
