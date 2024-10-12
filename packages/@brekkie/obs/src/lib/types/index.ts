export * from "./requests.js";
export * from "./protocol.js";
export * from "./input-kinds.js";
export * from "./scene-item.js";

export type Result<Success = void, Error = any> =
  | (Success extends void
      ? {
          status: "success";
        }
      : {
          status: "success";
          data: Success;
        })
  | {
      status: "error";
      error: Error;
    };
