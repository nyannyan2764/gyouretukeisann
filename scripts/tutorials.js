document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', (e) => {
        const button = e.target.closest('.example-loader');
        if (!button) return;

        const exampleData = button.dataset.example;
        const solverExampleData = button.dataset.solverExample;
        const targetPage = button.dataset.targetPage || './index.html';

        if (exampleData) {
            localStorage.setItem('matrixmaster-restore', exampleData);
        } else if (solverExampleData) {
            localStorage.setItem('matrixmaster-solver-restore', solverExampleData);
        }
        
        // ローカルストレージにデータが保存されるのを待ってからページ遷移
        setTimeout(() => {
            window.location.href = targetPage;
        }, 100); // 100msの遅延
    });
});
