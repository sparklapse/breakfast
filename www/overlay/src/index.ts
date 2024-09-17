import "@fontsource-variable/gabarito";
import "./style.css";
import { BreakfastPocketBase } from "./pocketbase";

const pb = new BreakfastPocketBase();

window.breakfast = {
  message: {
    renderEmotes: (message) => {
      return "Hello world!";
    },
  },
  events: {
    listen: (listener) => pb.realtime.subscribe("@breakfast/events", listener),
  },
};
