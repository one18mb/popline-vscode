const vscode = require('vscode');

function activate(context) {
    console.log('PopLine extension activated');

    // Basic validation on save
    const disposable = vscode.commands.registerCommand('popline.validate', () => {
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

    context.subscriptions.push(disposable);
}

function validate(text) {
    const frames = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.trim() === '') continue;

        // parse pop prefix
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
