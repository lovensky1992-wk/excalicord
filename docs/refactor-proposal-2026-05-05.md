# 方案重评估：本地 Supabase 替代 localStorage Mock

> **日期**：2026-05-05
> **来源**：Jarvis (OpenClaw) 调研结论
> **状态**：待 Claude Code 评估和决策

---

## 问题诊断

当前方案的核心问题不是 **fork 不完整**，而是 **改造方式太侵入**。

`supabase.ts` 被改了 453 行，里面有 30 处 `localStorage` 分支判断。每个分支都是一个潜在的行为差异点——返回值格式不完全一致、时序不同、错误处理路径不同。录制流程涉及状态机（idle → preview → recording → paused → exporting），任何一个环节的数据层不一致都会导致体验异常。

**核心问题：我们把"拆炸弹"当成了"剪一根线"，实际上每根线都连着别的东西。**

### 具体表现
- 录制交互与原站体验差距大
- 设置持久化部分项刷新重置
- 3 个 UI 组件显示不全/截断
- CanvasRecorder 重写引入新的不确定性

### 根因分析
```
当前架构:
App → if(supabase===null) → localStorage mock（30 处分支）
     ↓
每个分支可能的差异:
- 返回值格式（{ data, error } 签名一致但内容不同）
- 异步时序（Supabase 是异步网络请求，localStorage 是同步）
- 错误处理路径不同
- 副作用缺失（如 Supabase 的 realtime subscription、auth state change listener）
```

---

## 推荐方案：本地 Supabase，零代码改动

Supabase 有官方的本地开发模式，用 Docker 在本地跑一个完整的 Supabase 实例（PostgreSQL + Auth + Storage + Realtime 全套）。

```
当前: App → if(supabase===null) → localStorage mock ← 30 处分支，行为差异大
推荐: App → 本地 Supabase Docker（功能100%相同）← 只改 .env 里的 URL
```

### 好处
- ✅ **零代码修改** — 应用以为自己在跟真的 Supabase 通信
- ✅ **100% 功能对等** — 录制、导出、状态管理全部走原始逻辑
- ✅ **去付费** — 本地 Auth 直接注册就是用户，不需要 Stripe
- ✅ **数据完全本地** — PostgreSQL 和文件存储都在本地

### 操作步骤

```bash
# 1. 安装 Supabase CLI
brew install supabase/tap/supabase

# 2. 进项目目录，初始化+启动本地 Supabase（已有 supabase/migrations/）
cd ~/Projects/excalicord
supabase start           # 在 Docker 里启动 PostgreSQL + Auth + Storage

# 3. 拿到本地 Supabase URL 和 Key（supabase start 会打印出来）
# 写入 .env.local:
# VITE_SUPABASE_URL=http://127.0.0.1:54321
# VITE_SUPABASE_ANON_KEY=<本地 anon key>

# 4. 回退 localStorage 改造，恢复原始代码
# 需要还原的核心文件：
#   - src/services/api/supabase.ts（去掉 30 处 localStorage 分支）
#   - src/contexts/AuthContext.tsx（去掉伪用户逻辑）
#   - src/main.tsx（去掉 localStorage 预填充）

# 5. 只做两处最小改动：
#    a) Auth 注册后自动给 Pro 权限（或在本地 DB 里直接改）
#    b) 去掉 Stripe 付费校验（一个 if 判断）

# 6. npm run dev — 功能与原站完全一致
```

---

## 需要 Claude Code 评估的问题

1. **Layer 1+2 回退范围**：具体哪些 commit 需要 revert？能否干净地 revert 还是需要手动还原？
2. **supabase/migrations/ 完整性**：现有 migrations 是否包含完整的数据库 schema（profiles、projects、slides、exports 等表）？缺失的话需要从原站代码推断补充。
3. **Layer 3（UI 改造）保留评估**：TopBar/SettingsModal/TeleprompterPanel 等 UI 改造与 Supabase 无关，可以保留。但需确认这些组件没有隐式依赖被回退的 localStorage 逻辑。
4. **Layer 4（录制引擎重写）保留 vs 回退**：WebCodecs + MP4 + OPFS 方案是否比原站的 MediaRecorder 方案更好？如果原站方案能用，回退更安全。
5. **Stripe 处理**：原站 Stripe 是否真的只是 placeholder？如果有 feature gating（如录制时长限制、导出分辨率限制），需要找到这些 guard 并绕过。

---

## 泛化原则：fork 网站不丢功能的方法论

| 场景 | ❗ 错误做法 | ✅ 正确做法 |
|------|---------|----------|
| 后端依赖（Supabase/Firebase） | 用 localStorage mock 替代 | **本地跑同类服务**（supabase start / firebase emulators） |
| 第三方 API（Stripe/Auth0） | 删除调用代码 | **mock server**（msw 或 Stripe test mode） |
| 纯前端展示站 | — | 直接 fork 即可 |
| 复杂 SPA（大量业务逻辑） | AI clone 视觉 | **fork 源码 + 最小改动** |

**一句话：改环境不改代码，把远程服务搬到本地，而不是把代码里的服务调用换掉。**
