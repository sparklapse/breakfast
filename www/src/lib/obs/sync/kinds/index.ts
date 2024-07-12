import type { SceneItemTransform } from "$lib/obs";
import type { Source } from "../types";

export type Params = {
  settings: any;
  transform: Partial<SceneItemTransform>;
};

export function calculateParams(source: Source): Params {
  let calculatedSettings: any = { ...source.settings };
  let calculatedTransform: Partial<SceneItemTransform> = {};

  if (source.breakfast) {
    calculatedSettings.width = 1920;
    calculatedSettings.height = 1080;
    calculatedTransform = {
      alignment: 0b01_01,
      positionX: 0,
      positionY: 0,
    };
  } else {
    switch (source.kind) {
      case "color_source_v3": {
        const bgrHex = (calculatedSettings.color as number)
          .toString(16)
          .padStart(6, "0")
          .match(/\w{2}/g)!
          .reverse()
          .join("");
        const bgrInt = parseInt(bgrHex, 16);

        calculatedSettings.color = 0xff000000 | bgrInt;
        calculatedSettings.width = source.transform.width;
        calculatedSettings.height = source.transform.height;
        break;
      }
    }

    calculatedTransform = {
      ...calculatedTransform,
      alignment: 0, // Center
      boundsType: "OBS_BOUNDS_SCALE_INNER",
      rotation: source.transform.angle,
      positionX: Math.round(source.transform.x + source.transform.width / 2),
      positionY: Math.round(source.transform.y + source.transform.height / 2),
      boundsWidth: source.transform.width,
      boundsHeight: source.transform.height,
    };
  }

  return { settings: calculatedSettings, transform: calculatedTransform };
}
