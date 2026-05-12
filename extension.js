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
                const stack = [];
                let inString = false;

                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i];
                    if (line.endsWith('\r')) line = line.slice(0, -1);

                    const trimmed = line.trim();
                    if (trimmed === '' || trimmed.startsWith('#')) continue;

                    // Count container openers outside strings
                    let openers = 0;
                    for (let pos = 0; pos < line.length; pos++) {
                        const ch = line[pos];
                        if (ch === '"') inString = !inString;
                        if (!inString && (ch === '{' || ch === '[')) openers++;
                    }

                    // Detect line-end pop suffix
                    let nPop = 0;
                    const suffixMatch = line.match(/ (\d+)$/);
                    if (suffixMatch) {
                        const charBeforeSpace = line[suffixMatch.index - 1];
                        if (charBeforeSpace !== ':') {
                            nPop = parseInt(suffixMatch[1], 10);
                        }
                    }

                    // Net depth change for this line
                    const netChange = openers - nPop;

                    // Stack: track depth per startLine
                    // When depth increases, push new fold starts
                    for (let p = 0; p < openers; p++) {
                        stack.push({ startLine: i });
                    }

                    // When depth decreases, pop and emit folds
                    // For lines with same startLine, only keep the longer (outer) range
                    for (let p = 0; p < nPop; p++) {
                        if (stack.length > 0) {
                            const opened = stack.pop();
                            if (i - opened.startLine >= 1) {
                                // Check if we already have a fold from this startLine
                                const existing = ranges.findIndex(r => r.startLine === opened.startLine);
                                if (existing >= 0) {
                                    // Replace with longer range (later end)
                                    ranges[existing] = new vscode.FoldingRange(
                                        opened.startLine, i,
                                        vscode.FoldingRangeKind.Region
                                    );
                                } else {
                                    ranges.push(new vscode.FoldingRange(
                                        opened.startLine, i,
                                        vscode.FoldingRangeKind.Region
                                    ));
                                }
                            }
                        }
                    }
                }

                // EOF auto-close: extend remaining ranges to last line
                const lastLine = Math.max(0, lines.length - 1);
                while (stack.length > 0) {
                    const opened = stack.pop();
                    if (lastLine - opened.startLine >= 1) {
                        const existing = ranges.findIndex(r => r.startLine === opened.startLine);
                        if (existing >= 0) {
                            ranges[existing] = new vscode.FoldingRange(
                                opened.startLine, lastLine,
                                vscode.FoldingRangeKind.Region
                            );
                        } else {
                            ranges.push(new vscode.FoldingRange(
                                opened.startLine, lastLine,
                                vscode.FoldingRangeKind.Region
                            ));
                        }
                    }
                }

                return ranges;
            }
        }
    );

    context.subscriptions.push(validateCmd, foldingProvider);
}

function popSuffix(line) {
    const m = line.match(/ (\d+)$/);
    if (!m) return 0;
    const charBefore = line[m.index - 1];
    return charBefore === ':' ? 0 : parseInt(m[1], 10);
}

function validate(text) {
    const frames = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.endsWith('\r')) line = line.slice(0, -1);
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('#')) continue;

        // --- Extract pop suffix ---
        let contentLine = line;
        let nPop = popSuffix(line);
        if (nPop > 0) {
            contentLine = line.slice(0, line.lastIndexOf(' '));
        }

        // --- Apply pop ---
        for (let p = 0; p < nPop; p++) {
            if (frames.length === 0) {
                throw new Error(`line ${i + 1}: pop exceeds depth`);
            }
            frames.pop();
        }

        const rest = contentLine.trim();

        // --- Line content validation ---
        // Top level: must be { or [
        if (frames.length === 0) {
            if (rest === '{') { frames.push('o'); continue; }
            if (rest === '[') { frames.push('a'); continue; }
            throw new Error(`line ${i + 1}: top level must be { or [`);
        }

        const top = frames[frames.length - 1];
        if (top === 'o') {
            // Object: must be "key: value"
            const sep = rest.indexOf(': ');
            if (sep < 0) throw new Error(`line ${i + 1}: object must have 'key: value'`);
            const key = rest.slice(0, sep);
            if (key.length === 0) throw new Error(`line ${i + 1}: empty key`);
            // Check for forbidden key chars
            if (/[:"{}[# \t]/.test(key)) throw new Error(`line ${i + 1}: invalid key: '${key}'`);

            const valPart = rest.slice(sep + 2);
            if (valPart === '{') frames.push('o');
            else if (valPart === '[') frames.push('a');
            else if (valPart.startsWith('"')) {
                if (!valPart.endsWith('"') && !valPart.endsWith('" ')) {
                    // multi-line string starts — skip close check this line
                }
            } else if (['true', 'false', 'null'].includes(valPart)) {
                // keyword, ok
            } else if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(valPart)) {
                // number, ok
            } else if (valPart.length === 0) {
                throw new Error(`line ${i + 1}: missing value`);
            } else {
                throw new Error(`line ${i + 1}: invalid value: '${valPart}'`);
            }
        } else {
            // Array: line is a value
            if (rest === '{') frames.push('o');
            else if (rest === '[') frames.push('a');
            else if (rest.startsWith('"')) { /* string */ }
            else if (['true', 'false', 'null'].includes(rest)) { /* keyword */ }
            else if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(rest)) { /* number */ }
            else throw new Error(`line ${i + 1}: invalid array value: '${rest}'`);
        }
    }
}

function deactivate() {}

module.exports = { activate, deactivate };
