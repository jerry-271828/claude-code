# @jerry-271828/claude-code

**非官方**的 Claude Code 鸿蒙 PC(HarmonyOS PC / OpenHarmony, arm64)启动器。

> Claude 与 Claude Code 是 Anthropic PBC 的产品/商标。本包**不包含也不分发任何 Anthropic 代码**:
> 安装时由 npm 拉取 `@cometix/claude-code`(Node.js 兼容版),
> 本包仅提供一个针对鸿蒙的启动垫片和默认环境变量。
> 使用 Claude Code 需遵守 Anthropic 的
> [法律条款](https://code.claude.com/docs/en/legal-and-compliance)。

## 安装(鸿蒙 PC)

前提:

1. 已安装 [Harmonybrew](https://atomgit.com/Harmonybrew) 并通过它安装了 Node.js ≥ 22
2. `brew install ripgrep`(捆绑的 rg 未签名,鸿蒙内核拒绝执行)

```sh
npm i -g --ignore-scripts github:jerry-271828/claude-code
claude
```

`--ignore-scripts` 是因为 OHOS 的 Node.js 在 spawn `/usr/bin/sh` 时会报 ENOENT(内核限制),npm 的依赖编译脚本无法执行。没关系——Claude Code 核心功能不需要 node-pty。

**首次启动** `claude` 会自动下载 ~8MB 平台文件并缓存,之后秒开。

如果之前用其他方式装过 Claude Code:

```sh
npm rm -g @anthropic-ai/claude-code @cometix/claude-code
```

## 它做了什么

| 问题 | 修复 |
| --- | --- |
| `/storage/Users/...` 是 FUSE 挂载,临时目录 uid 检查失败 | `CLAUDE_CODE_TMPDIR=/data/storage/el2/base/cache/claude-tmp` |
| 捆绑的 ripgrep 未签名,内核拒绝执行 | `USE_BUILTIN_RIPGREP=0`,使用 PATH 里的 rg |
| 自动更新会装上不可运行的原生二进制版 | `DISABLE_AUTOUPDATER=1` |

## 技术细节

本包依赖 [@cometix/claude-code](https://www.npmjs.com/package/@cometix/claude-code),
它从上游 bun 编译二进制中提取了 cli.js,恢复为纯 Node.js 运行。
cometix 的 postinstall 无法识别 OHOS 平台(`process.platform === 'openharmony'`),
启动垫片在首次运行时自行下载 linux-arm64-musl 平台包并完成文件部署。

## 卸载

```sh
npm rm -g @jerry-271828/claude-code
```
