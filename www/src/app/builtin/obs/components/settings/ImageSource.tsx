import type { SettingsProps } from ".";

export function ImageSourceSettings(props: SettingsProps) {
  return (
    <div>
      <label>File</label>
      <input type="text" value={props.settings.file} readonly />
    </div>
  );
}
