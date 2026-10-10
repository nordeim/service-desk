// Fit the reference's measured stat-card entrance curve (500ms tween)
// against candidate CSS cubic-beziers. Measured samples (t/500, opacity):
const measured = [
  [0.064, 0.084], [0.096, 0.136], [0.13, 0.187], [0.164, 0.237],
  [0.198, 0.286], [0.23, 0.333], [0.264, 0.379], [0.298, 0.424],
  [0.33, 0.468], [0.364, 0.51], [0.396, 0.552], [0.43, 0.592],
  [0.466, 0.63], [0.496, 0.668], [0.53, 0.703], [0.564, 0.738],
  [0.596, 0.77], [0.63, 0.801], [0.664, 0.831], [0.696, 0.858],
  [0.73, 0.884], [0.764, 0.907], [0.804, 0.928], [0.83, 0.947],
];

function bezier(p1x, p1y, p2x, p2y) {
  // returns y at given x (time fraction) via parameter solve
  const cx = 3 * p1x, cy = 3 * p1y;
  const bx = 3 * (p2x - p1x) - cx, by = 3 * (p2y - p1y) - cy;
  const ax = 1 - cx - bx, ay = 1 - cy - by;
  const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t) => ((ay * t + by) * t + cy) * t;
  return (x) => {
    // binary search t for x
    let lo = 0, hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (sampleX(mid) < x) lo = mid;
      else hi = mid;
    }
    return sampleY((lo + hi) / 2);
  };
}

const candidates = {
  "linear": (x) => x,
  "easeOutQuad .25,.46,.45,.94": bezier(0.25, 0.46, 0.45, 0.94),
  "easeOutCubic .33,1,.68,1": bezier(0.33, 1, 0.68, 1),
  "motion easeOut .61,1,.88,1": bezier(0.61, 1, 0.88, 1),
  "easeOutQuart .165,.84,.44,1": bezier(0.165, 0.84, 0.44, 1),
  "cubic .3,.3,.3,1": bezier(0.3, 0.3, 0.3, 1),
  "cubic .22,.61,.36,1": bezier(0.22, 0.61, 0.36, 1),
  "cubic .3,.1,.3,1": bezier(0.3, 0.1, 0.3, 1),
  "cubic .2,.53,.4,.95": bezier(0.2, 0.53, 0.4, 0.95),
  "cubic .34,.2,.3,1": bezier(0.34, 0.2, 0.3, 1),
};

const results = Object.entries(candidates)
  .map(([name, fn]) => {
    const errs = measured.map(([x, y]) => Math.abs(fn(x) - y));
    const rmse = Math.sqrt(errs.reduce((s, e) => s + e * e, 0) / errs.length);
    return { name, rmse: Math.round(rmse * 10000) / 10000 };
  })
  .sort((a, b) => a.rmse - b.rmse);

console.log("Best fits (RMSE, lower = better):");
results.forEach((r) => console.log(`  ${r.rmse.toFixed(5)}  ${r.name}`));

// print the best candidate's predictions vs measured
const best = candidates[results[0].name];
console.log("\nBest-fit table (" + results[0].name + "):");
console.log("time  measured  predicted");
measured.forEach(([x, y]) =>
  console.log(`${x.toFixed(3)}   ${y.toFixed(3)}     ${best(x).toFixed(3)}`)
);
