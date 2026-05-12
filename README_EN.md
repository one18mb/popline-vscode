# PopLine VS Code Extension

PopLine language support for `.pln` files.

## Features

- Syntax highlighting (objects, arrays, keys, strings, numbers, keywords, comments)
- Pop suffix ` N` highlighting
- Light & dark theme support
- Basic file validation

## Install

### Option 1: Download VSIX

1. Download the latest `.vsix` from [Releases](https://github.com/one18mb/popline-vscode/releases)
2. VS Code → Extensions → `...` → **Install from VSIX**
3. Select the downloaded `.vsix` file

### Option 2: Source install

```bash
git clone https://github.com/one18mb/popline-vscode.git
cd popline-vscode
code --install-extension popline-vscode-0.2.0.vsix
```

## Compatibility

| VS Code Version | Support |
|----------------|---------|
| ≥ 1.70.0 | ✅ Full support |
| < 1.70.0 | ❌ Not supported |

## Build VSIX

```bash
npm install -g @vscode/vsce
vsce package
```

## Colors

| Element | Dark Theme | Light Theme |
|---------|-----------|------------|
| Background | `#1E1E1E` | `#FFFFFF` |
| Foreground | `#D4D4D4` | `#333333` |
| Keys | `#9CDCFE` | `#005CC5` |
| Strings | `#CE9178` | `#A31515` |
| Numbers | `#B5CEA8` | `#098658` |
| Keywords | `#569CD6` | `#0000FF` |
| Comments | `#6A9955` | `#008000` |

## Acknowledgments
This project was developed with the assistance of:
- [Claude Code](https://claude.ai) (Anthropic)
- [DeepSeek](https://deepseek.com) (DeepSeek)
