# 贡献指南

感谢你对 `dsh-superpower` 感兴趣！本项目是 [obra/superpowers](https://github.com/obra/superpowers) 的 DSH 移植版，贡献时请兼顾“上游一致性”与“DSH 适配”。

## 基本原则

- **独立演进（v6.3.1 起）**：`package.json#version` 不再跟随上游 `obra/superpowers`；上游基准锁定 `v6.3.0`，上游新特性按需 cherry-pick 合入并记录于 `CHANGELOG.md`
- **中文化**：`skills/**/SKILL.md` 及辅助文档保持简体中文，代码/命令/路径/变量名不译
- **DSH 标准**：插件入口遵循 `dsh-plugin-dev` 技能的硬规则（`inject`、`Schemastery Config`、`ctx.effect` 清理、`waterfall next()` 等）
- **失败要响亮**：非法 frontmatter 仅跳过单技能并 `warn`，不静默吞错

## 开发流程

```bash
pnpm install
pnpm build        # tsc -p tsconfig.build.json -> lib/
pnpm typecheck    # tsc --noEmit
pnpm check        # verify（静态）+ smoke（真实 SkillRegistry 冒烟）
dsh --profile demo --dump-config   # 应看到 "# == @wenaixi/dsh-superpower"
```

## 提交 PR

1. Fork 本仓库，基于 `main` 新建分支（`feat/xxx` / `fix/xxx` / `chore/sync-upstream-vX.Y.Z`）
2. 小步提交：一个技能或一个文档一 commit，信息用简体中文、动词开头
3. 提交前确保 `pnpm build && pnpm typecheck && pnpm check` 全绿
4. PR 描述中注明：关联的上游版本、改动范围、是否影响 `rank` / `providerName` / `skillDir` 等配置
5. 涉及技能正文的改动，请说明中文化与 DSH 工具映射的处理

## 兼容新 DSH 版本

DSH 自 `0.2.0-rc.1` 起会在 profile 组合阶段用运行时版本校验插件 `peerDependencies` 中所有 `@deepseek-ai/dsh-*` 条目（`evaluatePluginCompatibility()`）；不满足时该插件行被标记 `disabled` 并拒绝加载，表现为**「装了但不生效」**（无报错，仅启动日志 `disabling profile plugin ... incompatible`）。因此 DSH 发布新线时必须显式扩围。

扩围清单：

1. `package.json#peerDependencies["@deepseek-ai/dsh-skill"]` 追加新线分支（如 `>=0.3.0-rc.1 <0.4.0-0`），**保留**旧分支以维持向后兼容
2. `devDependencies` 对齐新线实际依赖的 `@deepseek-ai/dsh-skill` / `@deepseek-ai/cordis` / `@deepseek-ai/schemastery`
3. `pnpm install` 刷新 `pnpm-lock.yaml`，`pnpm build && pnpm typecheck && pnpm check` 全绿
4. `.github/workflows/ci.yml` 的 `compat` 矩阵加入新版本格，**保留下限格**（如 schemastery `3.18.1`）——下限格是防 `.d.ts` 类型漂移的唯一保险
5. 若新线引入破坏性 API 变更，改 `src/superpowers.ts` 并同步 `skills/**/references/dsh-tools.md` 的工具映射
6. `CHANGELOG.md` 记录：扩围范围、DSH 侧校验机制、验证证据

> ⚠️ **不要**用 `--legacy-peer-deps` 或 `npm deprecate` 绕过兼容预检；那只是让插件「装上」，DSH 运行时仍会禁用该行。正确做法是扩围 `peerDependencies`。

**`lib/*.d.ts` 类型稳定性：** 对外导出的 `Schema` 值一律写显式类型标注（如 `export const Config: Schema<Config>`）。`@deepseek-ai/schemastery` 自 `3.18.3` 起给 `Schemastery` 接口新增了第三个泛型参数 `Mode`，未标注时 tsc 会把该泛型写进 `.d.ts`，而 peer 下限仍是 `^3.18.1`，会让下限用户在 `skipLibCheck: false` 下报 `TS2707: Generic type 'Schema' requires between 0 and 2 type arguments`。

## 同步上游

```bash
git clone --depth 1 https://github.com/obra/superpowers.git /tmp/superpowers
# 对比 skills/ 与 package.json#version
# 保留 references/dsh-tools.md 等 DSH 专属文件
```

### 与上游脱钩：name 永久加 `superpower-` 前缀

本仓库 14 个技能的 `frontmatter.name` 已统一加 `superpower-` 前缀（如 `superpower-brainstorming`、`superpower-using-superpowers`），**与上游 `obra/superpowers` 永久脱钩**。上游仍叫 `brainstorming`、`using-superpowers`，本仓库叫 `superpower-brainstorming`、`superpower-using-superpowers`。

**为何脱钩：**

- DSH 上游 `isSkillName = /^[a-z0-9]+(-[a-z0-9]+)*$/` 拒绝冒号与下划线，只能走 kebab-case 短横线
- 上游 Claude Code 习惯的 `/skill superpowers:<name>`（冒号）在 DSH 下不被识别
- 加 `superpower-` 前缀后，前端 `/skill superpower-brainstorming` 与模型 `skill("superpower-brainstorming")` 均能直接工作
- 与上游同步的代价是手工改名 14 处（见下）

**每次同步上游新版本时（如 `v6.5.0`、`v6.6.0`）：**

1. 拉取上游 `skills/` 与本仓库 `skills/` 逐目录对比
2. 对每个上游技能新增 / 改名 / 删除的技能：把 `frontmatter.name` 改为 `superpower-<kebab>`（新增技能）或同步删除本地对应技能
3. 同步中文化正文与新增的辅助文档
4. 同步更新所有文档里引用的旧名（`superpowers:<x>` → `superpower-<x>`）
5. 跑 `pnpm build && pnpm typecheck && pnpm check` 全绿
6. 同步完成后按本仓独立版本线发布（当前 `v6.4.0` 起），并在 `CHANGELOG.md` 记录所同步的上游提交/版本

**目录名同步策略：** 目录名与 `frontmatter.name` 必须一致，统一为 `superpower-<kebab>`（`v6.3.0-dsh.9` 起硬重命名）。同步上游新增技能时，目录与 frontmatter 同步使用 `superpower-` 前缀，避免触发 Provider 的 name drift 警告。

---

有疑问请提 Issue，欢迎参与贡献。
