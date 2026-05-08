# Excalicord 本地化

> 共享项目记忆：Claude Code 自动加载，OpenClaw (Jarvis) 按需读取。谁改谁更新。

## 项目信息
- **目标**：将 Excalicord 改造为完全本地可用（去付费、去云端依赖），像素级匹配原站
- **原站**：https://www.excalicord.com/
- **baseline commit**：`56515ab`（原始代码最后一个 commit，所有对比以此为准）
- **启动命令**：`make dev`（首次需 `make setup`）

## Iron Laws（不可违反）

```
1. 一次只改一个东西
   改完验证通过再改下一个。禁止同时改 UI + 逻辑 + 样式。
   ✅ 自检：这个 commit 只解决一个问题吗？

2. 改之前先看原站 + 原始代码
   UI 改动前，先截图原站对应状态存到 docs/screenshots/。
   代码改动前，先 git show 56515ab:path/to/file 看原始实现。
   禁止"凭印象"修改。
   ✅ 自检：我看过原站截图和原始代码了吗？

3. 改了就要验证
   没有刚跑出的验证输出，不许说"完成了"/"修好了"。
   录制相关改动必须测完整链路（idle→preview→recording→pause→stop）。
   ✅ 自检：我手上有这一分钟内跑出来的证据吗？

4. 3 轮不对就回退
   连续 3 轮修改同一个问题还没解决 → git checkout 回退该文件。
   重新读原始代码，换思路。不在错误方向上叠补丁。
   ✅ 自检：我是在修问题还是在叠补丁？

5. 禁止顺手重构
   修 bug 时不要同时重构代码结构、提取 hook、改命名。
   重构是独立任务，单独提交。

6. 改完必跑回归
   任何代码改动后，运行 npm run test:regression。
   有失败 → 立刻修复或回退，不许继续做新的改动。
   ✅ 自检：回归测试全绿了吗？
```

## 操作规则

### 原始代码参照
baseline = `56515ab`。修改任何文件前必须执行：
```bash
git show 56515ab:path/to/file | head -100
```

### 变更隔离协议
1. 改之前 `git stash` 或新建分支，保证随时可回退
2. 一个 commit 只解决一个问题，commit message 写清改了什么 + 为什么
3. 🔴 高危文件改后必须全流程验证（详见 @.claude/rules/file-risk-levels.md）
4. 改了 CSS → 验证亮色/暗色两个主题

### 视觉验证协议
`docs/screenshots/` 存放原站参考截图，命名：`original-{功能}-{状态}.png` / `local-{功能}-{状态}.png`
UI 类改动完成标准：本地截图与 original 肉眼无差异。
**没有参考截图的功能，不要开始改 UI。先截图，再动手。**

### 不做清单（从踩坑固化）
- ❌ 不用 localStorage mock 替代 Supabase — 用本地 Supabase Docker
- ❌ 不在 useEffect 里做可以同步完成的初始化 — 防止竞态/无限循环
- ❌ 不用 Playwright screenshot 调试 — 撑爆 context，用 snapshot 代替
- ❌ 不重写 MediaRecorder 为 WebCodecs — 原始方案能用就不重写
- ❌ 不用 `scrollToContent({ fitToViewport })` — 不生效，详见 @.claude/rules/excalidraw-api-pitfalls.md
- ❌ 不用 `updateScene({ elements })` 改 frame strokeColor — 不触发重绘，用 HTML overlay
- ❌ 不把需要持久化的数据放 ref — ref 变化不触发 effect

### 求助触发器
以下情况立即停下来告知用户，不要继续试：
- Excalidraw API 行为与预期不符
- 同一个文件改了 3 轮以上还不对
- 需要看原站实际交互才能判断（说"我需要看原站截图"）
- TypeScript 类型错误超过 3 个且相互关联
- 改动涉及 2 个以上高危文件的联动

## 当前状态
- **最后更新**：2026-05-08
- **进展**：Phase 0-7 全部完成，像素级 UI 对齐 + 视觉回归测试覆盖
- **回归测试**：24 个 Playwright 测试全通过（16 回归 + 8 验证）
- **详细架构/分层/功能清单**：见 @.claude/rules/architecture-layers.md
- **录制状态机**：见 @.claude/rules/recording-state-machine.md
- **Excalidraw API 限制**：见 @.claude/rules/excalidraw-api-pitfalls.md
