export const COLORS = [
  { key: "red", name: "红", css: "#d83232", text: "#ffffff" },
  { key: "blue", name: "蓝", css: "#2468d8", text: "#ffffff" },
  { key: "green", name: "绿", css: "#008f5a", text: "#ffffff" },
  { key: "yellow", name: "黄", css: "#d39b00", text: "#1d1d1b" }
];

const COLOR_MAP = new Map(COLORS.map((color) => [color.key, color]));

export const DELAYS = {
  short: { key: "short", label: "短延迟", ms: 900 },
  long: { key: "long", label: "长延迟", ms: 2600 }
};

export const TIMING = {
  fixation: 250,
  cue: 450,
  probeWindow: 1200,
  postResponse: 120,
  itiMin: 350,
  itiMax: 650
};

const THOUGHT_OPTIONS = [
  { value: "on_task", label: "专注任务", detail: "注意主要在刺激和反应上" },
  { value: "task_related", label: "任务相关", detail: "在想规则、表现或刚才的题" },
  { value: "mind_wandering", label: "走神", detail: "在想与任务无关的内容" },
  { value: "blank", label: "发空", detail: "脑子空白或没有清楚内容" },
  { value: "sleepy", label: "困倦", detail: "明显困、迟钝或快睡着" }
];

const STROOP_CLASSES = [
  {
    id: "target_congruent",
    label: "匹配/一致",
    shortLabel: "是-一致",
    correct: "yes",
    conflict: "low",
    responseClass: "target"
  },
  {
    id: "target_incongruent",
    label: "匹配/冲突",
    shortLabel: "是-冲突",
    correct: "yes",
    conflict: "high",
    responseClass: "target"
  },
  {
    id: "easy_no",
    label: "不匹配/一致",
    shortLabel: "否-一致",
    correct: "no",
    conflict: "low",
    responseClass: "nontarget"
  },
  {
    id: "semantic_lure",
    label: "不匹配/语义诱饵",
    shortLabel: "否-诱饵",
    correct: "no",
    conflict: "high",
    responseClass: "nontarget"
  }
];

export const EXPERIMENTS = {
  late_stroop: {
    id: "late_stroop",
    title: "Late Stroop-CPT",
    shortTitle: "Stroop 在后",
    family: "stroop",
    stroopPosition: "late",
    headline: "先记住图案颜色，再判断颜色词的字体颜色是否一致。",
    rule: "图案先出现。请记住图案颜色；颜色词出现后，只判断文字的字体颜色是否与刚才图案颜色一致，忽略文字含义。",
    formal: { blocks: 4, repsPerCell: 3 },
    practice: { blocks: 1, repsPerCell: 1 }
  },
  early_stroop: {
    id: "early_stroop",
    title: "Early Stroop-CPT",
    shortTitle: "Stroop 在前",
    family: "stroop",
    stroopPosition: "early",
    headline: "先记住颜色词的字体颜色，再判断后续图案颜色是否一致。",
    rule: "颜色词先出现。请记住文字的字体颜色，忽略文字含义；图案出现后，判断图案颜色是否与刚才字体颜色一致。",
    formal: { blocks: 4, repsPerCell: 3 },
    practice: { blocks: 1, repsPerCell: 1 }
  },
  color_ax: {
    id: "color_ax",
    title: "Color AX-CPT",
    shortTitle: "颜色 AX 对照",
    family: "ax",
    stroopPosition: "none",
    headline: "用颜色色块和中性颜色词验证 AX-CPT 材料，不加入 Stroop 冲突。",
    rule: "每个 block 会指定一个目标颜色。只有目标颜色色块后接同名颜色词时按“是”，其他组合都按“否”。颜色词用中性颜色呈现。",
    formal: { blocks: 4, countsPerBlock: { AX: 20, AY: 4, BX: 4, BY: 4 } },
    practice: { blocks: 1, countsPerBlock: { AX: 4, AY: 4, BX: 4, BY: 4 } }
  }
};

const RESPONSE_LABELS = {
  yes: "是",
  no: "否"
};

const state = {
  experimentId: "late_stroop",
  runMode: "practice",
  participantId: "",
  group: "control",
  responseMap: { left: "yes", right: "no" },
  trials: [],
  current: -1,
  accepting: false,
  probeStart: 0,
  responseDeadlineId: null,
  timers: [],
  thoughtStart: 0,
  result: null
};

const hasDocument = typeof document !== "undefined";
const $ = (id) => (hasDocument ? document.getElementById(id) : null);

const screens = hasDocument
  ? {
      setup: $("setupScreen"),
      block: $("blockScreen"),
      trial: $("trialScreen"),
      thought: $("thoughtScreen"),
      results: $("resultsScreen")
    }
  : {};

function color(key) {
  return COLOR_MAP.get(key);
}

function shuffle(array, rng = Math.random) {
  const out = array.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function randomItem(items, rng = Math.random) {
  return items[Math.floor(rng() * items.length)];
}

function otherColor(baseKey, rng = Math.random, excluded = []) {
  const blocked = new Set([baseKey, ...excluded]);
  return randomItem(COLORS.filter((item) => !blocked.has(item.key)), rng).key;
}

function repeatItems(items, count) {
  return Array.from({ length: count }, () => items).flat();
}

function hasRun(items, selector, maxRun) {
  let last = null;
  let run = 0;
  for (const item of items) {
    const value = selector(item);
    run = value === last ? run + 1 : 1;
    last = value;
    if (run > maxRun) return true;
  }
  return false;
}

function constrainedShuffle(items, rng = Math.random) {
  for (let attempt = 0; attempt < 800; attempt += 1) {
    const candidate = shuffle(items, rng);
    const badResponseRun = hasRun(candidate, (item) => item.correct, 4);
    const badDelayRun = hasRun(candidate, (item) => item.delay, 4);
    const badClassRun = hasRun(candidate, (item) => item.trialClass || item.trialType, 3);
    if (!badResponseRun && !badDelayRun && !badClassRun) return candidate;
  }
  return shuffle(items, rng);
}

function makeDelayDescriptors() {
  return Object.keys(DELAYS);
}

function buildStroopDescriptors(repsPerCell) {
  const descriptors = [];
  for (const trialClass of STROOP_CLASSES) {
    for (const delay of makeDelayDescriptors()) {
      for (let i = 0; i < repsPerCell; i += 1) {
        descriptors.push({
          trialClass: trialClass.id,
          delay,
          correct: trialClass.correct
        });
      }
    }
  }
  return descriptors;
}

function materializeLateTrial(experiment, descriptor, block, blockTrial, cueColorKey, rng) {
  const trialClass = STROOP_CLASSES.find((item) => item.id === descriptor.trialClass);
  let probeInkKey = cueColorKey;
  let wordColorKey = cueColorKey;

  if (descriptor.trialClass === "target_incongruent") {
    wordColorKey = otherColor(cueColorKey, rng);
  }

  if (descriptor.trialClass === "easy_no") {
    probeInkKey = otherColor(cueColorKey, rng);
    wordColorKey = probeInkKey;
  }

  if (descriptor.trialClass === "semantic_lure") {
    probeInkKey = otherColor(cueColorKey, rng);
    wordColorKey = cueColorKey;
  }

  return baseTrial(experiment, descriptor, trialClass, block, blockTrial, {
    cueColorKey,
    probeColorKey: probeInkKey,
    wordColorKey,
    cue: { kind: "shape", colorKey: cueColorKey },
    probe: { kind: "word", wordColorKey, inkColorKey: probeInkKey }
  });
}

function materializeEarlyTrial(experiment, descriptor, block, blockTrial, cueInkKey, rng) {
  const trialClass = STROOP_CLASSES.find((item) => item.id === descriptor.trialClass);
  let cueWordKey = cueInkKey;
  let probeColorKey = cueInkKey;

  if (descriptor.trialClass === "target_incongruent") {
    cueWordKey = otherColor(cueInkKey, rng);
  }

  if (descriptor.trialClass === "easy_no") {
    probeColorKey = otherColor(cueInkKey, rng);
  }

  if (descriptor.trialClass === "semantic_lure") {
    cueWordKey = otherColor(cueInkKey, rng);
    probeColorKey = cueWordKey;
  }

  return baseTrial(experiment, descriptor, trialClass, block, blockTrial, {
    cueColorKey: cueInkKey,
    probeColorKey,
    wordColorKey: cueWordKey,
    cue: { kind: "word", wordColorKey: cueWordKey, inkColorKey: cueInkKey },
    probe: { kind: "shape", colorKey: probeColorKey }
  });
}

function baseTrial(experiment, descriptor, trialClass, block, blockTrial, material) {
  return {
    id: `${experiment.id}-b${block}-t${blockTrial}`,
    experimentId: experiment.id,
    experimentTitle: experiment.title,
    runMode: null,
    block,
    blockTrial,
    trialClass: descriptor.trialClass,
    trialClassLabel: trialClass.label,
    delay: descriptor.delay,
    delayLabel: DELAYS[descriptor.delay].label,
    delayMs: DELAYS[descriptor.delay].ms,
    conflict: trialClass.conflict,
    responseClass: trialClass.responseClass,
    correct: trialClass.correct,
    correctLabel: RESPONSE_LABELS[trialClass.correct],
    cueColorKey: material.cueColorKey,
    probeColorKey: material.probeColorKey,
    wordColorKey: material.wordColorKey,
    cue: material.cue,
    probe: material.probe,
    response: null,
    responseSide: null,
    rt: null,
    isCorrect: false,
    omission: false,
    thoughtProbeAfter: false,
    thoughtResponse: null
  };
}

function buildStroopTrials(experiment, runMode, rng = Math.random) {
  const plan = experiment[runMode];
  const trials = [];

  for (let block = 1; block <= plan.blocks; block += 1) {
    const descriptors = constrainedShuffle(buildStroopDescriptors(plan.repsPerCell), rng);
    const baseColors = shuffle(repeatItems(COLORS.map((item) => item.key), descriptors.length / COLORS.length), rng);

    descriptors.forEach((descriptor, index) => {
      const cueColorKey = baseColors[index];
      const trial = experiment.stroopPosition === "late"
        ? materializeLateTrial(experiment, descriptor, block, index + 1, cueColorKey, rng)
        : materializeEarlyTrial(experiment, descriptor, block, index + 1, cueColorKey, rng);
      trial.runMode = runMode;
      trials.push(trial);
    });
  }

  assignThoughtProbes(trials, runMode, rng);
  return trials;
}

function buildAxDescriptors(countsPerBlock) {
  const descriptors = [];
  for (const [trialType, count] of Object.entries(countsPerBlock)) {
    const half = count / 2;
    for (const delay of makeDelayDescriptors()) {
      for (let i = 0; i < half; i += 1) {
        descriptors.push({
          trialType,
          trialClass: trialType,
          delay,
          correct: trialType === "AX" ? "yes" : "no"
        });
      }
    }
  }
  return descriptors;
}

function materializeAxTrial(experiment, descriptor, block, blockTrial, targetColorKey, rng) {
  const nonTargets = COLORS.filter((item) => item.key !== targetColorKey).map((item) => item.key);
  let cueColorKey = targetColorKey;
  let probeWordKey = targetColorKey;

  if (descriptor.trialType === "AY") {
    probeWordKey = randomItem(nonTargets, rng);
  }

  if (descriptor.trialType === "BX") {
    cueColorKey = randomItem(nonTargets, rng);
  }

  if (descriptor.trialType === "BY") {
    cueColorKey = randomItem(nonTargets, rng);
    probeWordKey = randomItem(nonTargets, rng);
  }

  return {
    id: `${experiment.id}-b${block}-t${blockTrial}`,
    experimentId: experiment.id,
    experimentTitle: experiment.title,
    runMode: null,
    block,
    blockTrial,
    targetColorKey,
    targetColorName: color(targetColorKey).name,
    trialType: descriptor.trialType,
    trialClass: descriptor.trialType,
    trialClassLabel: descriptor.trialType,
    delay: descriptor.delay,
    delayLabel: DELAYS[descriptor.delay].label,
    delayMs: DELAYS[descriptor.delay].ms,
    conflict: descriptor.trialType === "AY" || descriptor.trialType === "BX" ? "high" : "low",
    responseClass: descriptor.trialType === "AX" ? "target" : "nontarget",
    correct: descriptor.trialType === "AX" ? "yes" : "no",
    correctLabel: descriptor.trialType === "AX" ? "是" : "否",
    cueColorKey,
    probeColorKey: null,
    wordColorKey: probeWordKey,
    cue: { kind: "shape", colorKey: cueColorKey },
    probe: { kind: "word", wordColorKey: probeWordKey, neutral: true },
    response: null,
    responseSide: null,
    rt: null,
    isCorrect: false,
    omission: false,
    thoughtProbeAfter: false,
    thoughtResponse: null
  };
}

function buildAxTrials(experiment, runMode, rng = Math.random) {
  const plan = experiment[runMode];
  const trials = [];
  const targetOrder = shuffle(COLORS.map((item) => item.key), rng);

  for (let block = 1; block <= plan.blocks; block += 1) {
    const targetColorKey = targetOrder[(block - 1) % targetOrder.length];
    const descriptors = constrainedShuffle(buildAxDescriptors(plan.countsPerBlock), rng);
    descriptors.forEach((descriptor, index) => {
      const trial = materializeAxTrial(experiment, descriptor, block, index + 1, targetColorKey, rng);
      trial.runMode = runMode;
      trials.push(trial);
    });
  }

  assignThoughtProbes(trials, runMode, rng);
  return trials;
}

function assignThoughtProbes(trials, runMode, rng = Math.random) {
  const blocks = [...new Set(trials.map((trial) => trial.block))];
  for (const block of blocks) {
    const blockTrials = trials.filter((trial) => trial.block === block);
    const minPosition = runMode === "practice" ? Math.min(4, blockTrials.length - 1) : 6;
    const maxPosition = blockTrials.length - 3;
    if (maxPosition < minPosition) continue;
    const position = minPosition + Math.floor(rng() * (maxPosition - minPosition + 1));
    blockTrials[position].thoughtProbeAfter = true;
  }
}

export function buildTrials(experimentId = "late_stroop", runMode = "formal", rng = Math.random) {
  const experiment = EXPERIMENTS[experimentId];
  if (!experiment) throw new Error(`Unknown experiment: ${experimentId}`);
  if (experiment.family === "ax") return buildAxTrials(experiment, runMode, rng);
  return buildStroopTrials(experiment, runMode, rng);
}

function cleanNumbers(values) {
  return values.filter((value) => Number.isFinite(value));
}

function mean(values) {
  const clean = cleanNumbers(values);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : null;
}

function median(values) {
  const clean = cleanNumbers(values).sort((a, b) => a - b);
  if (!clean.length) return null;
  const mid = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
}

function sd(values) {
  const clean = cleanNumbers(values);
  if (clean.length < 2) return null;
  const m = mean(clean);
  const variance = clean.reduce((sum, value) => sum + (value - m) ** 2, 0) / (clean.length - 1);
  return Math.sqrt(variance);
}

function summarizeTrials(group) {
  const responded = group.filter((trial) => trial.response);
  const correct = group.filter((trial) => trial.isCorrect);
  const correctRts = group.filter((trial) => trial.isCorrect && Number.isFinite(trial.rt)).map((trial) => trial.rt);
  const rts = responded.filter((trial) => Number.isFinite(trial.rt)).map((trial) => trial.rt);
  const falseYes = group.filter((trial) => trial.correct === "no" && trial.response === "yes");

  return {
    n: group.length,
    responses: responded.length,
    omissions: group.length - responded.length,
    omissionRate: group.length ? (group.length - responded.length) / group.length : null,
    accuracy: group.length ? correct.length / group.length : null,
    responseAccuracy: responded.length ? responded.filter((trial) => trial.isCorrect).length / responded.length : null,
    errorRate: group.length ? 1 - correct.length / group.length : null,
    falseYesRate: group.length ? falseYes.length / group.length : null,
    medianRt: median(correctRts),
    meanRt: mean(correctRts),
    rtSd: sd(rts),
    rtCv: mean(rts) ? sd(rts) / mean(rts) : null
  };
}

function groupBy(trials, keyFn) {
  const map = new Map();
  for (const trial of trials) {
    const key = keyFn(trial);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(trial);
  }
  return map;
}

function rowFromGroup(key, group, experiment) {
  const summary = summarizeTrials(group);
  const first = group[0];
  const row = {
    key,
    block: first.block,
    delay: first.delay,
    delayLabel: first.delayLabel,
    conflict: first.conflict,
    trialClass: first.trialClass,
    trialClassLabel: first.trialClassLabel,
    trialType: first.trialType || "",
    ...summary
  };

  if (experiment.family === "ax") {
    row.label = `${first.trialType} · ${first.delayLabel}`;
  } else {
    row.label = `${first.trialClassLabel} · ${first.delayLabel}`;
  }

  return row;
}

function summarizeByCondition(trials, experiment) {
  const groups = groupBy(trials, (trial) => `${trial.trialClass}:${trial.delay}`);
  return [...groups.entries()]
    .map(([key, group]) => rowFromGroup(key, group, experiment))
    .sort((a, b) => {
      const classOrder = experiment.family === "ax"
        ? ["AX", "AY", "BX", "BY"]
        : STROOP_CLASSES.map((item) => item.id);
      const aClass = classOrder.indexOf(a.trialClass);
      const bClass = classOrder.indexOf(b.trialClass);
      if (aClass !== bClass) return aClass - bClass;
      return a.delay.localeCompare(b.delay);
    });
}

function summarizeByBlock(trials) {
  const groups = groupBy(trials, (trial) => String(trial.block));
  return [...groups.entries()]
    .map(([block, group]) => ({ block: Number(block), ...summarizeTrials(group) }))
    .sort((a, b) => a.block - b.block);
}

function metricFor(trials, predicate, metric = "medianRt") {
  const summary = summarizeTrials(trials.filter(predicate));
  return summary[metric];
}

function diff(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) ? a - b : null;
}

function stroopIndices(trials) {
  const longHighRt = metricFor(trials, (trial) => trial.delay === "long" && trial.conflict === "high");
  const longLowRt = metricFor(trials, (trial) => trial.delay === "long" && trial.conflict === "low");
  const shortHighRt = metricFor(trials, (trial) => trial.delay === "short" && trial.conflict === "high");
  const shortLowRt = metricFor(trials, (trial) => trial.delay === "short" && trial.conflict === "low");
  const longLureError = metricFor(trials, (trial) => trial.delay === "long" && trial.trialClass === "semantic_lure", "falseYesRate");
  const shortLureError = metricFor(trials, (trial) => trial.delay === "short" && trial.trialClass === "semantic_lure", "falseYesRate");
  const longEasyNoError = metricFor(trials, (trial) => trial.delay === "long" && trial.trialClass === "easy_no", "falseYesRate");
  const shortEasyNoError = metricFor(trials, (trial) => trial.delay === "short" && trial.trialClass === "easy_no", "falseYesRate");

  return {
    delayCostRt: diff(
      metricFor(trials, (trial) => trial.delay === "long"),
      metricFor(trials, (trial) => trial.delay === "short")
    ),
    conflictCostRt: diff(
      metricFor(trials, (trial) => trial.conflict === "high"),
      metricFor(trials, (trial) => trial.conflict === "low")
    ),
    lureCostRt: diff(
      metricFor(trials, (trial) => trial.trialClass === "semantic_lure"),
      metricFor(trials, (trial) => trial.trialClass === "easy_no")
    ),
    maintenanceConflictRt: diff(diff(longHighRt, longLowRt), diff(shortHighRt, shortLowRt)),
    semanticCaptureRate: metricFor(trials, (trial) => trial.trialClass === "semantic_lure", "falseYesRate"),
    maintenanceLureError: diff(diff(longLureError, longEasyNoError), diff(shortLureError, shortEasyNoError))
  };
}

function axIndices(trials) {
  const axRt = metricFor(trials, (trial) => trial.trialType === "AX");
  const ayRt = metricFor(trials, (trial) => trial.trialType === "AY");
  const bxRt = metricFor(trials, (trial) => trial.trialType === "BX");
  const byRt = metricFor(trials, (trial) => trial.trialType === "BY");
  const ayCost = diff(ayRt, byRt);
  const bxCost = diff(bxRt, byRt);

  return {
    axTargetRt: axRt,
    ayCostRt: ayCost,
    bxCostRt: bxCost,
    pbiRt: Number.isFinite(ayCost) && Number.isFinite(bxCost) && ayCost + bxCost !== 0
      ? (ayCost - bxCost) / (ayCost + bxCost)
      : null,
    delayCostRt: diff(
      metricFor(trials, (trial) => trial.delay === "long"),
      metricFor(trials, (trial) => trial.delay === "short")
    )
  };
}

function timeOnTaskIndices(blockRows) {
  const first = blockRows[0];
  const last = blockRows[blockRows.length - 1];
  return {
    blockRtSlope: first && last ? diff(last.medianRt, first.medianRt) : null,
    blockAccuracySlope: first && last ? diff(last.accuracy, first.accuracy) : null,
    blockOmissionSlope: first && last ? diff(last.omissionRate, first.omissionRate) : null,
    blockRtVariabilitySlope: first && last ? diff(last.rtSd, first.rtSd) : null
  };
}

function thoughtSummary(trials) {
  const probed = trials.filter((trial) => trial.thoughtResponse);
  const counts = Object.fromEntries(THOUGHT_OPTIONS.map((option) => [option.value, 0]));
  for (const trial of probed) counts[trial.thoughtResponse.value] += 1;

  const windows = probed.map((probeTrial) => {
    const index = trials.indexOf(probeTrial);
    const previous = trials.slice(Math.max(0, index - 5), index + 1);
    return {
      response: probeTrial.thoughtResponse.value,
      offTask: ["mind_wandering", "blank", "sleepy"].includes(probeTrial.thoughtResponse.value),
      ...summarizeTrials(previous)
    };
  });

  const onTask = windows.filter((window) => !window.offTask);
  const offTask = windows.filter((window) => window.offTask);

  return {
    total: probed.length,
    counts,
    preProbe: {
      onTaskN: onTask.length,
      offTaskN: offTask.length,
      offTaskMinusOnTaskRt: diff(mean(offTask.map((item) => item.medianRt)), mean(onTask.map((item) => item.medianRt))),
      offTaskMinusOnTaskAccuracy: diff(mean(offTask.map((item) => item.accuracy)), mean(onTask.map((item) => item.accuracy))),
      offTaskMinusOnTaskRtSd: diff(mean(offTask.map((item) => item.rtSd)), mean(onTask.map((item) => item.rtSd)))
    }
  };
}

export function computeResults(trials, experimentId = trials[0]?.experimentId || "late_stroop", meta = {}) {
  const experiment = EXPERIMENTS[experimentId];
  const overall = summarizeTrials(trials);
  const conditionRows = summarizeByCondition(trials, experiment);
  const blockRows = summarizeByBlock(trials);
  const timeOnTask = timeOnTaskIndices(blockRows);

  return {
    experimentId,
    experimentTitle: experiment.title,
    runMode: trials[0]?.runMode || meta.runMode || "formal",
    participantId: meta.participantId || "",
    group: meta.group || "",
    generatedAt: new Date().toISOString(),
    timing: TIMING,
    delays: DELAYS,
    responseMap: meta.responseMap || null,
    totalTrials: trials.length,
    overall,
    conditionRows,
    blockRows,
    indices: experiment.family === "ax" ? axIndices(trials) : stroopIndices(trials),
    timeOnTask,
    thought: thoughtSummary(trials)
  };
}

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("screen-active"));
  screens[name].classList.add("screen-active");
}

function htmlStimulus(stimulus, extraClass = "") {
  if (!stimulus) return "";
  if (stimulus.kind === "shape") {
    const item = color(stimulus.colorKey);
    return `<div class="color-shape ${extraClass}" style="--stimulus-color:${item.css}; --stimulus-text:${item.text}" aria-label="${item.name}色图案"></div>`;
  }

  if (stimulus.kind === "word") {
    const word = color(stimulus.wordColorKey);
    const ink = stimulus.neutral ? { css: "#1f242b", text: "#1f242b" } : color(stimulus.inkColorKey);
    const neutralClass = stimulus.neutral ? " neutral-word" : "";
    return `<div class="color-word${neutralClass} ${extraClass}" style="--word-color:${ink.css}" aria-label="${word.name}字">${word.name}</div>`;
  }

  return "";
}

function renderStimulus(stimulus, phase) {
  $("phaseLabel").textContent = phase;
  if (typeof stimulus === "string") {
    $("stimulusHost").className = "stimulus-host";
    $("stimulusHost").textContent = stimulus;
    return;
  }
  $("stimulusHost").className = "stimulus-host stimulus-rendered";
  $("stimulusHost").innerHTML = htmlStimulus(stimulus);
}

function responseForSide(side) {
  return state.responseMap[side];
}

function sideForResponse(response) {
  return state.responseMap.left === response ? "left" : "right";
}

function autoResponseMap(participantId) {
  const text = participantId.trim();
  if (!text) return { left: "yes", right: "no" };
  const sum = [...text].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return sum % 2 === 0 ? { left: "yes", right: "no" } : { left: "no", right: "yes" };
}

function renderResponseButtons() {
  const left = responseForSide("left");
  const right = responseForSide("right");
  $("leftResponseButton").textContent = `${RESPONSE_LABELS[left]}  F`;
  $("rightResponseButton").textContent = `${RESPONSE_LABELS[right]}  J`;
  $("leftResponseButton").dataset.response = left;
  $("rightResponseButton").dataset.response = right;
  $("leftResponseButton").className = `response-button ${left}`;
  $("rightResponseButton").className = `response-button ${right}`;
  $("mappingPreview").innerHTML = `
    <span>左/F：${RESPONSE_LABELS[left]}</span>
    <span>右/J：${RESPONSE_LABELS[right]}</span>
  `;
}

function setResponseDisabled(disabled) {
  $("leftResponseButton").disabled = disabled;
  $("rightResponseButton").disabled = disabled;
}

function setupExperimentCards() {
  $("experimentCards").innerHTML = Object.values(EXPERIMENTS).map((experiment) => `
    <button class="experiment-card${experiment.id === state.experimentId ? " active" : ""}" type="button" data-experiment-id="${experiment.id}">
      <span>${experiment.shortTitle}</span>
      <strong>${experiment.title}</strong>
      <em>${experiment.headline}</em>
    </button>
  `).join("");

  document.querySelectorAll(".experiment-card").forEach((button) => {
    button.addEventListener("click", () => {
      state.experimentId = button.dataset.experimentId;
      document.querySelectorAll(".experiment-card").forEach((item) => item.classList.toggle("active", item === button));
      renderSetup();
    });
  });
}

function estimatedSeconds(experimentId, runMode) {
  const trials = buildTrials(experimentId, runMode, seeded(11));
  const meanDelay = mean(Object.values(DELAYS).map((delay) => delay.ms));
  const perTrial = TIMING.fixation + TIMING.cue + meanDelay + 760 + (TIMING.itiMin + TIMING.itiMax) / 2;
  const blockBreaks = new Set(trials.map((trial) => trial.block)).size * 8;
  const thought = trials.filter((trial) => trial.thoughtProbeAfter).length * 8;
  return Math.round((trials.length * perTrial) / 1000 + blockBreaks + thought);
}

function renderSetup() {
  const experiment = EXPERIMENTS[state.experimentId];
  const formalCount = buildTrials(state.experimentId, "formal", seeded(7)).length;
  const practiceCount = buildTrials(state.experimentId, "practice", seeded(7)).length;
  const seconds = estimatedSeconds(state.experimentId, state.runMode);

  $("experimentSummary").textContent = experiment.rule;
  $("formalTrials").textContent = String(formalCount);
  $("practiceTrials").textContent = String(practiceCount);
  $("blockCount").textContent = String(experiment.formal.blocks);
  $("durationEstimate").textContent = `约 ${Math.ceil(seconds / 60)} 分钟`;

  const previewTrial = buildTrials(state.experimentId, "practice", seeded(3))[0];
  $("previewCue").innerHTML = htmlStimulus(previewTrial.cue, "preview-inner");
  $("previewProbe").innerHTML = htmlStimulus(previewTrial.probe, "preview-inner");
}

function setupControls() {
  setupExperimentCards();
  renderThoughtOptions();

  $("participantInput").addEventListener("input", (event) => {
    state.participantId = event.target.value;
    state.responseMap = autoResponseMap(state.participantId);
    renderResponseButtons();
  });

  $("groupSelect").addEventListener("change", (event) => {
    state.group = event.target.value;
  });

  document.querySelectorAll(".segment-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.runMode = button.dataset.runMode;
      document.querySelectorAll(".segment-button").forEach((item) => {
        item.classList.toggle("active", item === button);
        item.setAttribute("aria-selected", item === button ? "true" : "false");
      });
      renderSetup();
    });
  });

  $("startButton").addEventListener("click", startRun);
  $("continueButton").addEventListener("click", startNextTrial);
  $("leftResponseButton").addEventListener("click", () => recordResponse(responseForSide("left"), "left"));
  $("rightResponseButton").addEventListener("click", () => recordResponse(responseForSide("right"), "right"));
  $("restartButton").addEventListener("click", () => {
    clearTimers();
    showScreen("setup");
  });
  $("downloadJsonButton").addEventListener("click", downloadJson);
  $("downloadCsvButton").addEventListener("click", downloadCsv);
  $("copyButton").addEventListener("click", copySummary);

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "f" || event.key === "ArrowLeft") recordResponse(responseForSide("left"), "left");
    if (key === "j" || event.key === "ArrowRight") recordResponse(responseForSide("right"), "right");
    if (screens.thought.classList.contains("screen-active") && /^[1-5]$/.test(key)) {
      const option = THOUGHT_OPTIONS[Number(key) - 1];
      if (option) recordThought(option.value);
    }
  });

  renderResponseButtons();
  renderSetup();
}

function startRun() {
  clearTimers();
  state.participantId = $("participantInput").value.trim();
  state.group = $("groupSelect").value;
  state.responseMap = autoResponseMap(state.participantId);
  state.trials = buildTrials(state.experimentId, state.runMode);
  state.current = -1;
  state.result = null;
  renderResponseButtons();
  prepareBlock(0);
}

function prepareBlock(index) {
  const trial = state.trials[index];
  const experiment = EXPERIMENTS[state.experimentId];
  const blockTotal = new Set(state.trials.map((item) => item.block)).size;
  $("blockKicker").textContent = `Block ${trial.block} / ${blockTotal}`;
  $("blockTitle").textContent = experiment.title;
  $("blockModeBadge").textContent = state.runMode === "practice" ? "练习" : "正式";
  $("blockInstruction").textContent = experiment.rule;
  $("rulePreview").innerHTML = rulePreviewHtml(experiment, trial);
  showScreen("block");
}

function rulePreviewHtml(experiment, trial) {
  if (experiment.family === "ax") {
    return `
      <div class="rule-card">
        <span>本 block 目标色</span>
        ${htmlStimulus({ kind: "shape", colorKey: trial.targetColorKey })}
        <strong>${trial.targetColorName}</strong>
      </div>
      <div class="rule-card">
        <span>目标词</span>
        ${htmlStimulus({ kind: "word", wordColorKey: trial.targetColorKey, neutral: true })}
        <strong>只对目标色块 + 目标词按是</strong>
      </div>
    `;
  }

  return `
    <div class="rule-card">
      <span>只记相关颜色</span>
      ${htmlStimulus(trial.cue)}
    </div>
    <div class="rule-card">
      <span>忽略文字含义</span>
      ${htmlStimulus(trial.probe)}
    </div>
  `;
}

function startNextTrial() {
  state.current += 1;
  if (state.current >= state.trials.length) {
    finishRun();
    return;
  }

  const trial = state.trials[state.current];
  const previous = state.trials[state.current - 1];
  if (previous && trial.block !== previous.block) {
    prepareBlock(state.current);
    state.current -= 1;
    return;
  }

  showScreen("trial");
  renderProgress();
  setResponseDisabled(true);
  runTrial(trial);
}

function renderProgress() {
  const trial = state.trials[state.current];
  const total = state.trials.length;
  $("trialExperimentLabel").textContent = EXPERIMENTS[state.experimentId].shortTitle;
  $("trialConditionLabel").textContent = `${trial.delayLabel} · ${trial.trialClassLabel}`;
  $("trialCounter").textContent = `${state.current + 1} / ${total}`;
  $("progressBar").style.width = `${(state.current / total) * 100}%`;
}

function runTrial(trial) {
  state.accepting = false;
  state.responseDeadlineId = null;
  renderStimulus("+", "准备");

  queue(() => renderStimulus(trial.cue, "Cue"), TIMING.fixation);
  queue(() => renderStimulus("+", trial.delayLabel), TIMING.fixation + TIMING.cue);
  queue(() => {
    state.accepting = true;
    state.probeStart = performance.now();
    setResponseDisabled(false);
    renderStimulus(trial.probe, "Probe");
    state.responseDeadlineId = queue(() => finishTrial(false), TIMING.probeWindow);
  }, TIMING.fixation + TIMING.cue + trial.delayMs);
}

function recordResponse(response, side = sideForResponse(response)) {
  if (!state.accepting || state.current < 0) return;
  const trial = state.trials[state.current];
  if (trial.response) return;

  trial.response = response;
  trial.responseSide = side;
  trial.rt = Math.round(performance.now() - state.probeStart);
  trial.isCorrect = response === trial.correct;
  trial.omission = false;
  state.accepting = false;
  setResponseDisabled(true);
  if (state.responseDeadlineId) {
    clearTimeout(state.responseDeadlineId);
    state.timers = state.timers.filter((id) => id !== state.responseDeadlineId);
    state.responseDeadlineId = null;
  }
  queue(() => finishTrial(true), TIMING.postResponse);
}

function finishTrial(hadResponse) {
  if (state.current < 0) return;
  const trial = state.trials[state.current];
  if (!hadResponse && !trial.response) {
    trial.omission = true;
    trial.isCorrect = false;
    state.accepting = false;
    setResponseDisabled(true);
  }

  renderStimulus("+", "间隔");
  const next = () => {
    if (trial.thoughtProbeAfter) showThoughtProbe(trial);
    else startNextTrial();
  };
  queue(next, randomBetween(TIMING.itiMin, TIMING.itiMax));
}

function clearTimers() {
  state.timers.forEach((id) => clearTimeout(id));
  state.timers = [];
  state.responseDeadlineId = null;
  state.accepting = false;
}

function queue(callback, delay) {
  const id = setTimeout(() => {
    state.timers = state.timers.filter((timerId) => timerId !== id);
    callback();
  }, delay);
  state.timers.push(id);
  return id;
}

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function renderThoughtOptions() {
  $("thoughtOptions").innerHTML = THOUGHT_OPTIONS.map((option, index) => `
    <button type="button" class="thought-option" data-thought-value="${option.value}">
      <span>${index + 1}. ${option.label}</span>
      <em>${option.detail}</em>
    </button>
  `).join("");

  document.querySelectorAll(".thought-option").forEach((button) => {
    button.addEventListener("click", () => recordThought(button.dataset.thoughtValue));
  });
}

function showThoughtProbe(trial) {
  state.thoughtStart = performance.now();
  $("thoughtScreen").dataset.trialId = trial.id;
  showScreen("thought");
}

function recordThought(value) {
  const trial = state.trials.find((item) => item.id === $("thoughtScreen").dataset.trialId);
  const option = THOUGHT_OPTIONS.find((item) => item.value === value);
  if (!trial || !option || trial.thoughtResponse) return;
  trial.thoughtResponse = {
    value,
    label: option.label,
    rt: Math.round(performance.now() - state.thoughtStart)
  };
  startNextTrial();
}

function finishRun() {
  clearTimers();
  $("progressBar").style.width = "100%";
  state.result = computeResults(state.trials, state.experimentId, {
    participantId: state.participantId,
    group: state.group,
    runMode: state.runMode,
    responseMap: state.responseMap
  });
  renderResults(state.result);
  showScreen("results");
}

function pct(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : "NA";
}

function pctSigned(value) {
  return Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${Math.round(value * 100)} pct-pt` : "NA";
}

function ms(value) {
  return Number.isFinite(value) ? `${Math.round(value)} ms` : "NA";
}

function signedMs(value) {
  return Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${Math.round(value)} ms` : "NA";
}

function decimals(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "NA";
}

function renderResults(result) {
  $("resultTitle").textContent = result.experimentTitle;
  $("resultCards").innerHTML = [
    resultCard("正确率", pct(result.overall.accuracy)),
    resultCard("中位 RT", ms(result.overall.medianRt)),
    resultCard("遗漏率", pct(result.overall.omissionRate)),
    resultCard("RT 变异", ms(result.overall.rtSd))
  ].join("");
  renderIndexCards(result);
  renderConditionTable(result);
  renderBlockTable(result);
  renderThoughtSummary(result);
}

function resultCard(label, value) {
  return `<div class="result-card"><span>${label}</span><strong>${value}</strong></div>`;
}

function renderIndexCards(result) {
  const experiment = EXPERIMENTS[result.experimentId];
  if (experiment.family === "ax") {
    $("indexCards").innerHTML = [
      resultCard("AY 代价", signedMs(result.indices.ayCostRt)),
      resultCard("BX 代价", signedMs(result.indices.bxCostRt)),
      resultCard("PBI-RT", decimals(result.indices.pbiRt)),
      resultCard("长延迟代价", signedMs(result.indices.delayCostRt)),
      resultCard("Block RT 斜率", signedMs(result.timeOnTask.blockRtSlope)),
      resultCard("遗漏率斜率", pctSigned(result.timeOnTask.blockOmissionSlope))
    ].join("");
    return;
  }

  $("indexCards").innerHTML = [
    resultCard("冲突 RT 代价", signedMs(result.indices.conflictCostRt)),
    resultCard("长延迟代价", signedMs(result.indices.delayCostRt)),
    resultCard("语义诱饵 RT", signedMs(result.indices.lureCostRt)),
    resultCard("语义捕获率", pct(result.indices.semanticCaptureRate)),
    resultCard("维持×冲突 RT", signedMs(result.indices.maintenanceConflictRt)),
    resultCard("Block RT 斜率", signedMs(result.timeOnTask.blockRtSlope))
  ].join("");
}

function renderConditionTable(result) {
  const rows = result.conditionRows.map((row) => `
    <tr>
      <td>${row.label}</td>
      <td>${row.n}</td>
      <td>${pct(row.accuracy)}</td>
      <td>${pct(row.omissionRate)}</td>
      <td>${pct(row.falseYesRate)}</td>
      <td>${ms(row.medianRt)}</td>
      <td>${ms(row.rtSd)}</td>
    </tr>
  `).join("");

  $("conditionTable").innerHTML = `
    <thead>
      <tr>
        <th>条件</th>
        <th>n</th>
        <th>正确率</th>
        <th>遗漏率</th>
        <th>误按是</th>
        <th>中位 RT</th>
        <th>RT SD</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  `;
}

function renderBlockTable(result) {
  const rows = result.blockRows.map((row) => `
    <tr>
      <td>Block ${row.block}</td>
      <td>${row.n}</td>
      <td>${pct(row.accuracy)}</td>
      <td>${pct(row.omissionRate)}</td>
      <td>${ms(row.medianRt)}</td>
      <td>${ms(row.rtSd)}</td>
    </tr>
  `).join("");

  $("blockTable").innerHTML = `
    <thead>
      <tr>
        <th>Block</th>
        <th>n</th>
        <th>正确率</th>
        <th>遗漏率</th>
        <th>中位 RT</th>
        <th>RT SD</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  `;
}

function renderThoughtSummary(result) {
  const labels = Object.fromEntries(THOUGHT_OPTIONS.map((item) => [item.value, item.label]));
  const counts = Object.entries(result.thought.counts)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${labels[key]} ${count}`)
    .join("；") || "无";

  $("thoughtSummary").innerHTML = [
    `<p><strong>Thought probe：</strong>${result.thought.total} 次；${counts}。</p>`,
    `<p><strong>脱离前窗口：</strong>off-task 与 on-task 前 5 题比较，RT ${signedMs(result.thought.preProbe.offTaskMinusOnTaskRt)}，正确率 ${pctSigned(result.thought.preProbe.offTaskMinusOnTaskAccuracy)}，RT SD ${signedMs(result.thought.preProbe.offTaskMinusOnTaskRtSd)}。</p>`
  ].join("");
}

function resultSummaryText(result) {
  const experiment = EXPERIMENTS[result.experimentId];
  const lines = [
    `实验: ${result.experimentTitle}`,
    `模式: ${result.runMode === "practice" ? "练习" : "正式"}`,
    `被试: ${result.participantId || "NA"}`,
    `组别: ${result.group || "NA"}`,
    `正确率: ${pct(result.overall.accuracy)}`,
    `中位RT: ${ms(result.overall.medianRt)}`,
    `遗漏率: ${pct(result.overall.omissionRate)}`,
    `Block RT斜率: ${signedMs(result.timeOnTask.blockRtSlope)}`
  ];

  if (experiment.family === "ax") {
    lines.push(`AY代价: ${signedMs(result.indices.ayCostRt)}`);
    lines.push(`BX代价: ${signedMs(result.indices.bxCostRt)}`);
    lines.push(`PBI-RT: ${decimals(result.indices.pbiRt)}`);
  } else {
    lines.push(`冲突RT代价: ${signedMs(result.indices.conflictCostRt)}`);
    lines.push(`长延迟代价: ${signedMs(result.indices.delayCostRt)}`);
    lines.push(`语义捕获率: ${pct(result.indices.semanticCaptureRate)}`);
    lines.push(`维持×冲突RT: ${signedMs(result.indices.maintenanceConflictRt)}`);
  }

  return lines.join("\n");
}

function downloadJson() {
  if (!state.result) return;
  const payload = {
    result: state.result,
    trials: state.trials
  };
  downloadBlob(JSON.stringify(payload, null, 2), "application/json", fileBaseName("json"));
}

function trialToCsvRow(trial) {
  return [
    trial.id,
    trial.experimentId,
    trial.runMode,
    trial.block,
    trial.blockTrial,
    trial.trialClass,
    trial.trialType || "",
    trial.delay,
    trial.delayMs,
    trial.conflict,
    trial.correct,
    trial.response || "",
    trial.responseSide || "",
    trial.rt ?? "",
    trial.isCorrect ? 1 : 0,
    trial.omission ? 1 : 0,
    trial.cueColorKey || "",
    trial.probeColorKey || "",
    trial.wordColorKey || "",
    trial.thoughtResponse?.value || ""
  ];
}

function downloadCsv() {
  if (!state.result) return;
  const header = [
    "id",
    "experiment",
    "run_mode",
    "block",
    "block_trial",
    "trial_class",
    "trial_type",
    "delay",
    "delay_ms",
    "conflict",
    "correct_response",
    "response",
    "response_side",
    "rt_ms",
    "is_correct",
    "omission",
    "cue_color",
    "probe_color",
    "word_meaning",
    "thought_probe"
  ];
  const csv = [header, ...state.trials.map(trialToCsvRow)]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
  downloadBlob(csv, "text/csv;charset=utf-8", fileBaseName("csv"));
}

function csvEscape(value) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function fileBaseName(ext) {
  const participant = state.result.participantId || "participant";
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  return `${participant}-${state.result.experimentId}-${state.result.runMode}-${date}.${ext}`;
}

function downloadBlob(content, type, filename) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function copySummary() {
  if (!state.result || !navigator.clipboard) return;
  await navigator.clipboard.writeText(resultSummaryText(state.result));
  $("copyButton").textContent = "已复制";
  setTimeout(() => {
    $("copyButton").textContent = "复制摘要";
  }, 1200);
}

export function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

if (hasDocument) {
  setupControls();
}
