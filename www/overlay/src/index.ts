import "@fontsource-variable/gabarito";
import "./style.css";
import { BreakfastPocketBase } from "./pocketbase";

const pb = new BreakfastPocketBase();

window.breakfast = {
  viewers: {
    addCurrency: async (id, amount, currency = "dots") => {
      const viewer = await pb.collection("viewers").getOne(id);
      const current = viewer.wallet[currency] ?? 0;
      if (typeof current !== "number") throw new Error("Viewer wallet data is corrupt");
      await pb.send(`/api/breakfast/viewers/${id}/wallet/add`, { method: "POST", body: JSON.stringify({ [currency]: amount }) });
    },
    subCurrency: async (id, amount, currency = "dots") => {
      await window.breakfast.viewers.addCurrency(id, -amount, currency);
    },
  },
  events: {
    listen: (listener) => pb.realtime.subscribe("@breakfast/events", listener),
  },
};
