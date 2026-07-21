VAR week = 1
VAR week1_clear = false
VAR hooks_collected = 0

// morgue_choice: 太平间遗物选择
// "wallet"    — 拿起父亲的钱包（含父照）
// "cargo_note" — 发现提货单编号（07、1、3）
// "stand"    — 什么都没拿，只是站着
VAR morgue_choice = ""

// trust_zhakai: 跨章信任值（累计制）
// 初始 0，每做一次增进信任的选择 +1
// 当前 ACT1-03-A（告知父亲之事）+1，ACT2-05-A（借 20 万）+1
// 值域: 0=低, 1=中, 2+=高
VAR trust_zhakai = 0

// told_about_father: 林深是否在警校夜谈中告知赵凯父亲死因
// true=告知（ACT1-03-A）, false=敷衍（ACT1-03-B）
// 密室中赵凯台词变化
VAR told_about_father = false

// liu_jianguo_choice: ACT2-01 通讯录发现刘建国名字后的处理
// "hand_over"     — 交给刘建国
// "keep_evidence" — 自己保留（携带证据+1）
// "show_zhaokai"  — 给赵凯看（疑心值+1）
VAR liu_jianguo_choice = ""

// loan_choice: ACT2-05 赵凯父亲患癌时的借款选择
// "200k"          — 借 20 万（高善意，密室专属台词）
// "50k"           — 借 5 万（中善意）
// "official_loan" — 帮找正规贷款（理性善意）
VAR loan_choice = ""

// dinner_choice: ACT3-02 最后的晚餐，离家前对苏晚的选择
// "default"     — 只说"出差"，骗了她
// "family"      — 带全家出去吃顿饭（苏晚短信变化）
// "wallet_ngp"  — 二周目：把父亲钱包放化妆台上（密室追忆）
VAR dinner_choice = ""

// ch02_wound: 第一关伤势，传入 CH-03
// "none"   — 无伤
// "light"  — 轻伤（肋软骨骨裂）
// "heavy"  — 重伤（胸骨裂）
VAR ch02_wound = ""

// injury_level: 第三关前综合伤势，CH-03 成功时设定供 CH-04 读取
// "blunt"        — 无伤+正面迎弹→钝伤
// "aggravated"   — 轻伤+正面迎弹→重伤叠加
// "near_death"   — 重伤+正面迎弹→濒死
VAR injury_level = ""

// ch04_choice: 转折点选择，传入 CH-05
// "accept"  — 接受挑战（狙击轮）
// "refuse"  — 拒绝离开（倒在黎明门前）
VAR ch04_choice = ""

// ===== 背叛线状态（多维度，非单一布尔） =====

// betrayal_a01_choice: CH-A01 入门考验选择
// "A"  — 按陈爷吩咐做，快速获信任
// "B"  — 私下警告目标离开
// "C"  — 去港口旧调度室找父亲铁盒
VAR betrayal_a01_choice = ""

// betrayal_has_ironbox: 是否获得父亲铁盒（日记存放容器 / 关键道具）
VAR betrayal_has_ironbox = false

// betrayal_diary_progress: 日记记录进度（0~20，20 触发 CH-A03）
VAR betrayal_diary_progress = 0

// betrayal_zhakai_state: 赵凯关系状态（多值）
// "neutral"     — 初始 / 放弃路线
// "hostile"     — 暴力反制路线
// "protective"  — 信任限期路线，暗中掩护
// "ally"        — 联合路线
VAR betrayal_zhakai_state = "neutral"

// betrayal_a03_choice: CH-A03 日记危机选择
// "1"  — 先下手为强（暴力）
// "2"  — 信任限期离开
// "3"  — 联手揭发
// "4"  — 放弃销毁
VAR betrayal_a03_choice = ""

// ch01_chose_d: 二周目序章是否选了选项D（"陈爷——你认识我爸吗？"）
// true之后解锁 CH-06 选项E
VAR ch01_chose_d = false

// betrayal_evidence_level: 证据完整度
// "none"      — 放弃路线，无证据
// "partial"   — 部分证据（非联合/信任完成路线）
// "complete"  — 完整证据链（联合路线或信任完成路线）
VAR betrayal_evidence_level = "none"
