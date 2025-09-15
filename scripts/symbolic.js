// === scripts/symbolic.js ===

/**
 * n×n行列の記号行列式を余因子展開で計算する再帰関数
 * @param {Array<Array<string>>} matrix 
 * @returns {string} 行列式を表す文字列
 */
function symbolicDeterminant(matrix) {
    const n = matrix.length;
    if (n === 1) return matrix[0][0];
    if (n === 2) return `((${matrix[0][0]})*(${matrix[1][1]}) - (${matrix[0][1]})*(${matrix[1][0]}))`;

    let det = '';
    for (let j = 0; j < n; j++) {
        const sign = (j % 2 === 0) ? '+' : '-';
        const element = matrix[0][j];
        const minorMatrix = matrix.slice(1).map(row => row.filter((_, colIndex) => colIndex !== j));
        
        if (j > 0) det += ` ${sign} `;
        else if (sign === '-') det += `${sign} `;
        
        det += `(${element})*(${symbolicDeterminant(minorMatrix)})`;
    }
    return `(${det})`;
}

/**
 * n×n行列の記号逆行列を余因子行列を使って計算する関数
 * @param {Array<Array<string>>} matrix 
 * @returns {object} { determinant: string, adjugate: Array<Array<string>> }
 */
function symbolicInverse(matrix) {
    const n = matrix.length;
    if (n === 0) return null;
    if (n !== matrix[0].length) throw new Error("Inverse requires a square matrix.");

    const determinant = symbolicDeterminant(matrix);

    // 余因子行列 (Matrix of Cofactors) を作成
    const cofactorMatrix = [];
    for (let i = 0; i < n; i++) {
        const cofactorRow = [];
        for (let j = 0; j < n; j++) {
            // 小行列を作成 (i行とj列を取り除く)
            const minorMatrix = matrix
                .filter((_, rowIndex) => rowIndex !== i)
                .map(row => row.filter((_, colIndex) => colIndex !== j));
            
            // 符号を決定
            const sign = ((i + j) % 2 === 0) ? '' : '-';
            
            // 小行列式を計算して余因子を追加
            const cofactor = `${sign}(${symbolicDeterminant(minorMatrix)})`;
            cofactorRow.push(cofactor);
        }
        cofactorMatrix.push(cofactorRow);
    }

    // 余因子行列を転置して、余因子行列 (Adjugate Matrix) を得る
    const adjugateMatrix = math.transpose(cofactorMatrix);

    return {
        determinant: determinant,
        adjugate: adjugateMatrix
    };
}
