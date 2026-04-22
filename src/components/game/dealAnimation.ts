// Shared timing for the "fly from stock, then flip face-up" deal animation.
// All values are milliseconds. The sequence for a single card at column `c`:
//
//   [0 .. FLY_DELAY_PER_COL_MS * c]
//     waiting for its column's turn
//   [... + FLY_DURATION_MS]
//     fly: Motion's layoutId crossfade from stock bbox → column bbox
//   [... + FLIP_GAP_MS]
//     brief pause so the landing reads as a beat
//   [... + FLIP_DURATION_MS]
//     flip: rotateY 0 → 180 reveals the face
//
// TABLEAU_COLUMNS - 1 (= 9) is the worst case; add a small buffer so state
// clears strictly after the last card finishes flipping.
export const FLY_DELAY_PER_COL_MS = 70;
export const FLY_DURATION_MS = 320;
export const FLIP_GAP_MS = 50;
export const FLIP_DURATION_MS = 350;

export function dealFlyDelayMs(columnIndex: number): number {
  return columnIndex * FLY_DELAY_PER_COL_MS;
}

export function dealFlipDelayMs(columnIndex: number): number {
  return dealFlyDelayMs(columnIndex) + FLY_DURATION_MS + FLIP_GAP_MS;
}

export const DEAL_ANIMATION_TOTAL_MS =
  9 * FLY_DELAY_PER_COL_MS + FLY_DURATION_MS + FLIP_GAP_MS + FLIP_DURATION_MS;
