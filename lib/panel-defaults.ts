// PanelDisplay maps each block key to a fixed colour, label and icon
// (see COLORS/LABELS/ICONS in components/PanelDisplay.tsx), so every panel is
// built from this same set of keys. A new panel starts with all five empty.
export const DEFAULT_BLOCK_KEYS = ["general", "secretaria", "eso", "batx", "fp"] as const;

export function defaultBlocksFor(panelId: string) {
  return DEFAULT_BLOCK_KEYS.map((key, order) => ({
    panelId,
    key,
    order,
    enabled: false,
    title: "",
    text: "",
    date: "",
    typeText: "",
  }));
}
