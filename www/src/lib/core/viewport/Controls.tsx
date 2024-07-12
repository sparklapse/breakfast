import { Maximize } from "lucide-solid";
import { useViewport } from "./context";

export function Controls() {
  const vp = useViewport();
  if (!vp) throw new Error("Viewport Controls only work as a child of a Viewport");

  return (
    <div class="esc-pan esc-zoom absolute bottom-2 right-2 flex flex-col rounded bg-white p-2 shadow">
      <button
        onclick={() => {
          vp.panTo({ padding: 100, x: 1920 / 2, y: 1080 / 2, width: 1920, height: 1080 }, 200);
        }}
        class="aspect-square"
      >
        <Maximize />
      </button>
    </div>
  );
}
