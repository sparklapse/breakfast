export * from "./requests";
export * from "./protocol";
export * from "./input-kinds";
export * from "./scene-item";

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
