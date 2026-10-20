export const MESSAGE_FONTS = {
  sans: 'Inter, Arial, sans-serif',
  mono: 'Consolas, "Courier New", monospace',
  serif: 'Georgia, "Times New Roman", serif',
  display: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
  rounded: '"Trebuchet MS", "Arial Rounded MT Bold", sans-serif',
};

export const MESSAGE_BOXES = ['warning', 'console', 'stamp', 'note', 'ticket', 'arcade', 'god'];

export function cleanupAppearance(stage, comboCount, styles) {
  if (stage === 'combo') return comboCount > 10 ? styles.cleaningGod : styles.cleanCombos[comboCount - 1];
  return styles[stage] ?? styles.dirty;
}
