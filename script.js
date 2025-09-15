document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const rowsInput = document.getElementById('rows');
    const colsInput = document.getElementById('cols');
    const matrixAContainer = document.getElementById('matrix-a-container');
    const matrixBContainer = document.getElementById('matrix-b-container');
    const resultTitle = document.getElementById('result-title');
    const resultMatrixDiv = document.getElementById('result-matrix');

    // --- Core Functions ---

    /**
     * 指定されたコンテナに、指定された行数と列数の入力グリッドを生成する
     * @param {HTMLElement} container - グリッドを生成する親要素
     * @param {string} prefix - IDの接頭辞 ('a' or 'b')
     * @param {number} rows - 行数
     * @param {number} cols - 列数
     */
    function createMatrixGrid(container, prefix, rows, cols) {
        container.innerHTML = ''; // Clear existing grid
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

    /**
     * 入力グリッドから値を取得し、2次元配列として返す
     * @param {string} prefix - IDの接頭辞
     * @param {number} rows - 行数
     * @param {number} cols - 列数
     * @returns {Array<Array<string|number>>}
     */
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

    /**
     * 結果を表示エリアにレンダリングする
     * @param {string} title - 結果のタイトル
     * @param {any} result - math.jsからの計算結果
     */
    function displayResult(title, result) {
        resultTitle.textContent = title;
        resultMatrixDiv.innerHTML = '';
        resultMatrixDiv.classList.remove('error');

        // 結果をグローバルスコープに保存してコピー機能で使えるようにする
        window.lastResult = result;

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
            // スカラー値（行列式など）の場合
            const formattedResult = math.format(result, { precision: 4 });
            resultMatrixDiv.innerHTML = `<span>${formattedResult}</span>`;
        }
    }
    
    /**
     * エラーメッセージを表示する
     * @param {Error} error - 発生したエラーオブジェクト
     */
    function displayError(error) {
        resultTitle.textContent = 'エラー';
        resultMatrixDiv.innerHTML = error.message;
        resultMatrixDiv.classList.add('error');
        window.lastResult = null;
    }


    // --- Event Listeners ---

    /**
     * 行数・列数の入力が変更されたときの処理
     */
    function updateGrids() {
        const rows = parseInt(rowsInput.value);
        const cols = parseInt(colsInput.value);

        if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) {
            return;
        }

        createMatrixGrid(matrixAContainer, 'a', rows, cols);
        createMatrixGrid(matrixBContainer, 'b', rows, cols);
        
        // AとBで列数が違う演算もあるため、Bの列数も可変にする
        const bCols = (rows === cols) ? cols : parseInt(colsInput.value); // 基本はAと同じだが、将来的な拡張性
        createMatrixGrid(matrixBContainer, 'b', rows, bCols);
    }
    
    rowsInput.addEventListener('change', updateGrids);
    colsInput.addEventListener('change', updateGrids);

    /**
     * すべての演算ボタンのクリック処理
     */
    document.querySelector('.operations-panel').addEventListener('click', (e) => {
        if (!e.target.matches('.op-btn')) return;

        const op = e.target.dataset.op;
        const rows = parseInt(rowsInput.value);
        const cols = parseInt(colsInput.value);

        try {
            let matrixA, matrixB, result, title, targetMatrix, scalar;
            const unaryTarget = document.getElementById('unary-target').value;

            switch (op) {
                // Binary Operations
                case 'add':
                case 'subtract':
                case 'multiply':
                case 'dotMultiply':
                    matrixA = getMatrixValues('a', rows, cols);
                    matrixB = getMatrixValues('b', rows, cols);
                    result = math[op](math.matrix(matrixA), math.matrix(matrixB));
                    const opSymbol = {add: '+', subtract: '-', multiply: '×', dotMultiply: '.*'}[op];
                    title = `結果: A ${opSymbol} B`;
                    break;
                
                // Unary Operations
                case 'det':
                case 'inv':
                case 'transpose':
                case 'trace':
                    targetMatrix = getMatrixValues(unaryTarget, rows, cols);
                    result = math[op](math.matrix(targetMatrix));
                    title = `結果: ${op}(${unaryTarget.toUpperCase()})`;
                    break;
                
                // Scalar Operations
                case 'scalarMultiply':
                case 'scalarDivide':
                    matrixA = getMatrixValues('a', rows, cols);
                    scalar = document.getElementById('scalar-value').value;
                    if(scalar.trim() === '') throw new Error('スカラー値を入力してください。');
                    result = math.evaluate(`A ${op === 'scalarMultiply' ? '*' : '/'} k`, {A: math.matrix(matrixA), k: scalar});
                    title = `結果: ${scalar} ${op === 'scalarMultiply' ? '×' : '/'} A`;
                    break;
            }
            
            // シンボリック計算の結果を単純化する
            if (typeof result.simplify === 'function') {
                result = result.simplify();
            }

            displayResult(title, result);

        } catch (error) {
            displayError(error);
        }
    });
    
    /**
     * 行列ツールバーのボタン（クリアなど）の処理
     */
    document.querySelector('.matrix-area').addEventListener('click', (e) => {
        const btn = e.target.closest('.tool-btn');
        if (!btn) return;

        const target = btn.dataset.target;
        const action = btn.dataset.action;
        const rows = parseInt(rowsInput.value);
        const cols = parseInt(colsInput.value);

        for (let i = 1; i <= rows; i++) {
            for (let j = 1; j <= cols; j++) {
                const input = document.getElementById(`${target}${i}${j}`);
                if (action === 'clear') {
                    input.value = '';
                } else if (action === 'identity') {
                    if(rows !== cols) { displayError(new Error("単位行列は正方行列でなければなりません。")); return; }
                    input.value = (i === j) ? '1' : '0';
                }
            }
        }
        // 転置は少し複雑
        if(action === 'transpose') {
            if(rows !== cols) { displayError(new Error("このUIでの転置は正方行列のみ対応しています。")); return; }
            const currentMatrix = getMatrixValues(target, rows, cols);
            const transposed = math.transpose(currentMatrix);
            for (let i = 1; i <= rows; i++) {
                for (let j = 1; j <= cols; j++) {
                    document.getElementById(`${target}${i}${j}`).value = transposed[i-1][j-1];
                }
            }
        }
    });

    /**
     * 結果のコピー機能
     */
    document.getElementById('copy-latex').addEventListener('click', () => {
        if (window.lastResult) {
            navigator.clipboard.writeText(math.format(window.lastResult, {notation: 'latex'}));
        }
    });
     document.getElementById('copy-text').addEventListener('click', () => {
        if (window.lastResult) {
            navigator.clipboard.writeText(window.lastResult.toString());
        }
    });
    document.getElementById('result-to-a').addEventListener('click', () => {
        if (window.lastResult && math.isMatrix(window.lastResult)) {
            const resultArr = window.lastResult.toArray();
            const resRows = resultArr.length;
            const resCols = resultArr[0].length;

            rowsInput.value = resRows;
            colsInput.value = resCols;
            updateGrids();

            for (let i = 1; i <= resRows; i++) {
                for (let j = 1; j <= resCols; j++) {
                    document.getElementById(`a${i}${j}`).value = math.format(resultArr[i-1][j-1], {precision: 4});
                }
            }
        }
    });


    // --- Initial Setup ---
    updateGrids(); // Initialize with default 2x2 grids
});
