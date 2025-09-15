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
        // Ensure settings are accessible or use a default
        const precision = (typeof settings !== 'undefined' && settings.precision) ? settings.precision : 4;
        let tableHTML = '<table>';
        matrixArray.forEach(row => {
            tableHTML += '<tr>';
            row.forEach(cell => {
                // Format numbers for consistent display
                let formattedCell = (typeof cell === 'number') ? math.format(cell, { precision: precision }) : cell;
                tableHTML += `<td style="padding: 10px;">${formattedCell}</td>`;
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

        const resultContainer = document.querySelector('.result-display-container');
        if(resultContainer) {
            resultContainer.classList.remove('glitch-in');
            void resultContainer.offsetWidth; // Trigger reflow to restart animation
            resultContainer.classList.add('glitch-in');
        }

        if (rawHtml) {
            resultMatrixDiv.innerHTML = result;
            return;
        }

        if (typeof result === 'object' && result !== null && result.eigenvectors && result.values) {
            const precision = (typeof settings !== 'undefined' && settings.precision) ? settings.precision : 4;
            let html = '<strong>Eigenvalues:</strong><br><span>' + math.format(result.values, {precision: precision}) + '</span><br><br>';
            const vectorsAsColumns = math.transpose(result.eigenvectors.toArray());
            html += '<strong>Eigenvectors (as columns):</strong>' + renderMatrixAsTable(vectorsAsColumns);
            resultMatrixDiv.innerHTML = html;
        } else if (typeof result === 'object' && result !== null && (result.L || result.Q)) {
             let html = '';
             if(result.L && result.U) { // LU Decomposition
                html = '<strong>L Matrix:</strong>' + renderMatrixAsTable(result.L.toArray());
                html += '<br><br><strong>U Matrix:</strong>' + renderMatrixAsTable(result.U.toArray());
             } else if (result.Q && result.R) { // QR Decomposition
                html = '<strong>Q Matrix:</strong>' + renderMatrixAsTable(result.Q.toArray());
                html += '<br><br><strong>R Matrix:</strong>' + renderMatrixAsTable(result.R.toArray());
             }
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
        const resultContainer = document.querySelector('.result-display-container');
        if(resultContainer) resultContainer.classList.add('glitch-in');
    }

    // --- History ---
    function saveToHistory(entry) {
        let history = JSON.parse(localStorage.getItem('matrixmaster-history')) || [];
        entry.id = Date.now();
        history.unshift(entry);
        if (history.length > 50) history.pop(); // Keep history to a reasonable size
        localStorage.setItem('matrixmaster-history', JSON.stringify(history));
    }

    // --- Event Listeners ---
    function updateGrids() {
        try {
            const rows = parseInt(rowsInput.value);
            const cols = parseInt(colsInput.value);
            if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) return;
            createMatrixGrid(matrixAContainer, 'a', rows, cols);
            createMatrixGrid(matrixBContainer, 'b', rows, cols);
        } catch(e) {
            console.error("Failed to update grids:", e);
        }
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

            // This block handles operations like A+B, A-B, A*B
            if (['add', 'subtract', 'multiply'].includes(op)) {
                matrixA = getMatrixValues('a', rows, cols);
                matrixB = getMatrixValues('b', rows, cols);
                result = math[op](matrixA, matrixB);
                const opSymbol = op === 'add' ? '+' : op === 'subtract' ? '-' : '×';
                title = `Result: A ${opSymbol} B`;
            }
            // This block handles scalar multiplication like k*A
            else if (op === 'scalarMultiply') {
                const scalar = document.getElementById('scalar-value').value || 'k';
                matrixA = getMatrixValues('a', rows, cols);
                result = math.multiply(scalar, matrixA);
                title = `Result: ${scalar} × A`;
            }
            // This block handles all other single-matrix operations (determinant, inverse, etc.)
            else {
                const targetSelect = e.target.closest('.op-group').querySelector('select');
                const targetPrefix = targetSelect ? targetSelect.value : 'a'; // Default to A if no select found
                targetMatrix = getMatrixValues(targetPrefix, rows, cols);

                const isNumeric = targetMatrix.flat().every(val => !isNaN(parseFloat(val)) && isFinite(val));
                title = `${op}(${targetPrefix.toUpperCase()})`;

                if (isNumeric) {
                    if (['det', 'inv', 'eigs', 'lu', 'qr'].includes(op) && rows !== cols) {
                        throw new Error(`Operation "${op}" requires a square matrix.`);
                    }
                    result = math[op](math.matrix(targetMatrix));
                } else { // Symbolic Calculation
                    if (rows !== cols) throw new Error("Symbolic calculation requires a square matrix.");
                    if (op === 'det') result = symbolicDeterminant(targetMatrix);
                    else if (op === 'inv') {
                        const invResult = symbolicInverse(targetMatrix);
                        displayResult(title, `<span>1 / ${invResult.determinant}</span>` + renderMatrixAsTable(invResult.adjugate), true);
                        saveToHistory({op, matrix: targetMatrix});
                        return; // Exit early as display is custom
                    } else if (op === 'eigs') {
                        // Eigenvalue calculation for symbolic is finding the characteristic polynomial
                        throw new Error("Symbolic eigenvalue calculation is not supported in this way. Try finding the determinant of (A - λI).");
                    } else {
                        throw new Error(`Symbolic calculation for "${op}" is not supported.`);
                    }
                }
            }
            saveToHistory({op, matrixA, matrixB, matrix: targetMatrix, scalar: document.getElementById('scalar-value')?.value});
            displayResult(title, result);
        } catch (error) {
            displayError(error);
        }
    });

    // Toolbar listeners
    document.querySelector('.matrix-area').addEventListener('click', (e) => {
        const button = e.target.closest('.tool-btn');
        if (!button) return;
    
        const target = button.dataset.target;
        const action = button.dataset.action;
        const rows = parseInt(rowsInput.value);
        const cols = parseInt(colsInput.value);
        const container = document.getElementById(`matrix-${target}-container`);
        
        if (action === 'clear') {
             container.querySelectorAll('input').forEach(input => input.value = '');
        } else if (action === 'fill-zeros') {
            container.querySelectorAll('input').forEach(input => input.value = '0');
        } else if (action === 'fill-random') {
            container.querySelectorAll('input').forEach(input => input.value = Math.floor(Math.random() * 10));
        } else if (action === 'identity') {
            if (rows !== cols) {
                displayError("Identity matrix must be square.");
                return;
            }
            for (let i = 1; i <= rows; i++) {
                for (let j = 1; j <= cols; j++) {
                    document.getElementById(`${target}${i}${j}`).value = (i === j) ? '1' : '0';
                }
            }
        } else if (action === 'transpose') {
            // This is a complex action that requires swapping dimensions and values
            alert('Transpose from toolbar is not yet implemented. Please use the operation button.');
        }
    });

    // ★★★ 修正のポイント ★★★
    // ページが読み込まれたときに、最初の行列グリッドを表示するためにこの関数を呼び出す
    updateGrids();
});
