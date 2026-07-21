=== act2_01_first_case ===
# scene:act2-01-first-case
# route-node:act2-01-first-case
# title:入职·第一案
# marker:PROLOGUE / ACT 2

（入职第3个月。南城区一栋待拆迁的筒子楼。走廊里的声控灯坏了——只有最远那头还有一盏忽明忽暗的日光灯，照得地上的水渍像一块一块碎掉的镜子。）

线人说401藏了冰毒原料。林深带队破门——屋里没人，炉子上还烧着半锅不知道什么味道的化学液体。桌上摊着实验器皿，碎掉的烧杯，一本摊开的通讯录。通讯录翻开的那一页上——夹在十几个不认识的名字之间——有一个他认识的名字。刘建国。旁边潦草地写着"3号码头——放行。"

他把那一页撕下来，折了两折。赵凯在门外——"老沈，找着没——"

"没有。"他把纸折好，放进了警服外套的内兜——贴着胸口。他爸的钱包也放在那个位置。

+ [把通讯录交给刘建国。 # choice-id:hand-to-liu]
    ~ liu_jianguo_choice = "hand_over"
    -> act2_01_hand_over
+ [自己保留。 # choice-id:keep-evidence]
    ~ liu_jianguo_choice = "keep_evidence"
    -> act2_01_keep_evidence
+ [给赵凯看。 # choice-id:show-zhaokai]
    ~ liu_jianguo_choice = "show_zhaokai"
    -> act2_01_show_zhaokai

=== act2_01_hand_over ===
"刘叔——这是我在案发现场找到的。您看要不要追？"

刘建国笑了笑，说"我会处理"。那一页再也没有出现过。
-> act2_02_wedding

=== act2_01_keep_evidence ===
他把纸折好，放进钱包的夹层——和父亲的照片放在一起。
-> act2_02_wedding

=== act2_01_show_zhaokai ===
"你看这个名字。"

赵凯沉默了一会："会不会是……别人？同名同姓？"
-> act2_02_wedding
