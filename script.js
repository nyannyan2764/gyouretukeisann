document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements (変更なし) ---
    const rowsInput = document.getElementById('rows');
    const colsInput = document.getElementById('cols');
    const matrixAContainer = document.getElementById('matrix-a-container');
    const matrixBContainer = document.getElementById('matrix-b-container');
    const resultTitle = document.getElementById('result-title');
    const resultMatrixDiv = document.getElementById('result-matrix');

    // ★★★ 新しい再帰関数：n×nの文字式での行列式を余因子展開で計算 ★★★
    function symbolicDeterminant(matrix) {
        const n = matrix.length;

        // ベースケース：行列が1x1の場合
        if (n === 1) {
            return matrix[0][0];
        }

        // ベースケース：行列が2x2の場合（再帰の終点として効率化）
        if (n === 2) {
            const a = matrix[0][0];
            const b = matrix[0][1];
            const c = matrix[1][0];
            const d = matrix[1][1];
            return `((${a})*(${d}) - (${b})*(${c}))`;
        }

        let det = '';
        // 再帰ステップ：第1行で余因子展開
        for (let j = 0; j < n; j++) {
            // 符号 (+ or -)
            const sign = (j % 2 === 0) ? '+' : '-';
            
            // 第1行の要素
            const element = matrix[0][j];

            // 小行列（第1行とj列を除いた行列）を作成
            const minor = matrix.slice(1).map(row => {
                return row.filter((_, colIndex) => colIndex !== j);
            });

            // detに項を追加
            if (j > 0 && det !== '') {
                 det += ` ${sign} `;
            } else if (j === 0) {
                 det += (sign === '-') ? `${sign} ` : '';
            }

            // 再帰呼び出し！
            det += `(${element}) * (${symbolicDeterminant(minor)})`;
        }

        return det;
    }

    // --- 既存の関数（変更なし） ---
    function createMatrixGrid(container, prefix, rows, cols) {
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        for (let i = 1; i <= rows; i++) {
            for (let j = 1; j <= cols; j++) {
                const input = document.createElement('input');
                input.type = 'text';
                input.id = `${prefix}${i}${j}`;
                input.placeholder = `${prefix}${i},${j}`;
                container.appendChild(input);
            }
        }
    }

    function getMatrixValues(prefix, rows, cols) {
        const matrix = [];
        for (let i = 1; i <= rows; i++) {
            const row = [];
            for (let j = 1; j <= cols; j++) {
                const input = document.getElementById(`${prefix}${i}${j}`);
                const value = input.value.trim();
                if (value === '') throw new Error(`行列 ${prefix.toUpperCase()} の (${i},${j}) が空です。`);
                row.push(value);
            }
            matrix.push(row);
        }
        return matrix;
    }

    function displayResult(title, result) {
        resultTitle.textContent = title;
        resultMatrixDiv.innerHTML = '';
        resultMatrixDiv.classList.remove('error');
        window.lastResult = result;

        if (typeof result === 'string') {
             resultMatrixDiv.innerHTML = `<span>${result}</span>`;
             return;
        }

        if (math.isMatrix(result) || Array.isArray(result)) {
            const arrayResult = result.toArray ? result.toArray() : result;
            let tableHTML = '<table>';
            arrayResult.forEach(row => {
                tableHTML += '<tr>';
                row.forEach(cell => {
                    const formattedCell = math.format(cell, { precision: 4 });
                    tableHTML += `<td>${formattedCell}</td>`;
                });
                tableHTML += '</tr>';
            });
            tableHTML += '</table>';
            resultMatrixDiv.innerHTML = tableHTML;
        } else {
            const formattedResult = math.format(result, { precision: 4 });
            resultMatrixDiv.innerHTML = `<span>${formattedResult}</span>`;
        }
    }

     function displayError(error) {
        resultTitle.textContent = 'エラー';
        resultMatrixDiv.innerHTML = error.message;
        resultMatrixDiv.classList.add('error');
        window.lastResult = null;
    }

    // --- Event Listeners (detの処理を変更) ---
    function updateGrids() {
        const rows = parseInt(rowsInput.value);
        const cols = parseInt(colsInput.value);
        if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) return;
        createMatrixGrid(matrixAContainer, 'a', rows, cols);
        createMatrixGrid(matrixBContainer, 'b', rows, cols);
    }
    
    rowsInput.addEventListener('change', updateGrids);
    colsInput.addEventListener('change', updateGrids);

    document.querySelector('.operations-panel').addEventListener('click', (e) => {
        if (!e.target.matches('.op-btn')) return;
        
        const op = e.target.dataset.op;
        const rows = parseInt(rowsInput.value);
        const cols = parseInt(colsInput.value);

        try {
            let matrixA, matrixB, result, title, targetMatrix, scalar;
            const unaryTarget = document.getElementById('unary-target').value;

            if (op === 'det') {
                if (rows !== cols) throw new Error("行列式は正方行列でなければ計算できません。");
                targetMatrix = getMatrixValues(unaryTarget, rows, cols);
                title = `結果: det(${unaryTarget.toUpperCase()})`;
                const isNumeric = targetMatrix.flat().every(val => !isNaN(parseFloat(val)) && isFinite(val));
                
                if (isNumeric) {
                    result = math.det(math.matrix(targetMatrix));
                } else {
                    // ★★★ 新しいn×nの文字式計算関数を呼び出す ★★★
                    result = symbolicDeterminant(targetMatrix);
                }
            }
            // (他の演算の処理は変更なし)
            else {
                // ... (Omitted for brevity, paste the rest of your event listener code here)
                 switch (op) {
                    case 'add': case 'subtract': case 'multiply': case 'dotMultiply':
                        // ...
                        break;
                    case 'inv': case 'transpose': case 'trace':
                         // ...
                        break;
                    case 'scalarMultiply': case 'scalarDivide':
                        // ...
                        break;
                }
            }
            
            if (typeof result.simplify === 'function') result = result.simplify();
            displayResult(title, result);

        } catch (error) {
            displayError(error);
        }
    });

    // --- Initial Setup ---
    updateGrids();
});
