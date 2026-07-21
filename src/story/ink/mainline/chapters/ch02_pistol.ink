=== ch02_pistol ===
# scene:ch02-pistol
# route-node:ch02-pistol
# title:第一关：手枪轮
# marker:MAINLINE / CH-02

{
    - loan_choice == "200k":
    赵凯退后5米，举起了那把格洛克19。在他抬起枪口的那个瞬间——他的嘴唇动了一下。不是说话。是口型。他重复了两遍——「那二十万我记一辈子。但我没得选。」
    - else:
    赵凯退后5米，举起了那把格洛克19。在他抬起枪口的那个瞬间——他的手抖了一下。然后举起了枪。
}

陈爷用杯盖指了指那把格洛克：「格洛克19。全世界警察用得最多的手枪。也是全世界街头帮派用得最多的手枪。你知道为什么吗？因为便宜、好修、零件到处都能买到。好人用它保护自己，坏人用它杀好人——同一把枪，看握在谁手里。」

「就像这座城市——同一套规则，看你是谁。」

# checkpoint:cp-ch02-pistol
+ [第一件：凯夫拉软质便衣甲 (II级)  # choice-id:armor-1]
    -> ch02_armor_1
+ [第二件：BulletSafe VP3 全包裹软甲 (IIIA)  # choice-id:armor-2]
    { trust_zhakai >= 2: # command:zhaokai-tremor }
    -> ch02_armor_2
+ [第三件：RMA 1092 聚乙烯硬板 (III+)  # choice-id:armor-3]
    { trust_zhakai >= 2: # command:zhaokai-tremor }
    -> ch02_armor_3

=== ch02_armor_1 ===
你选了最轻便的那件凯夫拉软质便衣甲。NIJ Level II。极轻、极薄。穿在身上几乎没有重量。但这件甲连普通手枪弹都挡得勉强——更别说赵凯手里那支格洛克了。

现在选子弹。

+ [A: 9mm FMJ 全金属被甲弹  # choice-id:ammo-1a]
    -> end_bad01_useless
+ [B: 9mm G2 Research R.I.P 扩张弹  # choice-id:ammo-1b]
    -> end_bad01_useless
+ [C: 9mm +P+ 强装药高压穿甲弹  # choice-id:ammo-1c]
    -> end_bad01_useless

=== ch02_armor_2 ===
你拿起了那件 BulletSafe VP3 全包裹软甲。NIJ IIIA。比轻甲厚得多，但胜在全包裹——躯干正面、背面、侧面都被芳纶纤维覆盖。能挡住几乎所有手枪弹。

现在选子弹。

+ [A: 9mm FMJ 全金属被甲弹  # choice-id:ammo-2a]
    ~ ch02_wound = "light"
    -> ch02_result_2a
+ [B: 9mm G2 Research R.I.P 扩张弹  # choice-id:ammo-2b]
    ~ ch02_wound = "none"
    -> ch02_result_2b
+ [C: 9mm +P+ 强装药高压穿甲弹  # choice-id:ammo-2c]
    -> end_bad02_blunt

=== ch02_armor_3 ===
你拿起了那块 RMA 1092 聚乙烯硬板。NIJ III+。单块4.5磅，硬质插板。手枪弹打上去连凹痕都不会有。但重——你把它塞进胸前的插板袋时，整件防具的重量往下沉了一截。

现在选子弹。

+ [A: 9mm FMJ 全金属被甲弹  # choice-id:ammo-3a]
    ~ ch02_wound = "none"
    -> ch02_result_3a
+ [B: 9mm G2 Research R.I.P 扩张弹  # choice-id:ammo-3b]
    ~ ch02_wound = "none"
    -> ch02_result_3b
+ [C: 9mm +P+ 强装药高压穿甲弹  # choice-id:ammo-3c]
    ~ ch02_wound = "heavy"
    -> ch02_result_3c

=== ch02_result_2a ===
枪声响起。胸口传来一阵火辣辣的闷痛。子弹被芳纶纤维兜住了，但那股力道还是结结实实地传递到了你的胸口——像被人狠狠打了一拳。你闷哼一声，嘴角渗出一丝血迹。有骨裂，但没穿透。你还活着。

-> ch02_general_success

=== ch02_result_2b ===
枪响了。R.I.P弹的铜齿在撞上芳纶纤维的瞬间被反向扭转——扩张弹头被软甲的编织结构生生嚼碎。你胸口像被锤子砸了一下，但防弹衣结结实实地兜住了所有碎片。

-> ch02_general_success

=== ch02_result_3a ===
枪响了。FMJ圆头弹撞上硬板——发出清脆的"当"一声。弹头被压扁在板面上，像一颗被锤子砸过的黄豆。你的胸口被惯性推了一下，仅此而已。

-> ch02_general_success

=== ch02_result_3b ===
"当！！"一声金属撞击的脆响。那颗长满铜齿的R.I.P弹撞上硬板的瞬间，锋利的尖刺全部折断，散落一地铜渣。硬质板完全没向内弯曲。你甚至没感觉到疼——只是胸口被惯性推得晃了一下。

赵凯的脸变了。

陈爷挑了挑眉：「有点意思。看来你不是只会写罚单的条子。」

-> ch02_general_success

=== ch02_result_3c ===
高压弹头狠狠砸在硬板上。硬板没碎。但那力道——像一柄铁锤被人抡圆了砸在胸口。你听到了自己体内传来"咔嚓"一声。胸骨裂了。你大口喘气，每一次呼吸都像在吞碎玻璃。

-> ch02_general_success

=== ch02_general_success ===
陈爷把茶杯放下。杯底在铁桌上磕出一声轻响。

「好。你比你爸聪明——知道穿硬板。但你爸如果穿了硬板也没用。你爸不是死在枪口下——是死在签字的人手里。」

-> ch03_shotgun
