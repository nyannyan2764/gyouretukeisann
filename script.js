// ボタン要素を取得
const addButton = document.getElementById('addButton');
const multiplyButton = document.getElementById('multiplyButton');

// 結果表示エリアを取得
const resultDiv = document.getElementById('result');

/**
 * HTMLの入力欄から値を取得し、2x2の行列（2次元配列）として返す関数
 * @param {string} prefix - 行列のIDの接頭辞 ('a' または 'b')
 * @returns {Array<Array<number>>} 2x2の行列
 */
function getMatrixValues(prefix) {
    const values = [];
    for (let i = 1; i <= 2; i++) {
        const row = [];
        for (let j = 1; j <= 2; j++) {
            const id = `${prefix}${i}${j}`;
            const value = parseFloat(document.getElementById(id).value);
            if (isNaN(value)) {
                throw new Error('すべての入力欄に数値を入力してください。');
            }
            row.push(value);
        }
        values.push(row);
    }
    return values;
}

/**
 * 計算結果の行列（配列）をHTMLのテーブル形式で整形して表示する関数
 * @param {Array<Array<number>>} resultMatrix - 計算結果の2次元配列
 */
function displayResult(resultMatrix) {
    // .toArray() を削除し、引数をそのまま使う！
    let tableHTML = '<table style="margin: 0 auto; border-spacing: 15px;">';
    resultMatrix.forEach(row => {
        tableHTML += '<tr>';
        row.forEach(cell => {
            const roundedCell = Math.round(cell * 100) / 100;
            tableHTML += `<td style="padding: 10px;">${roundedCell}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</table>';
    
    resultDiv.innerHTML = tableHTML;
}

// 「和を計算」ボタンがクリックされたときの処理
addButton.addEventListener('click', () => {
    try {
        const matrixA = getMatrixValues('a');
        const matrixB = getMatrixValues('b');

        // math.jsを使って行列の和を計算
        const result = math.add(matrixA, matrixB);

        // 結果を表示
        displayResult(result);

    } catch (error) {
        resultDiv.innerHTML = `<span style="color: red;">${error.message}</span>`;
    }
});

// 「積を計算」ボタンがクリックされたときの処理
multiplyButton.addEventListener('click', () => {
    try {
        const matrixA = getMatrixValues('a');
        const matrixB = getMatrixValues('b');

        // math.jsを使って行列の積を計算
        const result = math.multiply(matrixA, matrixB);
        
        // 結果を表示
        displayResult(result);

    } catch (error) {
        resultDiv.innerHTML = `<span style="color: red;">${error.message}</span>`;
    }
});