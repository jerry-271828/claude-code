# @jerry-271828/claude-code

**非官方**的 Claude Code 鸿蒙 PC(HarmonyOS PC / OpenHarmony,arm64)启动器。

> Claude 与 Claude Code 是 Anthropic PBC 的产品/商标。本包**不包含也不分发任何 Anthropic 代码**:
> 安装时由 npm 从官方源拉取 `@cometix/claude-code`(Node.js 兼容版)及其平台包,
> 本包仅提供一个针对鸿蒙的启动垫片和默认环境变量。
> 使用 Claude Code 需遵守 Anthropic 的
> [法律条款](https://code.claude.com/docs/en/legal-and-compliance)。

## 安装

前提(鸿蒙 PC):

1. 已安装 [Harmonybrew](https://atomgit.com/Harmonybrew) 并通过它安装了 Node.js ≥ 22
2. `brew install ripgrep`(鸿蒙内核要求可执行文件有 `.codesign` 签名,捆绑的 rg 未签名无法执行,需要 harmonybrew 预签名的系统版)
3. `node-pty` 依赖需要本地编译(无 Linux 预编译包),确保有构建工具:
   ```sh
   brew install devel-base   # 提供 g++, make, python3
   ```

```sh
npm i -g @jerry-271828/claude-code
claude
```

如果之前用其他方式装过 Claude Code(官方包或 @cometix 包),先卸载以避免 `claude` 命令冲突:

```sh
npm rm -g @anthropic-ai/claude-code @cometix/claude-code
```

## 它做了什么

启动时(仅在检测到 `/data/storage/el2/base` 存在时):

| 问题 | 修复 |
| --- | --- |
| `/storage/Users/...` 是 sharefs/FUSE 挂载,临时目录 uid 检查失败 | 默认 `CLAUDE_CODE_TMPDIR=/data/storage/el2/base/cache/claude-tmp` |
| 捆绑的 ripgrep 未签名,鸿蒙内核拒绝执行(EPERM) | 默认 `USE_BUILTIN_RIPGREP=0`,使用 PATH 里的 rg |
| 官方新版本只有原生二进制(非 PIE,无 OHOS 平台),自动更新会把本机装坏 | 默认 `DISABLE_AUTOUPDATER=1` |

以上环境变量如果你已自行设置,垫片不会覆盖。

## 技术细节

本包依赖 [@cometix/claude-code](https://www.npmjs.com/package/@cometix/claude-code),
它从上游 Anthropic 的 bun 编译二进制中提取了 cli.js,恢复为纯 Node.js 运行。
上游 Claude Code 自 2.1.113 起 npm 包不再附带 JS 入口,本包通过 cometix 锁定在
2.1.201(当前最新可用版本)。cometix 的 postinstall 会自动安装对应平台的
cli.js 和 vendor 文件。

## 卸载

```sh
npm rm -g @jerry-271828/claude-code
```
