const vscode = require('vscode');

function activate(context) {
    console.log('PopLine extension activated');

    // ── Validation command ──
    const validateCmd = vscode.commands.registerCommand('popline.validate', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        const text = editor.document.getText();
        try {
            validate(text);
            vscode.window.showInformationMessage('PopLine: valid');
        } catch (e) {
            vscode.window.showErrorMessage(`PopLine: ${e.message}`);
        }
    });

    // ── Folding provider ──
    const foldingProvider = vscode.languages.registerFoldingRangeProvider(
        { language: 'popline' },
        {
            provideFoldingRanges(document) {
                const text = document.getText();
                const lines = text.split('\n');
                const ranges = [];
                const stack = []; // { startLine, type }

                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i];
                    if (line.endsWith('\r')) line = line.slice(0, -1);

                    // Skip empty lines and comments
                    const trimmed = line.trim();
                    if (trimmed === '' || trimmed.startsWith('#')) continue;

                    // Parse pop prefix
                    let nPop = 0, valStart = 0, j = 0;
                    while (j < line.length && line[j] >= '0' && line[j] <= '9') j++;
                    if (j > 0 && j < line.length && line[j] === ' ') {
                        nPop = parseInt(line.slice(0, j), 10);
                        valStart = j + 1;
                    }

                    // Close folded containers
                    for (let p = 0; p < nPop; p++) {
                        if (stack.length > 0) {
                            const opened = stack.pop();
                            // Only emit fold ranges of 2+ lines
                            if (i - opened.startLine >= 1) {
                                ranges.push(new vscode.FoldingRange(
                                    opened.startLine, i - 1,
                                    opened.type === 'o'
                                        ? vscode.FoldingRangeKind.Region
                                        : vscode.FoldingRangeKind.Region
                                ));
                            }
                        }
                    }

                    const rest = line.slice(valStart);

                    // Root level containers
                    if (rest === '{') {
                        stack.push({ startLine: i, type: 'o' });
                    } else if (rest === '[') {
                        stack.push({ startLine: i, type: 'a' });
                    } else {
                        // Value-level containers: key: { or key: [
                        const sep = rest.indexOf(': ');
                        if (sep >= 0) {
                            const valPart = rest.slice(sep + 2);
                            if (valPart === '{') {
                                stack.push({ startLine: i, type: 'o' });
                            } else if (valPart === '[') {
                                stack.push({ startLine: i, type: 'a' });
                            }
                        }
                    }
                }

                // EOF auto-close remaining containers
                const lastLine = Math.max(0, lines.length - 1);
                while (stack.length > 0) {
                    const opened = stack.pop();
                    if (lastLine - opened.startLine >= 1) {
                        ranges.push(new vscode.FoldingRange(
                            opened.startLine, lastLine,
                            vscode.FoldingRangeKind.Region
                        ));
                    }
                }

                return ranges;
            }
        }
    );

    context.subscriptions.push(validateCmd, foldingProvider);
}

function validate(text) {
    const frames = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.trim() === '') continue;

        let nPop = 0, valStart = 0, j = 0;
        while (j < line.length && line[j] >= '0' && line[j] <= '9') j++;
        if (j > 0 && j < line.length && line[j] === ' ') {
            nPop = parseInt(line.slice(0, j), 10);
            valStart = j + 1;
        }

        for (let p = 0; p < nPop; p++) frames.pop();

        const rest = line.slice(valStart);
        if (rest.length === 0) throw new Error(`line ${i + 1}: bare pop line`);

        if (frames.length === 0) {
            if (rest !== '{' && rest !== '[') throw new Error(`line ${i + 1}: top level must be { or [`);
            frames.push(rest === '{' ? 'o' : 'a');
            continue;
        }

        const top = frames[frames.length - 1];
        if (top === 'o') {
            if (!rest.includes(': ')) throw new Error(`line ${i + 1}: object must have 'key: value'`);
        }
    }
}

function deactivate() {}

module.exports = { activate, deactivate };
