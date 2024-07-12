import clsx from "clsx";
import { Dynamic, ErrorBoundary } from "solid-js/web";
import type { JSX, ParentProps } from "solid-js";
import type { ComponentProps, ComponentSource, Transform } from "./types";
import { TriangleAlert } from "lucide-solid";

export type SourceProps = ParentProps & {
  class?: string;
  component?: (props: ComponentProps) => JSX.Element;
  source: ComponentSource;
  transform: Transform;
  z?: number;
};

function ComponentError(err: Error) {
  return (
    <div class="absolute inset-0 grid place-content-center bg-red-800/75 text-red-50">
      <div class="flex flex-col items-center">
        <TriangleAlert size="2rem" />
        <p class="text-center">Error: {err.message}</p>
      </div>
    </div>
  );
}

export function Source(props: SourceProps) {
  return (
    <div
      class={clsx(["absolute isolate select-none", props.class])}
      style={{
        left: `${props.transform.x}px`,
        top: `${props.transform.y}px`,
        width: `${props.transform.width}px`,
        height: `${props.transform.height}px`,
        transform: `rotate(${props.transform.angle}deg)`,
        "z-index": props.z,
      }}
      data-breakfast-source
    >
      <ErrorBoundary fallback={ComponentError}>
        <Dynamic
          component={
            props.component ?? ComponentError.bind(null, new Error("Missing plugin component"))
          }
          data={props.source.data}
          transform={props.transform}
          // events={{}}
        />
      </ErrorBoundary>
      <div>{props.children}</div>
    </div>
  );
}
