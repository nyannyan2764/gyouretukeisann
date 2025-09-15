document.addEventListener('DOMContentLoaded', () => {
    const sizeInput = document.getElementById('size');
    const matrixAContainer = document.getElementById('matrix-a-container');
    const vectorBContainer = document.getElementById('vector-b-container');
    const solveButton = document.getElementById('solve-button');
    const resultTitle = document.getElementById('result-title-text');
    const resultMatrixDiv = document.getElementById('result-matrix');

    function createSolverGrids() {
        const size = parseInt(sizeInput.value, 10);
        if (isNaN(size) || size < 2) return;

        matrixAContainer.innerHTML = '';
        matrixAContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        for (let i = 1; i <= size; i++) {
            for (let j = 1; j <= size; j++) {
                const input = document.createElement('input');
                input.type = 'text';
                input.id = `a${i}${j}`;
                input.placeholder = `a${i},${j}`;
                matrixAContainer.appendChild(input);
            }
        }

        vectorBContainer.innerHTML = '';
        vectorBContainer.style.gridTemplateColumns = '1fr';
        for (let i = 1; i <= size; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `b${i}`;
            input.placeholder = `b${i}`;
            vectorBContainer.appendChild(input);
        }
    }

    function getSolverValues() {
        const size = parseInt(sizeInput.value, 10);
        const matrixA = [];
        const vectorB = [];

        for (let i = 1; i <= size; i++) {
            const row = [];
            for (let j = 1; j <= size; j++) {
                const val = document.getElementById(`a${i}${j}`).value.trim();
                if (val === '') throw new Error(`Matrix A has an empty cell at (${i},${j}).`);
                row.push(val);
            }
            matrixA.push(row);
        }

        for (let i = 1; i <= size; i++) {
            const val = document.getElementById(`b${i}`).value.trim();
            if (val === '') throw new Error(`Vector b has an empty cell at (${i}).`);
            vectorB.push(val);
        }
        return { matrixA, vectorB };
    }
    
    // --- History (main.jsから移植) ---
    function saveToHistory(entry) {
        let history = JSON.parse(localStorage.getItem('matrixmaster-history')) || [];
        entry.id = Date.now();
        history.unshift(entry);
        if (history.length > 50) history.pop();
        localStorage.setItem('matrixmaster-history', JSON.stringify(history));
    }

    solveButton.addEventListener('click', () => {
        try {
            const { matrixA, vectorB } = getSolverValues();
            const isNumeric = matrixA.flat().concat(vectorB).every(val => !isNaN(parseFloat(val)) && isFinite(val));
            if (!isNumeric) {
                throw new Error("Equation solver requires all elements to be numbers.");
            }

            // ★★★ ここが修正された計算部分 ★★★
            const lup = math.lup(matrixA);
            const result = math.lusolve(lup, vectorB);

            resultTitle.textContent = "Solution Vector x";
            resultMatrixDiv.classList.remove('error');
            
            // ★★★ 結果表示を改善 ★★★
            let tableHTML = '<table>';
            result.toArray().forEach((val, index) => {
                tableHTML += `<tr><td style="text-align: right; padding-right: 10px;">x${index + 1} =</td><td style="text-align: left;">${math.format(val, {precision: settings.precision})}</td></tr>`;
            });
            tableHTML += '</table>';
            resultMatrixDiv.innerHTML = tableHTML;
            
            // ★★★ 履歴保存機能を追加 ★★★
            saveToHistory({op: 'solve Ax=b', matrixA, vectorB });

        } catch (error) {
            resultTitle.textContent = 'Error';
            resultMatrixDiv.innerHTML = error.message;
            resultMatrixDiv.classList.add('error');
        }
    });

    sizeInput.addEventListener('change', createSolverGrids);
    
    // Restore from tutorial if available
    const restoredState = localStorage.getItem('matrixmaster-solver-restore');
    if (restoredState) {
        const { matrixA, vectorB, size } = JSON.parse(restoredState);
        sizeInput.value = size;
        createSolverGrids();

        for (let i = 1; i <= size; i++) {
            for (let j = 1; j <= size; j++) {
                document.getElementById(`a${i}${j}`).value = matrixA[i - 1][j - 1];
            }
            document.getElementById(`b${i}`).value = vectorB[i - 1];
        }
        localStorage.removeItem('matrixmaster-solver-restore');
    } else {
        createSolverGrids(); // Initial setup
    }
});
