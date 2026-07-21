=== ch_a04_finale ===
# scene:ch-a04-finale
# route-node:ch-a04-finale
# title:背叛线终局
# marker:BETRAYAL / CH-A04

# checkpoint:cp-betrayal-finale
{
    - betrayal_a03_choice == "1":
    -> ch_a04_path1_violence
    - betrayal_a03_choice == "2":
    -> ch_a04_path2_trust
    - betrayal_a03_choice == "3":
    -> ch_a04_path3_joint
    - else:
    -> ch_a04_path4_giveup
}

=== ch_a04_path1_violence ===
赵凯的后脑勺撞在码头的水泥柱上。他没有叫。他只是睁大了眼睛看着你——那种眼神，你见过。在密室里，他第一次把格洛克对准你的时候。

你没有杀他。你下不了手。但你把他铐在了他腰间的那副手铐上——他自己带来的。然后你把嘴凑近他的耳朵。

「赵凯。听好。我现在去做一件事。做完之后——你可以去跟陈爷说。你也可以不说。不管你怎么选——我们两清了。你欠我爸一条命。现在你记住了。」

+ [立刻逃离。带着日记和父亲的铁盒。去找省纪委。  # choice-id:betrayal-finale-flee]
    -> end_a01_ferry
+ [不逃。主动去找陈爷——说你发现赵凯是内鬼。  # choice-id:betrayal-finale-frame]
    -> end_a03_broken_anchor

=== ch_a04_path2_trust ===
六个月过去了。你日记里的记录从二十条变成了七十条。集装箱编号、到港时间、签收人名字、对应的公安内部放行审批编号——每一行旁边都有一个铅笔轻轻点的点。这些点连起来，是刘建国在过去一年里放过的每一票货。总共一百四十七票。金额不是你算得清的。

你该走了。

+ [按计划离开。把日记副本交给省纪委。然后永远消失。  # choice-id:betrayal-finale-leave]
    -> end_a01_ferry
+ [在离开之前——去公墓。最后一次远远地看苏晚和亦辰。  # choice-id:betrayal-finale-cemetery]
    -> end_a04_echo
+ [不走了。一千万的"退出底线"快到了。再干一年。  # choice-id:betrayal-finale-stay]
    -> end_a02_sinking

=== ch_a04_path3_joint ===
你和赵凯——缉毒支队的叛徒和缉毒支队的死人——在废弃调度室里拼凑了这座城市最完整的犯罪地图。他的信息和你的信息拼起来：刘建国的放行单，陈爷的账目，码头进出港的集装箱编号。每一根箭头都指向同一批人。

「齐了。」赵凯把最后一张纸放在桌上。「你那份给我。我去纪委。你在这等。」

「不行。我去。你在这等。」

「老沈——我是缉毒组组长。我进去比你容易。你一个'死了'的人——你连纪委的大厅都进不去。」

他说得对。你没有身份证。没有警徽。没有名字。在这个世界上，你不是林深，不是沈渡，不是你爸的儿子——你是陆川。一个不存在的人。

+ [让赵凯去。你在废弃调度室等他。  # choice-id:betrayal-finale-send-zhakai]
    -> end_a04_echo
+ [一起去。用一个活了的人和一个死了的人的名义。  # choice-id:betrayal-finale-together]
    -> end_a01_ferry
+ [都不去。再等等。等更好的时机。  # choice-id:betrayal-finale-wait]
    -> end_a02_sinking

=== ch_a04_path4_giveup ===
你不再记日记了。你把所有零件从脑子里卸掉——那些集装箱编号、那些放行单签名、那些你爸在铁盒里留给你的铅笔字。你变成了一个优秀的码头调度。陈爷最信任的那一个。你的业绩从零做到了一千万。陈爷在某次喝茶的时候拍了拍你的肩膀——「老陆，再干两年，你就能退了。」

你点了点头。你笑了。你发现笑已经不需要刻意了。

+ [继续。一千万之后是两千万。两千万之后是退休。  # choice-id:betrayal-finale-continue]
    -> end_a03_broken_anchor
+ [某个晚上——翻出被你撕掉的那页日记。翻过来。翻回去。  # choice-id:betrayal-finale-read-diary]
    -> end_a02_sinking
+ [去找陈爷。说——"我要退。"  # choice-id:betrayal-finale-quit]
    -> end_a02_sinking
