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
    
    // ★★★ ここが修正された displayResult 関数 ★★★
    function displayResult(title, result, rawHtml = false) {
        resultTitle.textContent = title;
        resultMatrixDiv.innerHTML = '';
        resultMatrixDiv.classList.remove('error');
        window.lastResult = result;
        
        const resultContainer = document.querySelector('.result-display-container');
        if(resultContainer) {
            resultContainer.classList.remove('glitch-in');
            void resultContainer.offsetWidth;
            resultContainer.classList.add('glitch-in');
        }

        if (rawHtml) {
            resultMatrixDiv.innerHTML = result;
            return;
        }
        
        if (typeof result === 'object' && result !== null && result.eigenvectors && result.values) {
            let html = '<strong>Eigenvalues:</strong><br><span>' + math.format(result.values, {precision: settings.precision}) + '</span><br><br>';
            // .toArray() を削除し、転置してベクトルを列として表示
            const vectorsAsColumns = math.transpose(result.eigenvectors);
            html += '<strong>Eigenvectors (as columns):</strong>' + renderMatrixAsTable(vectorsAsColumns);
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
        const resultContainer = document.querySelector('.result-display-container');
        if(resultContainer) resultContainer.classList.add('glitch-in');
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
                // ... (Binary operations code is correct)
            } else if (op === 'scalarMultiply') {
                // ... (Scalar operation code is correct)
            } else { // Unary, Decomposition, and other new features
                const targetPrefix = document.getElementById(op === 'lu' || op === 'qr' ? 'decomposition-target' : 'unary-target').value;
                targetMatrix = getMatrixValues(targetPrefix, rows, cols);
                const isNumeric = targetMatrix.flat().every(val => !isNaN(parseFloat(val)) && isFinite(val));
                title = `Result: ${op}(${targetPrefix.toUpperCase()})`;

                if (isNumeric) {
                    if ((op === 'det' || op === 'inv' || op === 'eigs' || op === 'lu' || op === 'trace' || op === 'rank') && rows !== cols) {
                        if(op !== 'rank') throw new Error(`Operation "${op}" requires a square matrix.`);
                    }
                    result = math[op](targetMatrix);
                } else { // Symbolic Calculation
                    if (rows !== cols) throw new Error("Symbolic calculation requires a square matrix.");
                    if (op === 'det') result = symbolicDeterminant(targetMatrix);
                    else if (op === 'inv') {
                        const invResult = symbolicInverse(targetMatrix);
                        displayResult(title, `<span>1 / ${invResult.determinant}</span>` + renderMatrixAsTable(invResult.adjugate), true);
                        saveToHistory({op, matrix: targetMatrix});
                        playSound('audio-calculate');
                        return;
                    } 
                    else if (op === 'transpose') result = math.transpose(targetMatrix);
                    else if (op === 'trace') result = symbolicTrace(targetMatrix);
                    else if (op === 'eigs') {
                        title = `Result: Characteristic Polynomial det(A - \u03BBI)`;
                        result = symbolicCharacteristicPolynomial(targetMatrix);
                    } else {
                        throw new Error(`Symbolic calculation for "${op}" is not supported.`);
                    }
                }
            }
            saveToHistory({op, matrixA, matrixB, matrix: targetMatrix, scalar: document.getElementById('scalar-value')?.value});
            displayResult(title, result);
            playSound('audio-calculate');
        } catch (error) {
            displayError(error);
        }
    });

    // Toolbar listeners
    // ... (Toolbar listener code is correct)

    // Copy LaTeX listener
    // ... (Copy LaTeX listener code is correct)

    // Restore from history or tutorial if available
    const restoredState = localStorage.getItem('matrixmaster-restore');
    if (restoredState) {
        // ... (Restore logic is correct)
    } else {
        updateGrids(); // Initial Setup on first visit
    }
});
