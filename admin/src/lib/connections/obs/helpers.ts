export const createControlledPromise = <D = void>() => {
  let resolver: (data: D) => void;
  let rejector: (reason?: any) => void;
  let promise = new Promise<D>((resolve, reject) => {
    resolver = resolve;
    rejector = reject;
  });

  // @ts-expect-error
  if (!resolver || !rejector) throw new Error("Promise failed to init");

  return {
    promise,
    resolver,
    rejector,
  };
};
