import assert from "node:assert/strict";
import { buildTrials, computeResults, EXPERIMENTS, seeded } from "../app.js";

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function completeTrials(trials) {
  trials.forEach((trial, index) => {
    trial.response = trial.correct;
    trial.responseSide = trial.correct === "yes" ? "left" : "right";
    trial.rt = 520 + (index % 7) * 24;
    trial.isCorrect = true;
    trial.omission = false;
    if (trial.thoughtProbeAfter) {
      trial.thoughtResponse = {
        value: index % 2 ? "on_task" : "mind_wandering",
        label: index % 2 ? "专注任务" : "走神",
        rt: 900
      };
    }
  });
}

for (const experimentId of Object.keys(EXPERIMENTS)) {
  const formal = buildTrials(experimentId, "formal", seeded(42));
  const practice = buildTrials(experimentId, "practice", seeded(43));
  const experiment = EXPERIMENTS[experimentId];

  assert.equal(new Set(formal.map((trial) => trial.block)).size, 4, `${experimentId} formal blocks`);
  assert.equal(new Set(practice.map((trial) => trial.block)).size, 1, `${experimentId} practice blocks`);
  assert.equal(formal.filter((trial) => trial.thoughtProbeAfter).length, 4, `${experimentId} thought probes`);
  assert.equal(practice.filter((trial) => trial.thoughtProbeAfter).length, 1, `${experimentId} practice thought probe`);

  if (experiment.family === "stroop") {
    assert.equal(formal.length, 96, `${experimentId} formal trial count`);
    assert.equal(practice.length, 8, `${experimentId} practice trial count`);

    for (const block of [1, 2, 3, 4]) {
      const blockTrials = formal.filter((trial) => trial.block === block);
      assert.equal(blockTrials.length, 24, `${experimentId} block ${block} size`);
      const cells = countBy(blockTrials, (trial) => `${trial.trialClass}:${trial.delay}`);
      for (const count of Object.values(cells)) assert.equal(count, 3, `${experimentId} block ${block} cell balance`);
      const cueColors = countBy(blockTrials, (trial) => trial.cueColorKey);
      for (const count of Object.values(cueColors)) assert.equal(count, 6, `${experimentId} block ${block} cue colors`);
    }

    const semanticLures = formal.filter((trial) => trial.trialClass === "semantic_lure");
    assert.ok(semanticLures.every((trial) => trial.correct === "no"), `${experimentId} semantic lures are no trials`);
    assert.ok(semanticLures.every((trial) => trial.conflict === "high"), `${experimentId} semantic lures high conflict`);
  } else {
    assert.equal(formal.length, 128, `${experimentId} formal trial count`);
    assert.equal(practice.length, 16, `${experimentId} practice trial count`);

    for (const block of [1, 2, 3, 4]) {
      const blockTrials = formal.filter((trial) => trial.block === block);
      const counts = countBy(blockTrials, (trial) => trial.trialType);
      assert.deepEqual(counts, { AX: 20, AY: 4, BX: 4, BY: 4 }, `${experimentId} block ${block} AX counts`);
      const delayCells = countBy(blockTrials, (trial) => `${trial.trialType}:${trial.delay}`);
      assert.equal(delayCells["AX:long"], 10, `${experimentId} AX long`);
      assert.equal(delayCells["AX:short"], 10, `${experimentId} AX short`);
      for (const trialType of ["AY", "BX", "BY"]) {
        assert.equal(delayCells[`${trialType}:long`], 2, `${experimentId} ${trialType} long`);
        assert.equal(delayCells[`${trialType}:short`], 2, `${experimentId} ${trialType} short`);
      }
    }
  }

  completeTrials(formal);
  const result = computeResults(formal, experimentId, {
    participantId: "TEST001",
    group: "control",
    responseMap: { left: "yes", right: "no" }
  });
  assert.equal(result.totalTrials, formal.length);
  assert.equal(result.overall.accuracy, 1);
  assert.equal(result.overall.omissionRate, 0);
  assert.ok(result.conditionRows.length >= 8, `${experimentId} condition rows`);
  assert.equal(result.blockRows.length, 4, `${experimentId} block rows`);
  assert.equal(result.thought.total, 4, `${experimentId} thought summary`);
}

console.log("Smoke tests passed.");
