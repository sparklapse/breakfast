# @sparklapse/breakfast

The modules and pieces that make up breakfast and the platform around it. This library is the core code for making everything run (asides from docs and the [service site](https://brekkie.stream).

### License Considerations

You are welcome to use this library for your own projects, however this library is under the GNU AGPLv3 license which is different from the usual MIT license you usually see in this space.

What this means for you is that anything made with this library must fall in the same license and be free and open source, the pay it forwards mentality.

## Modules

### DB

Just some helper types for describing what's in the database and zod types if validation is needed.

### IO

IO is a module for allowing users to define inputs and outputs in an intuitive way. It's the module that currently powers the overlay source properties editor.

**Understanding the editor**

The IO module has an editor component that can be configured with a json object. The simplest example of an editor is as follows:

```svelte
<script>
  import { DefinedEditor } from "@sparklapse/breakfast/io";

  let values = {}; // Record<string, any>
  const assetHelpers = { ... }; // Don't worry about this for now, this will be changed in the future
</script>

<DefinedEditor
  inputs={[
    {
      id: "field",
      type: "text",
      label: "Text field"
    }
  ]}
  bind:values
  {assetHelpers}
/>
```

This creates a text input the user can edit and the `values` will be updated with a record where the key is the "id" and the value is what the user entered. So we would get an output something like so:

```js
{
  field: "Hello world!"
}
```

### Overlay

The overlay module is where all the logic for the editor functionality lives (there's a good chance this module gets renamed to canvas or editor or something).
On its own it won't do much rendering but it will handle a lot of the math required to make working and interacting with things much easier.

