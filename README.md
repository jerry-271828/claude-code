# @jerry-271828/claude-code

**非官方**的 Claude Code 鸿蒙 PC(HarmonyOS PC / OpenHarmony, arm64)启动器。

> Claude 与 Claude Code 是 Anthropic PBC 的产品/商标。本包**不包含也不分发任何 Anthropic 代码**,
> 仅提供一个针对鸿蒙的启动垫片和默认环境变量。
> 使用 Claude Code 需遵守 Anthropic 的
> [法律条款](https://code.claude.com/docs/en/legal-and-compliance)。

## 安装(鸿蒙 PC)

前提:已安装 [Harmonybrew](https://atomgit.com/Harmonybrew) + Node.js ≥ 22 + ripgrep。

```sh
brew install ripgrep   # 如果没有的话

curl -fsSL https://raw.githubusercontent.com/jerry-271828/claude-code/main/install.sh | sh
```

装完直接:

```sh
claude
```

首次启动会自动下载 ~8MB 平台文件,之后秒开。

### 手动安装

```sh
git clone https://github.com/jerry-271828/claude-code.git ~/.claude-code-ohos
cd ~/.claude-code-ohos
sh install.sh
```

### 更新

```sh
cd ~/.claude-code-ohos && sh install.sh
```

或直接用 git:

```sh
cd ~/.claude-code-ohos && git pull && npm install --ignore-scripts
```

## 它做了什么

| 问题 | 修复 |
| --- | --- |
| `/storage/Users/...` 是 FUSE 挂载,临时目录 uid 检查失败 | `CLAUDE_CODE_TMPDIR=/data/storage/el2/base/cache/claude-tmp` |
| 捆绑的 ripgrep 未签名,内核拒绝执行 | `USE_BUILTIN_RIPGREP=0`,使用 PATH 里的 rg |
| 自动更新会装上不可运行的原生二进制版 | `DISABLE_AUTOUPDATER=1` |
| cometix 的 postinstall 无法识别 OHOS 平台 | 首次启动自动下载 musl 平台包并部署 |

## 技术细节

依赖 [@cometix/claude-code](https://www.npmjs.com/package/@cometix/claude-code),
它从上游 bun 编译二进制中提取了 cli.js,恢复为纯 Node.js 运行。
启动垫片在首次运行时下载匹配版本的 linux-arm64-musl 平台包,完成 cli.js
和 vendor/ 的部署,之后缓存复用。

## 卸载

```sh
rm -rf ~/.claude-code-ohos
npm rm -g @jerry-271828/claude-code 2>/dev/null || true
```
