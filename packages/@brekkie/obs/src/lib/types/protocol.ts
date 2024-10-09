import { z } from "zod";
import type { RequestTypes } from "./requests.js";

export const helloMessageType = z.object({
  op: z.literal(0),
  d: z.object({
    obsWebSocketVersion: z.string(),
    rpcVersion: z.number(),
    authentication: z
      .object({
        challenge: z.string(),
        salt: z.string(),
      })
      .optional(),
  }),
});

export const identifyMessageType = z.object({
  op: z.literal(1),
  d: z.object({
    rpcVersion: z.number(),
    authentication: z.string().optional(),
    eventSubscriptions: z.number().optional(),
  }),
});

export type IdentifyMessage = z.infer<typeof identifyMessageType>;

export const identifiedMessageType = z.object({
  op: z.literal(2),
  d: z.object({
    rpcVersion: z.number(),
  }),
});

// MARK: Requests

export const requestMessageType = z.object({
  op: z.literal(6),
  d: z.object({
    requestType: z.string(),
    requestId: z.string(),
    requestData: z.any(),
  }),
});

export type RequestMessage = z.infer<typeof requestMessageType>;

export const requestResponseMessageType = z.object({
  op: z.literal(7),
  d: z.object({
    requestType: z.custom<RequestTypes>((d) => typeof d === "string"),
    requestId: z.string(),
    requestStatus: z.object({
      result: z.boolean(),
      code: z.number(),
      comment: z.string().optional(),
    }),
    responseData: z.any().optional(),
  }),
});

export type RequestResponseMessage = z.infer<typeof requestResponseMessageType>;
