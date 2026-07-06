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

curl -fsSL https://raw.githubusercontent.com/jerry-271828/claude-code/main/install.sh | sh && source ~/.zshrc
```

然后直接:

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

`sh install.sh` 交互运行时会在结束时自动 `exec zsh -l` 重启 shell,退出后 `claude` 即可用。

### 更新

```sh
cd ~/.claude-code-ohos && sh install.sh
```

## 已知限制(鸿蒙)

| 限制 | 原因 |
| --- | --- |
| `node-pty` 无法编译 | npm 在 OHOS 上 spawn `sh` 报 ENOENT(node-gyp 依赖),PTY 功能不可用 |
| seccomp 沙箱不可用 | musl 平台包的 `apply-seccomp` 为非 PIE 二进制,鸿蒙内核拒绝执行 |
| 无 audio/image 原生模块 | musl 平台包不含 image-processor/audio-capture .node |
| 绑定 2.1.201 | 跟随 `@cometix/claude-code` 的最新版,自动更新已禁用(新官方版无 JS 入口) |

以上均不影响 Claude Code 的对话和代码编辑核心功能。

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

鸿蒙内核要求所有 `execve` 的文件有 `.codesign` 签名(包括 shebang 脚本),
因此通过 `~/.zshrc` 里的 shell alias(`alias claude='node ...'`)
来启动——`node` 由 harmonybrew 安装并已签名,`.mjs` 只是参数,不需签名。

## 卸载

```sh
rm -rf ~/.claude-code-ohos
sed -i '/claude-code-ohos/d' ~/.zshrc
source ~/.zshrc
```
