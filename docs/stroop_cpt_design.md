# Stroop-CPT 与颜色 AX-CPT 实验设计备忘

更新时间：2026-06-11

## 研究目的

本电池用于比较 CDS、ADHD、CDS+ADHD 与正常对照在三类加工中的差异：

1. 持续维持外部任务目标。
2. Stroop 冲突下的选择性注意与语义捕获。
3. 时间推进造成的认知脱离、反应变异和遗漏增加。

理论定位建议写成：CDS 的核心异常不一定是单纯抑制失败，而可能是外部任务目标维持不足、低唤醒、处理速度慢和认知脱离。Stroop-CPT 的价值在于把冲突放在不同阶段，从而区分编码阶段冲突、延迟维持困难和 probe 阶段反应性冲突。

## 三个实验

### 1. Late Stroop-CPT：Stroop 在后

流程：彩色图案 cue -> delay -> 带颜色的颜色词 probe。

规则：记住 cue 图案颜色。probe 出现后，只判断 probe 的字体颜色是否与 cue 图案颜色一致，忽略文字含义。

冲突阶段：probe/反应决策阶段。

关键解释：如果 CDS 在长 delay 后遇到 Stroop probe 才明显变差，支持“维持不足导致反应阶段补救失败”。如果 ADHD 在短/长 delay 下均有较强语义诱饵错误，更支持冲突抑制或冲动性反应问题。

### 2. Early Stroop-CPT：Stroop 在前

流程：带颜色的颜色词 cue -> delay -> 彩色图案 probe。

规则：记住 cue 的字体颜色，忽略 cue 的文字含义。probe 出现后判断图案颜色是否与刚才字体颜色一致。

冲突阶段：cue 编码阶段，随后要求维持被正确编码的颜色。

关键解释：`Cue conflict x Delay` 对 CDS 很有价值。如果 cue 冲突在短 delay 中影响较小，但长 delay 下明显放大，说明无关语义可能污染或削弱了后续维持表征。

### 3. Color AX-CPT：无 Stroop 材料验证

流程：颜色色块 cue -> delay -> 中性颜色词 probe。

规则：每个 block 指定一个目标颜色。只有目标颜色色块后接同名颜色词时按“是”，其他组合都按“否”。

目的：验证颜色色块和颜色词材料能产生 AX-CPT 式上下文效应，同时不加入 Stroop 冲突。

注意：该实验保留 AX-heavy 结构，但不应把它作为纯粹抑制测量。它更适合作为颜色材料和上下文目标维持的对照。

## 条件结构

### Stroop-CPT 条件

每个 Stroop 实验正式模式为 4 个 block，每 block 24 题：

| 条件 | 正确反应 | 冲突水平 | 说明 |
|---|---:|---:|---|
| 匹配/一致 | 是 | 低 | 相关颜色匹配，文字含义也一致 |
| 匹配/冲突 | 是 | 高 | 相关颜色匹配，但文字含义冲突 |
| 不匹配/一致 | 否 | 低 | 相关颜色不匹配，文字含义与自身颜色一致 |
| 不匹配/语义诱饵 | 否 | 高 | 无关文字含义指向“是”，关键 false-alarm 条件 |

每个 block 内：4 类条件 x 2 种 delay x 3 次 = 24 题。四种颜色在每个 block 中作为待维持颜色各出现 6 次。

### Color AX-CPT 条件

正式模式为 4 个 block，每 block 32 题：

| 条件 | 每 block 数量 | 正确反应 |
|---|---:|---:|
| AX | 20 | 是 |
| AY | 4 | 否 |
| BX | 4 | 否 |
| BY | 4 | 否 |

每个 trial type 内短/长 delay 对半。每个 block 的目标颜色轮换，使四种颜色都作为目标色出现。

## 时序

默认网页行为版时序：

| 阶段 | 时间 |
|---|---:|
| fixation | 250 ms |
| cue | 450 ms |
| short delay | 900 ms |
| long delay | 2600 ms |
| probe response window | 1200 ms |
| response 后过渡 | 120 ms |
| ITI | 350-650 ms |

设计理由：网页与手机端需要控制总时长。若转为 EEG 正式采集，可考虑把 long delay 延长到 3500-4500 ms，并相应减少试次数或拆成两个 session。

## 练习模式

练习模式与正式模式使用同样规则和刺激流程，但试次数较少：

| 实验 | 练习试次 |
|---|---:|
| Late Stroop-CPT | 8 |
| Early Stroop-CPT | 8 |
| Color AX-CPT | 16 |

练习中也包含 1 个 thought probe，让被试熟悉自评问题。

## Thought Probe

正式模式每个 block 1 次 thought probe，三个实验总计 12 次左右。

问题：刚才这几题，你的注意主要在哪里？

选项：

- 专注任务
- 任务相关
- 走神
- 发空
- 困倦

分析逻辑：把每次 thought probe 前 5 题作为 pre-probe window。如果被试报告走神、发空或困倦，则标记为 off-task window。关键指标是 off-task window 相比 on-task window 的 RT、RT SD、正确率和遗漏率差异。

## 主要行为指标

### Stroop-CPT

- 冲突 RT 代价：高冲突条件 RT - 低冲突条件 RT。
- 长延迟代价：长 delay RT - 短 delay RT。
- 语义诱饵 RT 代价：语义诱饵条件 RT - 不匹配/一致条件 RT。
- 语义捕获率：语义诱饵条件中误按“是”的比例。
- 维持 x 冲突 RT：`(long high - long low) - (short high - short low)`。
- Block RT 斜率：最后一个 block 的中位 RT - 第一个 block 的中位 RT。
- Block 遗漏率斜率：最后一个 block 遗漏率 - 第一个 block 遗漏率。

### Color AX-CPT

- AY 代价：AY RT - BY RT。
- BX 代价：BX RT - BY RT。
- PBI-RT：`(AY cost - BX cost) / (AY cost + BX cost)`。
- 长延迟代价：长 delay RT - 短 delay RT。
- Block RT/遗漏率/RT SD 斜率。

## CDS 与 ADHD 的预期差异

### 更支持 CDS 的模式

- 总体更慢，但准确率未必明显下降。
- 长 delay 下表现恶化，尤其在 Stroop 冲突或语义诱饵条件中。
- Block 越靠后，RT、RT SD、遗漏率越高。
- thought probe 报告走神、发空或困倦前，RT SD 增大或 CNV/准备性指标下降。

### 更支持 ADHD 的模式

- 短 delay 中也有较强 Stroop 冲突效应。
- commission/false alarm 增多，尤其语义诱饵中误按“是”。
- 冲突条件下快速错误更明显。
- Early 与 Late Stroop 均表现出冲突抑制困难，而不一定呈现明显 delay 放大。

### CDS + ADHD

可能同时出现语义诱饵 false alarm 增多和长 delay/time-on-task 恶化。建议单独建模，而不是简单剔除共病个体。

## 建议统计模型

试次水平 mixed model 优先于先求均值后 ANOVA：

- RT：只纳入正确反应，可用 log RT 或 ex-Gaussian/tau 补充。
- 错误/遗漏：logistic mixed model。
- 固定效应：Group 或连续 CDS score、ADHD-IN score、Delay、Conflict、Stage、Block 或 TrialNumber。
- 关键交互：`CDS x Delay x Conflict`、`CDS x Block x Conflict`、`ADHD x Conflict`。
- 协变量：年龄、性别、睡眠、焦虑/抑郁、药物状态、ADHD-IN 或 CDS 互控。

## 数据导出

网页导出 JSON 和 CSV。CSV 每行一个 trial，包含：

- experiment, run_mode, block, block_trial
- trial_class, trial_type
- delay, delay_ms, conflict
- correct_response, response, response_side, rt_ms
- is_correct, omission
- cue_color, probe_color, word_meaning
- thought_probe

## 参考文献

- Becker, S. P., et al. (2023). Report of a Work Group on Sluggish Cognitive Tempo: Key research directions and a consensus change in terminology to Cognitive Disengagement Syndrome.
- Braver, T. S. (2012). The variable nature of cognitive control: A dual mechanisms framework.
- Bugg, J. M., Jacoby, L. L., & Toth, J. P. (2008). Multiple levels of control in the Stroop task.
- Gonthier, C., Braver, T. S., & Bugg, J. M. (2016). Dissociating proactive and reactive control in the AX-CPT.
- Stroop, J. R. (1935). Studies of interference in serial verbal reactions.
- Tamm, L., et al. (2024). Neurocognition in children with Cognitive Disengagement Syndrome: Accurate but slow.
- Wiggs, K. K., et al. (2024). Cognitive disengagement syndrome and probe-caught mind-wandering.
