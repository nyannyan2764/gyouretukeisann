document.addEventListener('DOMContentLoaded', () => {
    const historyList = document.getElementById('history-list');
    const clearButton = document.getElementById('clear-history');

    function loadHistory() {
        historyList.innerHTML = ''; // Clear current list
        const history = JSON.parse(localStorage.getItem('matrixmaster-history')) || [];

        if (history.length === 0) {
            historyList.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">計算履歴はありません。</p>`;
            return;
        }

        history.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';
            
            let opText = '';
            if(item.op === 'add') opText = 'A + B';
            else if (item.op === 'multiply') opText = 'A × B';
            else if (item.op === 'scalarMultiply') opText = `${item.scalar} × A`;
            else opText = `${item.op}(${item.matrix ? 'M' : ''})`;

            el.innerHTML = `
                <span class="history-op">${opText}</span>
                <span class="history-date">${new Date(item.id).toLocaleString()}</span>
                <button class="tool-btn restore-btn" data-id="${item.id}">復元</button>
            `;
            historyList.appendChild(el);
        });
    }

    clearButton.addEventListener('click', () => {
        if (confirm('本当にすべての履歴を消去しますか？')) {
            localStorage.removeItem('matrixmaster-history');
            loadHistory();
        }
    });

    historyList.addEventListener('click', (e) => {
        if (e.target.matches('.restore-btn')) {
            const id = parseInt(e.target.dataset.id, 10);
            const history = JSON.parse(localStorage.getItem('matrixmaster-history')) || [];
            const itemToRestore = history.find(item => item.id === id);

            if (itemToRestore) {
                const state = {
                    matrixA: itemToRestore.matrixA || itemToRestore.matrix,
                    matrixB: itemToRestore.matrixB
                };
                localStorage.setItem('matrixmaster-restore', JSON.stringify(state));
                window.location.href = './index.html';
            }
        }
    });

    loadHistory();
});
