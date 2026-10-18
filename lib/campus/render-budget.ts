export const createRenderBudget = () => ({ average: 1 / 60, slowSeconds: 0, requested: false });
export type RenderBudgetSample = ReturnType<typeof createRenderBudget>;

/** Local capability choice only; never retain or transmit the renderer string. */
export function initialRenderScale(renderer: string): 1 | .45 {
  return /swiftshader|llvmpipe|softpipe|software (?:renderer|rasterizer)|microsoft basic render/i.test(renderer) ? .45 : 1;
}

/** Demand-rendered snapshot/idle gaps are not evidence of a slow GPU. */
export function reduceRenderQuality(sample: RenderBudgetSample, delta: number, continuous: boolean) {
  if (!continuous) {
    sample.average = 1 / 60;
    sample.slowSeconds = 0;
    return false;
  }
  if (sample.requested) return false;
  const frame = Math.min(Math.max(delta, 0), .25);
  sample.average = sample.average * .85 + frame * .15;
  sample.slowSeconds = sample.average > .04 ? sample.slowSeconds + frame : 0;
  if (sample.slowSeconds <= .45) return false;
  sample.requested = true;
  return true;
}
