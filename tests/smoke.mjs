import assert from "node:assert/strict";
import { buildTrials, computeResults } from "../app.js";

function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

for (const mode of ["semantic", "classic"]) {
  const trials = buildTrials(mode, "short", seeded(42));
  assert.equal(trials.length, 80, `${mode} short trial count`);
  const counts = trials.reduce((acc, trial) => {
    acc[trial.trialType] = (acc[trial.trialType] || 0) + 1;
    return acc;
  }, {});
  assert.equal(counts.AX, 56, `${mode} AX count`);
  assert.equal(counts.AY, 8, `${mode} AY count`);
  assert.equal(counts.BX, 8, `${mode} BX count`);
  assert.equal(counts.BY, 8, `${mode} BY count`);

  trials.forEach((trial, index) => {
    trial.response = trial.correct;
    trial.rt = 420 + (index % 4) * 35;
    trial.isCorrect = true;
  });

  const result = computeResults(trials, mode);
  assert.equal(result.totalTrials, 80);
  assert.equal(result.validResponses, 80);
  assert.equal(result.accuracy, 1);
  assert.ok(result.rows.length >= 4);
}

const classic = buildTrials("classic", "short", seeded(3));
const letters = new Set(classic.flatMap((trial) => [trial.cue, trial.probe]));
assert.deepEqual([...letters].sort(), ["A", "B", "X", "Y"]);

console.log("Smoke tests passed.");
