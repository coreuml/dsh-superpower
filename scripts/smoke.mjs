/**
 * 冒烟测试：把构建产物 lib/superpowers.js 装进真实的 @deepseek-ai/dsh-skill SkillRegistry，
 * 断言 14 个技能能被 list() / get() 正常解析。
 *
 * 这是对「装了但不生效」类回归的硬防线：仅校验文件存在的 verify.mjs 抓不到
 * SkillProvider 接口漂移、frontmatter 解析失败、rank/invocation 语义变化等问题。
 *
 * 需要 devDependencies 中的 @deepseek-ai/dsh-skill（pnpm install 已装）。
 */
import { Context } from '@deepseek-ai/cordis'
import SkillRegistry from '@deepseek-ai/dsh-skill'
import plugin from '../lib/superpowers.js'

const EXPECTED = 14
let ok = true
const fail = (msg) => { console.error(`[smoke] ✗ ${msg}`); ok = false }

const root = new Context()
root.plugin(SkillRegistry)
await new Promise(r => setTimeout(r, 50))

if (root.get('skills') === undefined) {
  fail('SkillRegistry 未注册到 ctx')
  process.exit(1)
}

// 插件入口是 default { name, inject, Config, apply }
root.plugin(plugin)
await new Promise(r => setTimeout(r, 50))

const skills = root.get('skills')
const list = await skills.list({})
console.log(`[smoke] list() 返回 ${list.length} 条`)

if (list.length !== EXPECTED) fail(`期望 ${EXPECTED} 条技能，实际 ${list.length}`)
for (const s of list) {
  if (s.provider !== 'superpowers') fail(`${s.name}: provider 应为 superpowers，实际 ${s.provider}`)
  if (s.source !== 'bundled') fail(`${s.name}: source 应为 bundled，实际 ${s.source}`)
  if (typeof s.description !== 'string' || s.description.length === 0) fail(`${s.name}: description 为空`)
  if (typeof s.invocation?.modelInvocable !== 'boolean') fail(`${s.name}: invocation.modelInvocable 非法`)
  // 注意：SkillSummary.path 自 dsh-skill 0.2.0 起才出现在 list() 摘要中（0.1.x 仅 SkillDefinition 带 path）。
  // 这里只做「若有则须合法」的宽松断言，避免把 0.2 线才有字段写成跨版本硬约束；
  // path 的硬断言放在下方 get() 分支，两条 DSH 线都成立。
  if (s.path !== undefined && typeof s.path !== 'string') fail(`${s.name}: path 类型非法`)
}

// get() 逐条加载正文，覆盖 frontmatter 二次解析与 name drift 校验
let loaded = 0
for (const s of list) {
  const def = await skills.get(s.name, {})
  if (def === undefined) { fail(`get("${s.name}") 返回 undefined`); continue }
  if (def.name !== s.name) { fail(`get("${s.name}") 返回 name "${def.name}"`); continue }
  if (typeof def.content !== 'string' || def.content.trim().length === 0) {
    fail(`get("${s.name}") 正文为空`); continue
  }
  if (typeof def.path !== 'string' || def.path.length === 0) fail(`get("${s.name}") 缺少 path`)
  if (def.resourceBase?.kind !== 'directory') fail(`get("${s.name}") resourceBase 应为 directory`)
  loaded += 1
}
console.log(`[smoke] get() 成功加载 ${loaded}/${list.length} 条正文`)

// 不存在的技能应返回 undefined 而非抛错
if (await skills.get('superpower-does-not-exist', {}) !== undefined) {
  fail('get() 对不存在的技能应返回 undefined')
}

console.log(`[smoke] ${ok ? 'ALL PASS' : 'FAIL'}`)
process.exit(ok ? 0 : 1)
