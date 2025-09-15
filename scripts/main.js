document.addEventListener('DOMContentLoaded', () => {
    const rowsInput = document.getElementById('rows');
    const colsInput = document.getElementById('cols');
    const matrixAContainer = document.getElementById('matrix-a-container');
    const matrixBContainer = document.getElementById('matrix-b-container');
    const resultTitle = document.getElementById('result-title-text');
    const resultMatrixDiv = document.getElementById('result-matrix');

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

    // n*n Symbolic Determinant by Cofactor Expansion
    function symbolicDeterminant(matrix) {
        const n = matrix.length;
        if (n === 1) return matrix[0][0];
        if (n === 2) return `((${matrix[0][0]})*(${matrix[1][1]}) - (${matrix[0][1]})*(${matrix[1][0]}))`;
        
        let det = '';
        for (let j = 0; j < n; j++) {
            const sign = (j % 2 === 0) ? '+' : '-';
            const element = matrix[0][j];
            const minor = matrix.slice(1).map(row => row.filter((_, colIndex) => colIndex !== j));
            
            if (j > 0) det += ` ${sign} `;
            else if (sign === '-') det += `${sign} `;
            
            det += `(${element})*(${symbolicDeterminant(minor)})`;
        }
        return det;
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

        if (typeof result === 'string' || typeof result === 'number') {
            resultMatrixDiv.innerHTML = `<span>${math.format(result, {precision: settings.precision})}</span>`;
        } else if (result.values && result.vectors) { // Eigenvalues/vectors
            let html = '<strong>Eigenvalues:</strong><br><span>' + math.format(result.values, {precision: settings.precision}) + '</span><br><br>';
            html += '<strong>Eigenvectors:</strong><table>';
            const vectors = result.vectors.map(v => v.toArray());
            vectors[0].forEach((_, colIndex) => {
                html += '<tr>';
                vectors.forEach(v => {
                    html += `<td>${math.format(v[colIndex], {precision: settings.precision})}</td>`;
                });
                html += '</tr>';
            });
            html += '</table>';
            resultMatrixDiv.innerHTML = html;
        } else if (result.L && result.U) { // LU Decomposition
            displayResult(title + " (L Matrix)", result.L);
            // In a real app, you'd show P as well and have a better UI
        } else if(result.Q && result.R) { // QR Decomposition
            displayResult(title + " (Q Matrix)", result.Q);
        }
        else { // Standard Matrix
             const arrayResult = result.toArray ? result.toArray() : result;
            let tableHTML = '<table>';
            arrayResult.forEach(row => {
                tableHTML += '<tr>';
                row.forEach(cell => {
                    tableHTML += `<td>${math.format(cell, {precision: settings.precision})}</td>`;
                });
                tableHTML += '</tr>';
            });
            tableHTML += '</table>';
            resultMatrixDiv.innerHTML = tableHTML;
        }
    }

    function displayError(error) {
        resultTitle.textContent = 'Error';
        resultMatrixDiv.innerHTML = error.message;
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

            } else if (op === 'scalarMultiply') {
                matrixA = getMatrixValues('a', rows, cols);
                const scalar = document.getElementById('scalar-value').value;
                result = math.evaluate(`A * k`, {A: math.matrix(matrixA), k: scalar});
                title = `Result: ${scalar} × A`;
                saveToHistory({op, matrixA, scalar});

            } else { // Unary and Decomposition
                const targetPrefix = document.getElementById(op === 'lu' || op === 'qr' ? 'decomposition-target' : 'unary-target').value;
                targetMatrix = getMatrixValues(targetPrefix, rows, cols);
                const isNumeric = targetMatrix.flat().every(val => !isNaN(parseFloat(val)) && isFinite(val));
                title = `Result: ${op}(${targetPrefix.toUpperCase()})`;

                if (op === 'det') {
                    if(rows !== cols) throw new Error("Determinant requires a square matrix.");
                    result = isNumeric ? math.det(targetMatrix) : symbolicDeterminant(targetMatrix);
                } else if (op === 'inv') {
                    if(rows !== cols) throw new Error("Inverse requires a square matrix.");
                    if(!isNumeric) throw new Error("Symbolic inverse is only supported for 2x2 matrices in this version.");
                    result = math.inv(targetMatrix);
                } else { // eigs, lu, qr need numeric values
                    if(!isNumeric) throw new Error(`Operation "${op}" requires all matrix elements to be numbers.`);
                    result = math[op](targetMatrix);
                }
                saveToHistory({op, matrix: targetMatrix});
            }
            
            displayResult(title, result);

        } catch (error) {
            displayError(error);
        }
    });

    // Toolbar listeners...
    
    // Restore from history if available
    const restoredState = localStorage.getItem('matrixmaster-restore');
    if (restoredState) {
        const { matrixA, matrixB } = JSON.parse(restoredState);
        const rows = matrixA.length;
        const cols = matrixA[0].length;
        rowsInput.value = rows;
        colsInput.value = cols;
        updateGrids();
        
        for (let i = 1; i <= rows; i++) {
            for (let j = 1; j <= cols; j++) {
                document.getElementById(`a${i}${j}`).value = matrixA[i-1][j-1];
                if(matrixB) document.getElementById(`b${i}${j}`).value = matrixB[i-1][j-1];
            }
        }
        localStorage.removeItem('matrixmaster-restore');
    } else {
        updateGrids(); // Initial Setup
    }
});
