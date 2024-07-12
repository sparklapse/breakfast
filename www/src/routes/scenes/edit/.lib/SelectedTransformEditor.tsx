import type { EditorComponentSource } from "$app/context/editor/context";

type SelectedTransformEditorProps = {
  transform: EditorComponentSource["transform"];
  setTransformValue: (key: keyof EditorComponentSource["transform"], value: string) => void;
};

export function SelectedTransformEditor(props: SelectedTransformEditorProps) {
  return (
    <div class="flex flex-col gap-0.5">
      <div class="flex justify-between">
        <div class="flex gap-2">
          <label>X:</label>
          <input
            class="w-14 border-b border-b-black/50 outline-none focus:border-b-black"
            type="number"
            value={props.transform.x}
            oninput={(ev) => props.setTransformValue("x", ev.currentTarget.value)}
          />
        </div>
        <div class="flex gap-2">
          <label>Y:</label>
          <input
            class="w-14 border-b border-b-black/50 outline-none focus:border-b-black"
            type="number"
            value={props.transform.y}
            oninput={(ev) => props.setTransformValue("y", ev.currentTarget.value)}
          />
        </div>
        <div class="flex gap-2">
          <label>Width:</label>
          <input
            class="w-14 border-b border-b-black/50 outline-none focus:border-b-black"
            type="number"
            value={props.transform.width}
            oninput={(ev) => props.setTransformValue("width", ev.currentTarget.value)}
          />
        </div>
        <div class="flex gap-2">
          <label>Height:</label>
          <input
            class="w-14 border-b border-b-black/50 outline-none focus:border-b-black"
            type="number"
            value={props.transform.height}
            oninput={(ev) => props.setTransformValue("height", ev.currentTarget.value)}
          />
        </div>
      </div>
      <div class="flex">
        <div class="flex gap-2">
          <label>Angle:</label>
          <input
            class=" border-b border-b-black/50 outline-none focus:border-b-black"
            type="number"
            value={props.transform.angle.toFixed(2)}
            oninput={(ev) => props.setTransformValue("angle", ev.currentTarget.value)}
          />
        </div>
      </div>
    </div>
  );
}
