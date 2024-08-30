<script lang="ts">
  import clsx from "clsx";
  import { siObsstudio } from "simple-icons";

  let classes: string | undefined = undefined;
  export { classes as class };
</script>

<div class={clsx(["icon", classes ?? "size-6"])}>
  {@html siObsstudio.svg}
</div>

<style>
  .icon :global(svg) {
    fill: currentColor;
    width: 100%;
    height: 100%;
  }

  .icon :global(svg path) {
    stroke-width: 1px;
    stroke: currentColor;
    transform: scale(0.9);
    transform-origin: center;
  }
</style>
