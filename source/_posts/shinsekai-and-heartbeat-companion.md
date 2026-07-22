---
title: 让角色偶尔主动开口：Shinsekai 与我的心跳插件
date: 2026-07-23 02:00:00
categories:
  - 项目随笔
tags:
  - Shinsekai
  - AI
  - Galgame
  - 插件开发
description: 简单认识 AI 角色桌面助手 Shinsekai，以及我为它补上的沉浸模式和 Heartbeat Companion 心跳插件。
cover: https://raw.githubusercontent.com/RachelForster/Shinsekai/main/frontend/e2e/visual.spec.ts-snapshots/chat-stage-chromium-desktop-linux.png
---
最近接触了一个很有意思的项目：[Shinsekai（新世界）](https://github.com/RachelForster/Shinsekai)。它想做的并不只是一个套着角色立绘的聊天框，而是把大语言模型、角色设定、Galgame 式演出、语音与插件系统放进同一个桌面应用里。

我也在里面做了一点很小的合并，并另外写了一个让角色在空闲时主动开口的心跳插件。这篇就简单记一下它们。

![image.png](blob:https:/app.pagescms.org/310132c9-d2f0-4602-9e9a-2956be0fb09c)

*Chat Stage 的界面预览，截图来自 Shinsekai 项目仓库。*

## Shinsekai 是什么

Shinsekai 是一个面向 Galgame、乙女游戏和剧情向 RPG 场景的 AI 角色桌面助手。配置好模型和角色后，它可以让角色以立绘、对话框和语音的形式与人交流。写这篇文章时，仓库中的版本号是 2.3.0。

它目前大致把这些能力组合到了一起：

- 使用大语言模型生成符合角色设定的对话；
- 管理角色、立绘、表情、背景、世界书和聊天模板；
- 接入 TTS、ASR 与文生图服务；
- 通过工具、MCP 和插件继续扩展能力；
- 使用 React 设置中心管理配置，在 Chat Stage 中专注于角色演出。

我比较喜欢的一点，是它没有把“角色感”完全寄托在提示词上。立绘切换、情绪、对话历史、语音和界面演出也都参与了体验。模型负责生成内容，其他部分则把这些内容变得更像一次真正的角色互动。

![Shinsekai 的插件管理页面](https://raw.githubusercontent.com/RachelForster/Shinsekai/main/frontend/e2e/visual.spec.ts-snapshots/settings-plugins-chromium-desktop-linux.png)

*设置中心里的插件管理页面，截图来自 Shinsekai 项目仓库。*

项目可以从 [GitHub 仓库](https://github.com/RachelForster/Shinsekai)获取源码，也可以在 [Releases](https://github.com/RachelForster/Shinsekai/releases) 下载整合包。需要注意的是，Shinsekai 是**源码可见项目，并非传统意义上的开源项目**；查看、在本地构建和通过公开 fork 参与讨论或贡献是允许的，但再分发、发布安装包和商业使用等行为需要遵守仓库里的 [LICENSE](https://github.com/RachelForster/Shinsekai/blob/main/LICENSE)。

## 我合入的一点小改动

使用 Chat Stage 时，我希望界面在不操作的时候更干净一些，所以给它补了一个可选的“沉浸模式”。这部分后来通过 [PR #231](https://github.com/RachelForster/Shinsekai/pull/231) 合入了上游。

开启后，右上角工具和底部输入区可以分别在短暂空闲后自动隐藏；把鼠标移回原来的位置，它们会马上出现。如果输入框里还有没发出的草稿、正在输入或使用语音，输入区也会继续保持可见，避免为了追求干净而打断实际操作。

不是什么很大的功能，更像是把我在使用时遇到的一点别扭磨平了。不过，看到自己的改动进入上游，还是挺开心的。

## Heartbeat Companion：让角色不只被动回答

在普通聊天应用里，角色几乎总要等用户先发消息。这样很稳定，却也容易让角色像一个一直等待指令的工具。于是我另外写了 [Heartbeat Companion](https://github.com/Hard-to-tell/shinsekai-heartbeat)：当用户空闲一段随机时间后，让当前角色偶尔主动说一句话。

![image.png](/images/image-1.png)

*插件运行示例。*

插件有三种触发方式：

1. **识屏**：可选调用 Moondream Vision，先理解屏幕上正在发生什么，再自然地接一句；
2. **自言自语**：维持当前人设，说一句符合情境的话；
3. **主动提问**：结合时间和最近的对话，向用户发起一个简单的问题。

默认会在 5 到 15 分钟的随机空闲时间后尝试触发。用户发出消息、角色正在回复或 TTS 还在播放时，计时都会重新开始或暂停，因此它不会在正常对话中突然插话。短暂离开时，插件更倾向于承接最近的话题；空闲较久后，才会更倾向于重新观察屏幕或问一个问题。

它也不会绕开 Shinsekai 自己去直接调用模型。心跳最终仍然进入当前会话，继续使用已经选好的角色、LLM、输出解析、界面和 TTS 设置。Moondream Vision 只是可选能力：没有安装、尚未加载或识屏失败时，会自动退回自言自语或提问模式。

目前插件提供了自己的配置页面，可以调整空闲时间、三种模式的权重、回复长度、提示词和固定问题等。代码和安装方法放在 [shinsekai-heartbeat 仓库](https://github.com/Hard-to-tell/shinsekai-heartbeat)；如果 Shinsekai 的插件市场里已经能搜到 **Heartbeat Companion**，也可以直接从插件管理器安装。

## 最后

我觉得 Shinsekai 有趣的地方，在于它把“和模型聊天”继续往“和一个角色相处”推了一点。我的沉浸模式和心跳插件都只是很小的补充：一个尽量减少界面的存在感，另一个让角色偶尔拥有发起对话的机会。

它们都还谈不上完美，但已经让这套体验更接近我想象中的样子了。