import "@fontsource-variable/gabarito";
import "./global.css";

/**
 * We have to overwrite the default fetch implementation to force credentials (cookies) to be
 * included.
 */
// const ORIGINAL_FETCH = window.fetch;
// window.fetch = (url, options) => {
//   return ORIGINAL_FETCH(url, { credentials: "include", ...options });
// };

import { render } from "solid-js/web";
import App from "./App";

render(App, document.body);
