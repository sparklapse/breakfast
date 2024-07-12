import type { ParentProps, JSX } from "solid-js";

export type ToasterCardProps = ParentProps & {
  title?: JSX.Element;
  actions?: JSX.Element;
  footer?: JSX.Element;
};

export default function ToasterCard(props: ToasterCardProps) {
  return (
    <div class="fixed inset-0 grid place-content-center">
      <div class="flex w-screen max-w-xl flex-col gap-2 max-xl:px-2">
        <div class="flex items-end justify-between">
          <div class="text-5xl drop-shadow">{props.title}</div>
          <div class="flex gap-2">{props.actions}</div>
        </div>
        <div class="relative h-72 rounded bg-white shadow">{props.children}</div>
        <div>{props.footer}</div>
      </div>
    </div>
  );
}
