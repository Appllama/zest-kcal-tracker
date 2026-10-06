/**
 * How far the gaze leans for a given pull of gravity across the screen, as
 * -1..1 on each axis, measured against a level that drifts toward however the
 * phone is being held. Lowering the right edge leans it right; tipping the top
 * edge away leans it up.
 */
export function leaning(
  gx: number,
  gy: number,
  levelX: number,
  levelY: number,
  dt: number,
) {
  "worklet";
  const settle = 1 - Math.exp(-dt / 2.6);
  const nextX = levelX + (gx - levelX) * settle;
  const nextY = levelY + (gy - levelY) * settle;
  return {
    levelX: nextX,
    levelY: nextY,
    x: Math.max(-1, Math.min(1, (gx - nextX) / 0.26)),
    y: Math.max(-1, Math.min(1, (gy - nextY) / 0.24)),
  };
}
