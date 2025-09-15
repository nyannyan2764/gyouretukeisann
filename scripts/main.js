document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const rowsInput = document.getElementById('rows');
    const colsInput = document.getElementById('cols');
    const matrixAContainer = document.getElementById('matrix-a-container');
    const matrixBContainer = document.getElementById('matrix-b-container');
    const resultTitle = document.getElementById('result-title-text');
    const resultMatrixDiv = document.getElementById('result-matrix');

    // --- Helper Functions ---
    function renderMatrixAsTable(matrixArray) {
        let tableHTML = '<table>';
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

    // --- Core Functions ---
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
                if (value === '') throw new Error(`Matrix ${prefix.toUpperCase()} has an empty cell at (${i},${j}).`);
                row.push(value);
            }
            matrix.push(row);
        }
        return matrix;
    }
    
    function displayResult(title, result, rawHtml = false) {
        resultTitle.textContent = title;
        resultMatrixDiv.innerHTML = '';
        resultMatrixDiv.classList.remove('error');
        window.lastResult = result;

        if (rawHtml) {
            resultMatrixDiv.innerHTML = result;
            return;
        }
        
        // Check for specific object structures before assuming a type
        if (typeof result === 'object' && result !== null && result.eigenvectors && result.values) {
            let html = '<strong>Eigenvalues:</strong><br><span>' + math.format(result.values, {precision: settings.precision}) + '</span><br><br>';
            html += '<strong>Eigenvectors:</strong>' + renderMatrixAsTable(result.eigenvectors.map(v => v.toArray()));
            resultMatrixDiv.innerHTML = html;
        } else if (typeof result === 'object' && result !== null && result.L && result.U) {
            let html = '<strong>L Matrix:</strong>' + renderMatrixAsTable(result.L.toArray());
            html += '<br><br><strong>U Matrix:</strong>' + renderMatrixAsTable(result.U.toArray());
            resultMatrixDiv.innerHTML = html;
        } else if(typeof result === 'object' && result !== null && result.Q && result.R) {
            let html = '<strong>Q Matrix:</strong>' + renderMatrixAsTable(result.Q.toArray());
            html += '<br><br><strong>R Matrix:</strong>' + renderMatrixAsTable(result.R.toArray());
            resultMatrixDiv.innerHTML = html;
        } else if (typeof result === 'string' || typeof result === 'number') {
            resultMatrixDiv.innerHTML = `<span>${result}</span>`;
        } else {
            const arrayResult = result.toArray ? result.toArray() : result;
            resultMatrixDiv.innerHTML = renderMatrixAsTable(arrayResult);
        }
    }

    function displayError(error) {
        resultTitle.textContent = 'Error';
        resultMatrixDiv.innerHTML = error.message || error;
        resultMatrixDiv.classList.add('error');
    }

    // --- History ---
    function saveToHistory(entry) {
        let history = JSON.parse(localStorage.getItem('matrixmaster-history')) || [];
        entry.id = Date.now();
        history.unshift(entry);
        if (history.length > 50) history.pop();
        localStorage.setItem('matrixmaster-history', JSON.stringify(history));
    }

    // --- Event Listeners ---
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
                    if (rows !== cols) throw new Error("Symbolic calculation requires a square matrix.");
                    
                    if (op === 'det') {
                        result = symbolicDeterminant(targetMatrix);
                        saveToHistory({op, matrix: targetMatrix});
                        displayResult(title, result);
                    } else if (op === 'inv') {
                        const invResult = symbolicInverse(targetMatrix);
                        const htmlResult = `<span>1 / ${invResult.determinant}</span>` + renderMatrixAsTable(invResult.adjugate);
                        saveToHistory({op, matrix: targetMatrix});
                        displayResult(title, htmlResult, true);
                    } else if (op === 'transpose') {
                        result = math.transpose(targetMatrix);
                        saveToHistory({op, matrix: targetMatrix});
                        displayResult(title, result);
                    } else if (op === 'eigs') {
                        title = `Result: Characteristic Polynomial det(A - \u03BBI)`;
                        result = symbolicCharacteristicPolynomial(targetMatrix);
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

    // Toolbar listeners
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
                if(rows !== cols) { displayError(new Error("Identity matrix must be square.")); return; }
                input.value = (i === j) ? '1' : '0';
            } 
            
            else if (action === 'fill-zeros') {
                input.value = '0';
            }
                
            else if (action === 'fill-random') {
                // -9から9までのランダムな整数を生成
                input.value = Math.floor(Math.random() * 19) - 9;
            }
        }
    }

    // 転置は全要素を埋めた後に行う必要があるため、ループの外に移動
    if (action === 'transpose') {
        if(rows !== cols) { displayError(new Error("In-place transpose is only for square matrices in this UI.")); return; }
        const currentMatrix = getMatrixValues(target, rows, cols);
        const transposed = math.transpose(currentMatrix);
        for (let i = 1; i <= rows; i++) {
            for (let j = 1; j <= cols; j++) {
                document.getElementById(`${target}${i}${j}`).value = transposed[i-1][j-1];
            }
        }
    }
});

    document.getElementById('copy-latex').addEventListener('click', () => {
        if (window.lastResult) {
            try {
                const latexString = math.format(window.lastResult, {notation: 'latex'});
                navigator.clipboard.writeText(latexString).catch(err => console.error('Failed to copy LaTeX: ', err));
            } catch(e) {
                navigator.clipboard.writeText(resultMatrixDiv.innerText).catch(err => console.error('Failed to copy text: ', err));
            }
        }
    });

    // Restore from history or tutorial if available
    const restoredState = localStorage.getItem('matrixmaster-restore');
    if (restoredState) {
        const { matrixA, matrixB, rows, cols } = JSON.parse(restoredState);
        rowsInput.value = rows;
        colsInput.value = cols;
        updateGrids();
        
        for (let i = 1; i <= rows; i++) {
            for (let j = 1; j <= cols; j++) {
                document.getElementById(`a${i}${j}`).value = matrixA[i-1][j-1];
                if(matrixB && document.getElementById(`b${i}${j}`)) {
                     document.getElementById(`b${i}${j}`).value = matrixB[i-1][j-1];
                }
            }
        }
        localStorage.removeItem('matrixmaster-restore');
    } else {
        updateGrids(); // Initial Setup on first visit
    }
});
