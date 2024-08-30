import { z } from "zod";

export const sceneItemTransformType = z.object({
  /**
   * The anchor point is a 4 bit mask
   * 
   * ```text
   * ▼ these bits represent the Y anchor
   * 00_00
   *    ▲ these bits represent the X anchor
   * ```
   *
   * The X anchors are as follows:
   * - 00 - Center
   * - 01 - Left
   * - 10 - Right
   *
   * The Y anchors are as follows
   * - 00 - Center
   * - 10 - Bottom
   * - 01 - Top
   */
  alignment: z.number(),
  /**
   * Refer to alignment for values meanings
   */
  boundsAlignment: z.number(),
  boundsHeight: z.number(),
  boundsType: z.enum([
    "OBS_BOUNDS_NONE",
    "OBS_BOUNDS_STRETCH",
    "OBS_BOUNDS_SCALE_INNER",
    "OBS_BOUNDS_SCALE_OUTER",
    "OBS_BOUNDS_SCALE_TO_WIDTH",
    "OBS_BOUNDS_SCALE_TO_HEIGHT",
    "OBS_BOUNDS_MAX_ONLY",
  ]),
  boundsWidth: z.number(),
  cropBottom: z.number(),
  cropLeft: z.number(),
  cropRight: z.number(),
  cropTop: z.number(),
  height: z.number(),
  positionX: z.number(),
  positionY: z.number(),
  rotation: z.number(),
  scaleX: z.number(),
  scaleY: z.number(),
  sourceHeight: z.number(),
  sourceWidth: z.number(),
  width: z.number(),
});

export type SceneItemTransform = z.infer<typeof sceneItemTransformType>;

export const sceneItemType = z.object({
  inputKind: z.string().nullable(),
  inputSettings: z.record(z.any()).optional(),
  isGroup: z.boolean().nullable(),
  sceneItemBlendMode: z.enum([
    "OBS_BLEND_NORMAL",
    "OBS_BLEND_ADDITIVE",
    "OBS_BLEND_SUBTRACT",
    "OBS_BLEND_SCREEN",
    "OBS_BLEND_MULTIPLY",
    "OBS_BLEND_LIGHTEN",
    "OBS_BLEND_DARKEN",
  ]),
  sceneItemEnabled: z.boolean(),
  sceneItemId: z.number(),
  sceneItemIndex: z.number(),
  sceneItemLocked: z.boolean(),
  sceneItemTransform: sceneItemTransformType,
  sourceName: z.string(),
  sourceType: z.enum([
    "OBS_SOURCE_TYPE_INPUT",
    "OBS_SOURCE_TYPE_FILTER",
    "OBS_SOURCE_TYPE_TRANSITION",
    "OBS_SOURCE_TYPE_SCENE",
    "OBS_SOURCE_TYPE_UNKNOWN",
    "OBS_SOURCE_TYPE_OTHER",
  ]),
  sourceUuid: z.string(),
  sourceScreenshot: z.string().optional(),
});

export type SceneItem = z.infer<typeof sceneItemType>;
