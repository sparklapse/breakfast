import "@fontsource-variable/gabarito";
import "./style.css";
import "@sparklapse/breakfast/overlay/global";
import { BreakfastPocketBase } from "./pocketbase";

const pb = new BreakfastPocketBase();

window.breakfast = {
  events: {
    listen: (listener) => pb.realtime.subscribe("@breakfast/events", listener),
  },
};

