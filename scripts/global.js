// === scripts/global.js (Final Version) ===

// --- Settings Initialization ---
const settings = {
    theme: localStorage.getItem('matrixmaster-theme') || 'theme-hologram',
    precision: parseInt(localStorage.getItem('matrixmaster-precision'), 10) || 4,
    language: localStorage.getItem('matrixmaster-language') || 'ja',
};

document.body.className = settings.theme;

// --- Internationalization (i18n) ---
const translations = {
    ja: {
        calculator_title: "計算機 - MatrixMaster",
        solver_title: "方程式ソルバー - MatrixMaster",
        tutorials_title: "チュートリアル - MatrixMaster",
        history_title: "計算履歴 - MatrixMaster",
        settings_title: "設定 - MatrixMaster",
        nav_calculator: "計算機", nav_solver: "方程式ソルバー", nav_tutorials: "チュートリアル", nav_history: "履歴", nav_settings: "設定",
        control_panel_title: "コントロールパネル", control_rows: "行数", control_cols: "列数",
        op_binary: "二項演算 (A, B)", op_unary: "単項演算", op_scalar: "スカラー演算", op_decomposition: "行列分解",
        op_det: "行列式", op_inv: "逆行列", op_eigs: "固有値/ベクトル", op_lu: "LU分解", op_qr: "QR分解",
        result_title: "計算結果", result_placeholder: "ここに計算結果が表示されます。",
        solver_main_title: "連立一次方程式ソルバー (Ax = b)", solver_size: "式の数（次元）", solver_solve_btn: "解を求める (x)",
        history_main_title: "計算履歴", history_clear_btn: "履歴を全消去",
        settings_main_title: "アプリケーション設定"
    },
    en: {
        calculator_title: "Calculator - MatrixMaster",
        solver_title: "Equation Solver - MatrixMaster",
        tutorials_title: "Tutorials - MatrixMaster",
        history_title: "History - MatrixMaster",
        settings_title: "Settings - MatrixMaster",
        nav_calculator: "Calculator", nav_solver: "Equation Solver", nav_tutorials: "Tutorials", nav_history: "History", nav_settings: "Settings",
        control_panel_title: "Control Panel", control_rows: "Rows", control_cols: "Cols",
        op_binary: "Binary Operations (A, B)", op_unary: "Unary Operations", op_scalar: "Scalar Operations", op_decomposition: "Matrix Decomposition",
        op_det: "Determinant", op_inv: "Inverse", op_eigs: "Eigenvalues/vectors", op_lu: "LU Decomposition", op_qr: "QR Decomposition",
        result_title: "Result", result_placeholder: "Calculation results will be displayed here.",
        solver_main_title: "Linear Equation Solver (Ax = b)", solver_size: "Number of Equations (Dimension)", solver_solve_btn: "Solve for (x)",
        history_main_title: "Calculation History", history_clear_btn: "Clear All History",
        settings_main_title: "Application Settings"
    }
};

function applyLanguage(lang) {
    const langData = translations[lang];
    if (!langData) {
        console.error(`Language data for "${lang}" not found.`);
        return;
    }
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (langData[key]) {
            el.textContent = langData[key];
        }
    });
    
    // ★★★ ここが修正された部分 ★★★
    // document.title とその dataset が存在することを確実にしてから処理する
    if (document.title && document.title.dataset) {
        const titleKey = document.title.dataset.i18n;
        if (titleKey && langData[titleKey]) {
            document.title = langData[titleKey];
        }
    }
}

// --- Background Animation ---
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(settings.language);

    const canvas = document.getElementById('background-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height, gridSpacing = 30, dotSize = 1, mouse = { x: null, y: null };

    function init() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    init();

    window.addEventListener('resize', init);
    window.addEventListener('mousemove', e => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    function animate() {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        
        for (let x = 0; x < width; x += gridSpacing) {
            for (let y = 0; y < height; y += gridSpacing) {
                let dx = mouse.x - x;
                let dy = mouse.y - y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                
                let opacity = Math.max(0, 1 - dist / 300);
                if (settings.theme === 'theme-light') {
                     ctx.fillStyle = `rgba(0, 123, 255, ${opacity * 0.3})`;
                } else {
                     ctx.fillStyle = `rgba(0, 246, 255, ${opacity * 0.3})`;
                }
                ctx.fillRect(x - dotSize, y - dotSize, dotSize * 2, dotSize * 2);
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
});
