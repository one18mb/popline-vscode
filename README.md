# PopLine VS Code Extension

PopLine 语言支持（`.pln` 文件）。

## 功能

- 语法高亮（对象、数组、键名、字符串、数字、关键字、注释）
- 行末弹出后缀 ` N` 高亮
- 深浅双色支持（适配 VS Code 深色/浅色主题）
- 基础文件校验

## 安装

### 方式一：下载 VSIX 安装

1. 从 [Releases](https://github.com/one18mb/popline-vscode/releases) 下载最新 `.vsix` 文件
2. VS Code → 扩展面板 → `...` → **从 VSIX 安装**
3. 选择下载的 `.vsix` 文件

### 方式二：源码安装

```bash
git clone https://github.com/one18mb/popline-vscode.git
cd popline-vscode
code --install-extension popline-vscode-0.2.0.vsix
```

## 兼容性

| VS Code 版本 | 支持 |
|-------------|------|
| ≥ 1.70.0 | ✅ 完整支持 |
| < 1.70.0 | ❌ 不支持 |

## 打包 .vsix

需安装 `vsce`（VS Code Extension Manager）：

```bash
npm install -g @vscode/vsce
vsce package
# 生成 popline-vscode-0.2.0.vsix
```

## 配色

扩展内置深浅双色配置，自动适配 VS Code 当前主题：

| 元素 | 深色主题 | 浅色主题 |
|------|---------|---------|
| 背景 | `#1E1E1E` | `#FFFFFF` |
| 前景 | `#D4D4D4` | `#333333` |
| 键名 | 浅蓝 `#9CDCFE` | 深蓝 `#005CC5` |
| 字符串 | 橙黄 `#CE9178` | 棕色 `#A31515` |
| 数字 | 浅绿 `#B5CEA8` | 深绿 `#098658` |
| 关键字 | 蓝色 `#569CD6` | 紫色 `#0000FF` |
| 注释 | 绿色 `#6A9955` | 绿色 `#008000` |

## 致谢
本项目的开发得到了以下 AI 工具的大力协助：
- [DeepSeek](https://deepseek.com)（深度求索）
