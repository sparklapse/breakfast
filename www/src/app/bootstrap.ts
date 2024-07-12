import * as solidjs from "solid-js";
import * as solidjsWeb from "solid-js/web";

declare global {
  var solidjs: any;
  var solidjsWeb: any;
}

window.solidjs = solidjs;
window.solidjsWeb = solidjsWeb;
