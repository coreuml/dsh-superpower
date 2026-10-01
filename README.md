# dsh-superpower

[![npm](https://img.shields.io/npm/v/@wenaixi%2Fdsh-superpower?label=npm)](https://www.npmjs.com/package/@wenaixi/dsh-superpower)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![DSH](https://img.shields.io/badge/DSH-Plugin-7c3aed)](https://github.com/deepseek-ai/deepseek-harness)

[obra/superpowers](https://github.com/obra/superpowers) 的 DSH 完整移植 — 14 个技能注入 `ctx.skills`，开箱即用，全中文。

## 安装

> 以主工作台 `web` 为例，其它 profile 改 `--profile` 后名字即可。均走 `dsh.bundle`，零构建、零白名单。

**前置**：`Node >=20`、`pnpm >=9`、`dsh`（`npm i -g @deepseek-ai/dsh`）。

```bash
# A — npm（推荐，自动安装最新）
dsh plugin --profile web add @wenaixi/dsh-superpower

# B — GitHub 直装（无视镜像延迟）
dsh plugin --profile web add github:Wenaixi/dsh-superpower

# 验证
dsh --profile web --dump-config | grep -A2 "@wenaixi/dsh-superpower"
# # == @wenaixi/dsh-superpower / - id: superpowers

dsh --profile web  # 进会话，技能自动可用
```

> 如需锁定版本，在包名后追加 `@<version>`（如 `@wenaixi/dsh-superpower@<version>`）或 `#v<version>`（GitHub 形式）。
>
> > ⚠️ 旧名 `dsh-superpower`（无 scope）已废弃并 `npm deprecate`，请改用 `@wenaixi/dsh-superpower`。

其它：

```bash
git clone https://github.com/Wenaixi/dsh-superpower.git && cd dsh-superpower
pnpm install && pnpm build && pnpm check   # verify 14/14 + smoke 14/14 PASS
dsh plugin --profile web add ./                           # 本地路径安装
pnpm pack && dsh plugin --profile web add ./wenaixi-dsh-superpower-*.tgz  # 离线 tarball

# 更新 / 卸载（同样自动取最新）
dsh plugin --profile web add @wenaixi/dsh-superpower
dsh plugin --profile web remove @wenaixi/dsh-superpower
```

## 是什么

强制性方法论而非可选建议：先设计 → 计划切片 → TDD → 系统化调试 → 评审集成。随 `dsh.bundle` 安装/卸载，不污染用户目录，HMR 自动重建。

## 包含技能

| 技能 | 触发时机 |
|---|---|
| `superpower-using-superpowers` | 任意会话起点（1% 原则） |
| `superpower-brainstorming` | 新功能前，Spike / Bounded / Architectural 分级 |
| `superpower-writing-plans` | 设计获批后，切 2–5 分钟任务 |
| `superpower-using-git-worktrees` | 隔离分支 |
| `superpower-executing-plans` / `superpower-subagent-driven-development` | 按计划执行，后者每任务一子智能体 + 两阶段评审 |
| `superpower-dispatching-parallel-agents` | 并行分发 |
| `superpower-test-driven-development` | RED-GREEN-REFACTOR |
| `superpower-systematic-debugging` / `superpower-verification-before-completion` | 调试闭环 |
| `superpower-requesting-code-review` / `superpower-receiving-code-review` | 评审 |
| `superpower-finishing-a-development-branch` | 集成 |
| `superpower-writing-skills` | 写新技能 |

映射：`Bash→pwsh`、`Read/Write→fs` 等见 `skills/superpower-using-superpowers/references/dsh-tools.md`。

## 使用

```
“帮我做 XXX”  → superpower-brainstorming → superpower-writing-plans → superpower-subagent-driven-development
“修这个缺陷”  → superpower-systematic-debugging
“帮我评审”    → superpower-requesting-code-review
```

校验：`await ctx.skills.list({cwd})` 应有 14 条 `provider: superpowers`。

## 开发

```bash
pnpm install && pnpm build && pnpm typecheck && pnpm check
dsh --profile web --dump-config  # 断言 "# == @wenaixi/dsh-superpower"
```

`pnpm check` = `verify.mjs`（静态：14 个技能 / frontmatter / 关键文件）+ `smoke.mjs`（动态：把 `lib/` 装进真实 `SkillRegistry`，断言 14 条技能 `list()`/`get()` 均可用）。CI 另有 `compat` 矩阵，跨 `dsh-skill` `0.0.1-rc.1` … `0.2.0-rc.2` 逐格复验，防止 peer 范围与产物类型再次漂移。

## 目录

```
src/superpowers.ts  # SkillProvider rank 550
skills/             # 14 技能（中文化）
scripts/            # verify.mjs（静态校验）+ smoke.mjs（真实 Registry 冒烟）
lib/                # 已提交，GitHub 直装零构建
```

版本：`v6.3.1` 起本仓库脱离上游独立演进（上游基准锁定 `obra/superpowers v6.3.0`），后续变更以正式版本线发布；`tag v*` 触发发布，`push` 仅跑 CI。当前 `v6.4.0` 起兼容 DSH `0.2.0-rc.2`。详见 `CHANGELOG.md`。

## 兼容性

| DSH 版本 | 支持 |
|---|---|
| `0.2.0-rc.2` / `0.2.0-rc.1` | ✅ 已适配并验证（`v6.4.0` 起） |
| `0.1.x` 全系列（含 `-rc` / `-alpha` 预发布） | ✅ 向后兼容 |
| `0.0.x` 全系列 | ✅ 向后兼容 |

DSH 自 `0.2.0-rc.1` 起会在 profile 组合阶段用运行时版本校验插件的 `peerDependencies` 中所有 `@deepseek-ai/dsh-*` 条目；不满足时该插件行会被标记 `disabled` 并拒绝加载，表现为「装了但不生效」。本插件 `peerDependencies` 已覆盖 `0.0.x` / `0.1.x` / `0.2.x` 三条线，无需版本豁免（`dsh plugin allow-version`）。

若安装后技能未出现，先确认 DSH 版本落在上表范围内，再查启动日志有无 `disabling profile plugin ... incompatible` 字样。

## 常见问题

404/镜像延迟请改用 GitHub 形式；白名单不需要；`latest` 可用 `npm view @wenaixi/dsh-superpower --registry https://registry.npmjs.org` 查看。

## 协议

MIT，与上游 [obra/superpowers](https://github.com/obra/superpowers) 保持一致。详见 [`LICENSE`](./LICENSE)。

## 贡献

欢迎提交 Issue / PR。详见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)。

## 致谢

- 上游作者 [Jesse Vincent](https://blog.fsck.com) 与 [Prime Radiant](https://primeradiant.com)
- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的 `dsh-skill` 三角色架构
