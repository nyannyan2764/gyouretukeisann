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

        // Create Matrix A grid
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

        // Create Vector B grid
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

    solveButton.addEventListener('click', () => {
        try {
            const { matrixA, vectorB } = getSolverValues();
            const isNumeric = matrixA.flat().concat(vectorB).every(val => !isNaN(parseFloat(val)) && isFinite(val));
            if (!isNumeric) {
                throw new Error("Equation solver requires all elements to be numbers.");
            }

            const result = math.lusolve(matrixA, vectorB);

            resultTitle.textContent = "Solution Vector x";
            resultMatrixDiv.classList.remove('error');
            
            let tableHTML = '<table>';
            result.toArray().forEach(val => {
                tableHTML += `<tr><td>${math.format(val, {precision: settings.precision})}</td></tr>`;
            });
            tableHTML += '</table>';
            resultMatrixDiv.innerHTML = tableHTML;

        } catch (error) {
            resultTitle.textContent = 'Error';
            resultMatrixDiv.innerHTML = error.message;
            resultMatrixDiv.classList.add('error');
        }
    });

    sizeInput.addEventListener('change', createSolverGrids);
    createSolverGrids(); // Initial setup
});
