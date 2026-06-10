const SEMANTIC_STIMULI = [
  {
    scenario: "自入学以来，恒旭觉得自己的朋友太少了，想结交更多朋友。他/她应该怎么办？",
    aCue: "结交朋友",
    bCues: ["保障治安", "维护权益", "改善风气", "美化环境", "设立机构", "完善设施", "制定法律", "落实教育", "优化系统", "出台措施"],
    Novel: {
      xProbe: "参加辩论",
      yProbes: ["帮人拍照", "参加实习", "参加实验", "做自媒体", "帮人代课", "从事微商", "参加讲座", "逛音乐节", "去夏令营", "出去支教", "请客吃饭", "报课外班", "请人帮忙", "去读书会", "学习吉它", "成为会长", "打扫垃圾", "互赠礼物", "忽悠别人", "储备话题"]
    },
    Common: {
      xProbe: "约打游戏",
      yProbes: ["参加社团", "提高成绩", "参加活动", "分享自己", "认识同学", "帮助他人", "提高能力", "培养爱好", "参加比赛", "提升信心", "主动交流", "约上自习", "发朋友圈", "提升素质", "改变性格", "展示才能", "聊电视剧", "学会倾听", "提高情商", "提升衣品"]
    }
  },
  {
    scenario: "最近，西哲难以控制自己的情绪，常常感到不开心，并被难以言说的失控感困扰。他/她应该怎么办？",
    aCue: "控制情绪",
    bCues: ["保障治安", "维护权益", "改善风气", "美化环境", "设立机构", "完善设施", "制定法律", "落实教育", "优化系统", "出台措施"],
    Novel: {
      xProbe: "捏方便面",
      yProbes: ["听演唱会", "上网直播", "求助宗教", "学习榜样", "去拳击馆", "捏泡沫纸", "学习正念", "去屠宰场", "亲近自然", "洗冷水澡", "去菜市场", "回忆童年", "学习党章", "坐公交车", "学心理学", "整理房间", "看纪录片", "暗示自我", "做志愿者", "骑自行车"]
    },
    Common: {
      xProbe: "找人倾诉",
      yProbes: ["享受美食", "转移注意", "出去走走", "找压力源", "想开心事", "找到原因", "着手解决", "学会接受", "请求外援", "放空自己", "做出改变", "接纳不足", "放松心情", "去健身房", "出去旅游", "忙碌起来", "充实自我", "调整看法", "建立目标", "大哭一场"]
    }
  }
];

const LENGTHS = {
  short: { label: "手机短测", blockTrials: 20, classicTrials: 80, counts: { AX: 14, AY: 2, BX: 2, BY: 2 } },
  standard: { label: "标准", blockTrials: 40, classicTrials: 160, counts: { AX: 28, AY: 4, BX: 4, BY: 4 } },
  full: { label: "完整", blockTrials: 100, classicTrials: 400, counts: { AX: 70, AY: 10, BX: 10, BY: 10 } }
};

const TIMING = {
  cue: 500,
  cueProbeMin: 800,
  cueProbeMax: 1200,
  probe: 500,
  responseWindow: 1000,
  itiMin: 700,
  itiMax: 1200
};

const state = {
  mode: "semantic",
  length: "short",
  trials: [],
  current: -1,
  accepting: false,
  probeStart: 0,
  timers: [],
  result: null
};

const $ = (id) => document.getElementById(id);

const screens = typeof document === "undefined" ? {} : {
  setup: $("setupScreen"),
  block: $("blockScreen"),
  trial: $("trialScreen"),
  results: $("resultsScreen")
};

function shuffle(array, rng = Math.random) {
  const out = array.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function makeTypes(counts) {
  return Object.entries(counts).flatMap(([type, count]) => Array.from({ length: count }, () => type));
}

function distributeAx(nonAxTypes, axCount, rng = Math.random) {
  const gaps = Array.from({ length: nonAxTypes.length + 1 }, () => 0);
  let remaining = axCount;
  while (remaining > 0) {
    const available = gaps.map((count, index) => ({ count, index })).filter((item) => item.count < 4);
    const pick = available[Math.floor(rng() * available.length)].index;
    gaps[pick] += 1;
    remaining -= 1;
  }

  const types = [];
  gaps.forEach((count, index) => {
    for (let i = 0; i < count; i += 1) types.push("AX");
    if (index < nonAxTypes.length) types.push(nonAxTypes[index]);
  });
  return types;
}

function buildBlockTypes(counts, rng = Math.random) {
  const nonAx = shuffle(makeTypes({ AY: counts.AY, BX: counts.BX, BY: counts.BY }), rng);
  return distributeAx(nonAx, counts.AX, rng);
}

export function buildSemanticTrials(lengthKey = "short", rng = Math.random) {
  const length = LENGTHS[lengthKey];
  const conditions = rng() > 0.5 ? ["Novel", "Common", "Novel", "Common"] : ["Common", "Novel", "Common", "Novel"];
  const contexts = [SEMANTIC_STIMULI[0], SEMANTIC_STIMULI[0], SEMANTIC_STIMULI[1], SEMANTIC_STIMULI[1]];
  const trials = [];

  conditions.forEach((condition, blockIndex) => {
    const context = contexts[blockIndex];
    const material = context[condition];
    const types = buildBlockTypes(length.counts, rng);
    const yPool = shuffle(material.yProbes, rng);
    const bPool = shuffle(context.bCues, rng);
    let yCursor = 0;
    let bCursor = 0;

    types.forEach((trialType, trialIndex) => {
      const cueType = trialType[0];
      const probeType = trialType[1];
      const cue = cueType === "A" ? context.aCue : bPool[bCursor++ % bPool.length];
      const probe = probeType === "X" ? material.xProbe : yPool[yCursor++ % yPool.length];
      trials.push({
        mode: "semantic",
        block: blockIndex + 1,
        blockTrial: trialIndex + 1,
        condition,
        scenario: context.scenario,
        targetCue: context.aCue,
        targetProbe: material.xProbe,
        trialType,
        cueType,
        probeType,
        cue,
        probe,
        correct: trialType === "AX" ? "yes" : "no",
        response: null,
        rt: null,
        isCorrect: false
      });
    });
  });

  return trials;
}

export function buildClassicTrials(lengthKey = "short", rng = Math.random) {
  const length = LENGTHS[lengthKey];
  const multiplier = length.classicTrials / 100;
  const counts = {
    AX: Math.round(70 * multiplier),
    AY: Math.round(10 * multiplier),
    BX: Math.round(10 * multiplier),
    BY: Math.round(10 * multiplier)
  };
  const types = buildBlockTypes(counts, rng);

  return types.map((trialType, index) => {
    const cueType = trialType[0];
    const probeType = trialType[1];
    return {
      mode: "classic",
      block: 1,
      blockTrial: index + 1,
      condition: "Letters",
      scenario: "",
      targetCue: "A",
      targetProbe: "X",
      trialType,
      cueType,
      probeType,
      cue: cueType,
      probe: probeType,
      correct: trialType === "AX" ? "yes" : "no",
      response: null,
      rt: null,
      isCorrect: false
    };
  });
}

export function buildTrials(mode, lengthKey, rng = Math.random) {
  return mode === "classic" ? buildClassicTrials(lengthKey, rng) : buildSemanticTrials(lengthKey, rng);
}

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("screen-active"));
  screens[name].classList.add("screen-active");
}

function setSetupPreview() {
  const isClassic = state.mode === "classic";
  $("modeTitle").textContent = isClassic ? "传统字母 AX-CPT" : "语义新颖 AX-CPT";
  $("modeCopy").textContent = isClassic
    ? "只使用 A、B、X、Y 四个字母。A 后接 X 按“是”，其他组合按“否”。"
    : "记住每个 block 的固定 AX 配对。配对完全一致按“是”，其他组合按“否”。";
  $("previewCue").textContent = isClassic ? "A" : "结交朋友";
  $("previewProbe").textContent = isClassic ? "X" : "参加辩论";
  $("setupTarget").textContent = isClassic ? "A-X" : "语义 AX";
  $("runMeta").textContent = LENGTHS[state.length].label;

  const trialCount = state.mode === "classic"
    ? LENGTHS[state.length].classicTrials
    : LENGTHS[state.length].blockTrials * 4;
  $("setupTrials").textContent = String(trialCount);
}

function setupControls() {
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      document.querySelectorAll(".mode-button").forEach((item) => {
        item.classList.toggle("active", item === button);
        item.setAttribute("aria-selected", item === button ? "true" : "false");
      });
      setSetupPreview();
    });
  });

  document.querySelectorAll(".length-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.length = button.dataset.length;
      document.querySelectorAll(".length-button").forEach((item) => item.classList.toggle("active", item === button));
      setSetupPreview();
    });
  });

  $("startButton").addEventListener("click", startRun);
  $("continueButton").addEventListener("click", startNextTrial);
  $("yesButton").addEventListener("click", () => recordResponse("yes"));
  $("noButton").addEventListener("click", () => recordResponse("no"));
  $("restartButton").addEventListener("click", () => {
    clearTimers();
    showScreen("setup");
  });
  $("downloadButton").addEventListener("click", downloadResults);
  $("copyButton").addEventListener("click", copySummary);

  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "k" || event.key === "ArrowLeft") recordResponse("yes");
    if (event.key.toLowerCase() === "l" || event.key === "ArrowRight") recordResponse("no");
  });
}

function startRun() {
  clearTimers();
  state.trials = buildTrials(state.mode, state.length);
  state.current = -1;
  state.result = null;
  prepareBlock(0);
}

function prepareBlock(trialIndex) {
  const trial = state.trials[trialIndex];
  $("blockKicker").textContent = state.mode === "classic" ? "传统字母" : `Block ${trial.block} · ${trial.condition}`;
  $("blockCue").textContent = trial.targetCue;
  $("blockProbe").textContent = trial.targetProbe;
  $("blockScenario").textContent = trial.scenario || "A-X 为目标配对。";
  showScreen("block");
}

function startNextTrial() {
  state.current += 1;
  if (state.current >= state.trials.length) {
    finishRun();
    return;
  }

  const trial = state.trials[state.current];
  const prev = state.trials[state.current - 1];
  if (prev && trial.block !== prev.block) {
    prepareBlock(state.current);
    state.current -= 1;
    return;
  }

  showScreen("trial");
  renderProgress();
  disableResponses(true);
  runTrial(trial);
}

function renderProgress() {
  const done = Math.max(0, state.current);
  const total = state.trials.length;
  $("trialModeLabel").textContent = state.mode === "classic" ? "传统字母" : "语义新颖";
  $("trialConditionLabel").textContent = state.trials[state.current]?.condition || "";
  $("trialCounter").textContent = `${Math.min(done + 1, total)} / ${total}`;
  $("progressBar").style.width = `${(done / total) * 100}%`;
}

function runTrial(trial) {
  setStimulus("+", "准备", false);
  queue(() => {
    setStimulus(trial.cue, "Cue", state.mode === "semantic");
  }, 240);
  queue(() => {
    setStimulus("+", "间隔", false);
  }, 240 + TIMING.cue);
  const probeDelay = 240 + TIMING.cue + randomBetween(TIMING.cueProbeMin, TIMING.cueProbeMax);
  queue(() => {
    state.accepting = true;
    state.probeStart = performance.now();
    disableResponses(false);
    setStimulus(trial.probe, "Probe", state.mode === "semantic");
  }, probeDelay);
  queue(() => {
    setStimulus("", "反应", false);
  }, probeDelay + TIMING.probe);
  queue(() => {
    state.accepting = false;
    disableResponses(true);
    setStimulus("+", "准备", false);
    queue(startNextTrial, randomBetween(TIMING.itiMin, TIMING.itiMax));
  }, probeDelay + TIMING.responseWindow);
}

function setStimulus(text, phase, semantic) {
  $("phaseLabel").textContent = phase;
  const target = $("stimulusText");
  target.textContent = text;
  target.classList.toggle("semantic", Boolean(semantic));
}

function disableResponses(disabled) {
  $("yesButton").disabled = disabled;
  $("noButton").disabled = disabled;
}

function recordResponse(response) {
  if (!state.accepting || state.current < 0) return;
  const trial = state.trials[state.current];
  if (trial.response) return;
  trial.response = response;
  trial.rt = Math.round(performance.now() - state.probeStart);
  trial.isCorrect = response === trial.correct;
  state.accepting = false;
  disableResponses(true);
}

function clearTimers() {
  state.timers.forEach((id) => clearTimeout(id));
  state.timers = [];
  state.accepting = false;
}

function queue(callback, delay) {
  const id = setTimeout(() => {
    state.timers = state.timers.filter((timerId) => timerId !== id);
    callback();
  }, delay);
  state.timers.push(id);
}

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function finishRun() {
  clearTimers();
  $("progressBar").style.width = "100%";
  state.result = computeResults(state.trials, state.mode);
  renderResults(state.result);
  showScreen("results");
}

function median(values) {
  const clean = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!clean.length) return null;
  const mid = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
}

function mean(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : null;
}

function sd(values) {
  const m = mean(values);
  if (m === null) return null;
  const clean = values.filter((value) => Number.isFinite(value));
  if (clean.length < 2) return null;
  const variance = clean.reduce((sum, value) => sum + (value - m) ** 2, 0) / (clean.length - 1);
  return Math.sqrt(variance);
}

function groupKey(trial, mode) {
  return mode === "semantic" ? `${trial.condition}:${trial.trialType}` : trial.trialType;
}

export function computeResults(trials, mode = "semantic") {
  const correctTrials = trials.filter((trial) => trial.isCorrect && Number.isFinite(trial.rt));
  const allCorrectRts = correctTrials.map((trial) => trial.rt);
  const rtMean = mean(allCorrectRts);
  const rtSd = sd(allCorrectRts);
  const groups = new Map();

  trials.forEach((trial) => {
    const key = groupKey(trial, mode);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(trial);
  });

  const rows = Array.from(groups.entries()).map(([key, group]) => {
    const correct = group.filter((trial) => trial.isCorrect);
    const correctRts = group.filter((trial) => trial.isCorrect && Number.isFinite(trial.rt)).map((trial) => trial.rt);
    const zValues = rtMean !== null && rtSd ? correctRts.map((rt) => (rt - rtMean) / rtSd) : [];
    const [condition, trialType] = mode === "semantic" ? key.split(":") : ["Letters", key];
    return {
      condition,
      trialType,
      n: group.length,
      accuracy: correct.length / group.length,
      errorRate: 1 - correct.length / group.length,
      medianRt: median(correctRts),
      medianZrt: median(zValues)
    };
  }).sort((a, b) => `${a.condition}${a.trialType}`.localeCompare(`${b.condition}${b.trialType}`));

  const by = (condition, trialType) => rows.find((row) => row.condition === condition && row.trialType === trialType);
  const base = {
    mode,
    totalTrials: trials.length,
    validResponses: trials.filter((trial) => trial.response).length,
    accuracy: trials.filter((trial) => trial.isCorrect).length / trials.length,
    medianRt: median(allCorrectRts),
    rows
  };

  if (mode === "semantic") {
    const novelBX = by("Novel", "BX");
    const commonBX = by("Common", "BX");
    const novelAY = by("Novel", "AY");
    const commonAY = by("Common", "AY");
    const novelAll = rows.filter((row) => row.condition === "Novel");
    const commonAll = rows.filter((row) => row.condition === "Common");
    base.indices = {
      bxNovelSlowing: delta(novelBX?.medianRt, commonBX?.medianRt),
      ayNovelSlowing: delta(novelAY?.medianRt, commonAY?.medianRt),
      noveltyAccuracyGain: mean(novelAll.map((row) => row.accuracy)) - mean(commonAll.map((row) => row.accuracy))
    };
  } else {
    const ay = by("Letters", "AY");
    const bx = by("Letters", "BX");
    const byRow = by("Letters", "BY");
    base.indices = {
      ayCost: delta(ay?.medianRt, byRow?.medianRt),
      bxCost: delta(bx?.medianRt, byRow?.medianRt),
      proactiveScore: delta(delta(ay?.medianRt, byRow?.medianRt), delta(bx?.medianRt, byRow?.medianRt))
    };
  }

  return base;
}

function delta(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) ? a - b : null;
}

function pct(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : "NA";
}

function ms(value) {
  return Number.isFinite(value) ? `${Math.round(value)} ms` : "NA";
}

function signedMs(value) {
  if (!Number.isFinite(value)) return "NA";
  return `${value > 0 ? "+" : ""}${Math.round(value)} ms`;
}

function renderResults(result) {
  $("resultCards").innerHTML = [
    card("正确率", pct(result.accuracy)),
    card("中位 RT", ms(result.medianRt)),
    card("有效反应", `${result.validResponses} / ${result.totalTrials}`)
  ].join("");

  renderTable(result);
  renderInterpretation(result);
}

function card(label, value) {
  return `<div class="result-card"><span>${label}</span><strong>${value}</strong></div>`;
}

function renderTable(result) {
  const conditionHead = result.mode === "semantic" ? "<th>条件</th>" : "";
  const rows = result.rows.map((row) => `
    <tr>
      ${result.mode === "semantic" ? `<td>${row.condition}</td>` : ""}
      <td>${row.trialType}</td>
      <td>${row.n}</td>
      <td>${pct(row.accuracy)}</td>
      <td>${pct(row.errorRate)}</td>
      <td>${ms(row.medianRt)}</td>
      <td>${Number.isFinite(row.medianZrt) ? row.medianZrt.toFixed(2) : "NA"}</td>
    </tr>
  `).join("");

  $("resultTable").innerHTML = `
    <thead>
      <tr>${conditionHead}<th>试次</th><th>n</th><th>正确率</th><th>错误率</th><th>中位 RT</th><th>zRT</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  `;
}

function renderInterpretation(result) {
  if (result.mode === "semantic") {
    const bx = result.indices.bxNovelSlowing;
    const ay = result.indices.ayNovelSlowing;
    const acc = result.indices.noveltyAccuracyGain;
    $("interpretation").innerHTML = [
      `<p><strong>BX 新颖效应：</strong>${signedMs(bx)}。正值表示新颖 probe 下 BX 反应更慢，常见解释是更依赖反应性控制或更少依赖主动控制。</p>`,
      `<p><strong>AY 新颖效应：</strong>${signedMs(ay)}。论文中 AY 差异通常弱于 BX，可与 BX 指标一起看控制模式转换。</p>`,
      `<p><strong>新颖条件正确率：</strong>${Number.isFinite(acc) ? `${acc >= 0 ? "+" : ""}${Math.round(acc * 100)} 个百分点` : "NA"}。</p>`
    ].join("");
  } else {
    const ayCost = result.indices.ayCost;
    const bxCost = result.indices.bxCost;
    const score = result.indices.proactiveScore;
    $("interpretation").innerHTML = [
      `<p><strong>AY 代价：</strong>${signedMs(ayCost)}。A cue 诱发“是”的预期，Y probe 需要抑制该预期。</p>`,
      `<p><strong>BX 代价：</strong>${signedMs(bxCost)}。X probe 诱发“是”的反应倾向，B cue 信息可帮助避免错误。</p>`,
      `<p><strong>主动控制倾向：</strong>${signedMs(score)}。正值通常表示 AY 代价高于 BX 代价，更偏主动控制；负值则更偏反应性控制。</p>`
    ].join("");
  }
}

function resultSummaryText(result) {
  const lines = [
    `模式: ${result.mode === "classic" ? "传统字母 AX-CPT" : "语义新颖 AX-CPT"}`,
    `正确率: ${pct(result.accuracy)}`,
    `中位 RT: ${ms(result.medianRt)}`,
    `有效反应: ${result.validResponses}/${result.totalTrials}`
  ];
  if (result.mode === "semantic") {
    lines.push(`BX 新颖效应: ${signedMs(result.indices.bxNovelSlowing)}`);
    lines.push(`AY 新颖效应: ${signedMs(result.indices.ayNovelSlowing)}`);
  } else {
    lines.push(`AY 代价: ${signedMs(result.indices.ayCost)}`);
    lines.push(`BX 代价: ${signedMs(result.indices.bxCost)}`);
    lines.push(`主动控制倾向: ${signedMs(result.indices.proactiveScore)}`);
  }
  return lines.join("\n");
}

function downloadResults() {
  if (!state.result) return;
  const blob = new Blob([JSON.stringify({ result: state.result, trials: state.trials }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ax-cpt-${state.mode}-${new Date().toISOString().slice(0, 10)}.json`;
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

if (typeof document !== "undefined") {
  setupControls();
  setSetupPreview();
}
