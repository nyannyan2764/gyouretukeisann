document.addEventListener('DOMContentLoaded', () => {
    // (DOM要素の取得部分は変更なし)

    // ★★★ 新設：行列配列をHTMLテーブルに変換するヘルパー関数 ★★★
    function renderMatrixAsTable(matrixArray) {
        let tableHTML = '<table style="display: inline-block; vertical-align: middle; margin-left: 15px;">';
        matrixArray.forEach(row => {
            tableHTML += '<tr>';
            row.forEach(cell => {
                tableHTML += `<td style="padding: 10px;">${cell}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</table>';
        return tableHTML;
    }

    // (createMatrixGrid, getMatrixValues, symbolicDeterminantの呼び出しに変更)

    function displayResult(title, result, rawHtml = false) {
        // (変更なし)
    }
    // (displayError, saveToHistoryも変更なし)

    // --- Event Listeners (大幅更新) ---
    document.querySelector('.operations-panel').addEventListener('click', (e) => {
        if (!e.target.matches('.op-btn')) return;
        
        const op = e.target.dataset.op;
        const rows = parseInt(rowsInput.value);
        const cols = parseInt(colsInput.value);

        try {
            let matrixA, matrixB, result, title, targetMatrix;

            if (op === 'add' || op === 'subtract' || op === 'multiply') {
                matrixA = getMatrixValues('a', rows, cols);
                matrixB = getMatrixValues('b', rows, cols);
                result = math[op](math.matrix(matrixA), math.matrix(matrixB));
                title = `Result: A ${op === 'multiply' ? '×' : op === 'add' ? '+' : '-'} B`;
                saveToHistory({op, matrixA, matrixB});
                displayResult(title, result);
            } else if (op === 'scalarMultiply') {
                matrixA = getMatrixValues('a', rows, cols);
                const scalar = document.getElementById('scalar-value').value;
                result = math.evaluate(`A * k`, {A: math.matrix(matrixA), k: scalar});
                title = `Result: ${scalar} × A`;
                saveToHistory({op, matrixA, scalar});
                displayResult(title, result);
            } else { // Unary and Decomposition
                const targetPrefix = document.getElementById(op === 'lu' || op === 'qr' ? 'decomposition-target' : 'unary-target').value;
                targetMatrix = getMatrixValues(targetPrefix, rows, cols);
                const isNumeric = targetMatrix.flat().every(val => !isNaN(parseFloat(val)) && isFinite(val));
                title = `Result: ${op}(${targetPrefix.toUpperCase()})`;

                if (isNumeric) {
                    if ((op === 'det' || op === 'inv' || op === 'eigs' || op === 'lu') && rows !== cols) {
                        throw new Error(`Operation "${op}" requires a square matrix.`);
                    }
                    result = math[op](targetMatrix);
                    saveToHistory({op, matrix: targetMatrix});
                    displayResult(title, result);
                } else { // Symbolic Calculation
                    if (op === 'det') {
                        if (rows !== cols) throw new Error("Determinant requires a square matrix.");
                        result = symbolicDeterminant(targetMatrix);
                        saveToHistory({op, matrix: targetMatrix});
                        displayResult(title, result);
                    } else if (op === 'inv') {
                        if (rows !== cols) throw new Error("Inverse requires a square matrix.");
                        const invResult = symbolicInverse(targetMatrix);
                        const htmlResult = `<span>1 / ${invResult.determinant}</span>` + renderMatrixAsTable(invResult.adjugate);
                        saveToHistory({op, matrix: targetMatrix});
                        displayResult(title, htmlResult, true);
                    } else if (op === 'transpose') {
                        result = math.transpose(targetMatrix);
                        saveToHistory({op, matrix: targetMatrix});
                        displayResult(title, result);
                    } else {
                        throw new Error(`Symbolic calculation for "${op}" is not supported.`);
                    }
                }
            }
        } catch (error) {
            displayError(error);
        }
    });

    // (残りのコードは変更なし)
});
