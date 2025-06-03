// Sound effects
const moveSound = new Audio('sounds/move.mp3');
const winSound = new Audio('sounds/win.mp3');
const drawSound = new Audio('sounds/draw.mp3');

const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');
const modeSelect = document.getElementById('modeSelect');
const difficultySelect = document.getElementById('difficultySelect');
const difficultyInfo = document.getElementById('difficultyInfo');
const playerWinsEl = document.getElementById('playerWins');
const computerWinsEl = document.getElementById('computerWins');
const drawsEl = document.getElementById('draws');
const playerNames = document.getElementById('playerNames');
const playerXName = document.getElementById('playerXName');
const playerOName = document.getElementById('playerOName');
const themeToggle = document.getElementById('themeToggle');

function setGridInteractivity(isEnabled) {
    cells.forEach(cell => {
        cell.style.pointerEvents = isEnabled ? 'auto' : 'none';
        cell.toggleAttribute('disabled', !isEnabled);
    });
}

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let vsComputer = modeSelect.value === 'computer';
let computerDifficulty = difficultySelect.value;
let autoRestartTimeout = null;
let playerWins = 0;
let computerWins = 0;
let draws = 0;

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

initGame();

function initGame() {
    updateDifficultyInfo();
    updatePlayerNamesVisibility();

    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'win');
        cell.addEventListener('click', handleCellClick);
    });

    modeSelect.addEventListener('change', handleModeChange);
    difficultySelect.addEventListener('change', handleDifficultyChange);
    playerXName.addEventListener('input', updateStatus);
    playerOName.addEventListener('input', updateStatus);
    themeToggle.addEventListener('click', toggleTheme);

    resetGame();
}

function handleCellClick(e) {
    if (!gameActive) return;

    const index = e.target.getAttribute('data-index');
    if (board[index] !== '') return;

    makeMove(index, currentPlayer);

    if (!gameActive) return;

    if (vsComputer && gameActive && currentPlayer === 'O') {
        setGridInteractivity(false);
        setTimeout(() => {
            computerMove();
            setGridInteractivity(true);
        }, 500);
    }
}

function makeMove(index, player) {
    board[index] = player;
    const cell = cells[index];
    cell.textContent = player;
    cell.classList.add(player === 'X' ? 'x' : 'o');

    moveSound.currentTime = 0;
    moveSound.play();

    if (checkWin(player)) {
        highlightWinningCells(player);
        gameActive = false;

        winSound.currentTime = 0;
        winSound.play();

        if (player === 'X') {
            status.textContent = vsComputer ? `${playerXName.value || 'Player X'} wins! 🎉` : `${playerXName.value || 'Player X'} wins! 🎉`;
            playerWins++;
        } else {
            status.textContent = vsComputer ? 'Computer wins! 🤖' : `${playerOName.value || 'Player O'} wins! 🎉`;
            if (vsComputer) computerWins++;
        }

        updateStats();
        scheduleAutoRestart();
        return;
    }

    if (board.every(cell => cell !== '')) {
        gameActive = false;
        status.textContent = "It's a draw! 🤝";
        draws++;

        drawSound.currentTime = 0;
        drawSound.play();

        updateStats();
        scheduleAutoRestart();
        return;
    }

    currentPlayer = player === 'X' ? 'O' : 'X';
    updateStatus();
}

function scheduleAutoRestart() {
    if (autoRestartTimeout) clearTimeout(autoRestartTimeout);
    autoRestartTimeout = setTimeout(() => {
        resetGame();
        autoRestartTimeout = null;
    }, 1500);
}

function checkWin(player) {
    return winningConditions.some(condition => {
        const [a, b, c] = condition;
        return board[a] === player && board[b] === player && board[c] === player;
    });
}

function highlightWinningCells(player) {
    winningConditions.forEach(condition => {
        const [a, b, c] = condition;
        if (board[a] === player && board[b] === player && board[c] === player) {
            cells[a].classList.add('win');
            cells[b].classList.add('win');
            cells[c].classList.add('win');
        }
    });
}

function updateStatus() {
    if (currentPlayer === 'X') {
        status.textContent = `${playerXName.value || 'Player X'}'s turn`;
    } else {
        status.textContent = vsComputer && currentPlayer === 'O' ? "Computer's turn" : `${playerOName.value || 'Player O'}'s turn`;
    }
}

function computerMove() {
    if (!gameActive) return;

    let move;

    switch (computerDifficulty) {
        case 'easy':
            move = getRandomMove();
            break;
        case 'medium':
            move = getWinningMove('O') || getBlockingMove() || getRandomMove();
            break;
        case 'hard':
            move = getWinningMove('O') || getBlockingMove() || getStrategicMove() || getRandomMove();
            break;
        default:
            move = getRandomMove();
    }

    if (move !== null) makeMove(move, 'O');
}

function getRandomMove() {
    const emptyIndices = board.map((val, idx) => val === '' ? idx : null).filter(i => i !== null);
    if (emptyIndices.length === 0) return null;
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

function getWinningMove(symbol) {
    for (const condition of winningConditions) {
        const [a, b, c] = condition;
        if (board[a] === symbol && board[b] === symbol && board[c] === '') return c;
        if (board[a] === symbol && board[c] === symbol && board[b] === '') return b;
        if (board[b] === symbol && board[c] === symbol && board[a] === '') return a;
    }
    return null;
}

function getBlockingMove() {
    return getWinningMove('X');
}

function getStrategicMove() {
    if (board[4] === '') return 4;
    const corners = [0, 2, 6, 8];
    const emptyCorners = corners.filter(index => board[index] === '');
    if (emptyCorners.length > 0) return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
    const edges = [1, 3, 5, 7];
    const emptyEdges = edges.filter(index => board[index] === '');
    if (emptyEdges.length > 0) return emptyEdges[Math.floor(Math.random() * emptyEdges.length)];
    return null;
}

function resetGame() {
    if (autoRestartTimeout) {
        clearTimeout(autoRestartTimeout);
        autoRestartTimeout = null;
        setGridInteractivity(true);
    }

    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;

    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'win');
    });

    vsComputer = modeSelect.value === 'computer';
    computerDifficulty = difficultySelect.value;
    updateStatus();

    if (vsComputer && currentPlayer === 'O') {
        setTimeout(computerMove, 500);
    }
}

function newGame() {
    playerWins = 0;
    computerWins = 0;
    draws = 0;
    updateStats();
    resetGame();
}

function updateStats() {
    playerWinsEl.textContent = playerWins;
    computerWinsEl.textContent = computerWins;
    drawsEl.textContent = draws;
}

function handleModeChange() {
    vsComputer = modeSelect.value === 'computer';
    updatePlayerNamesVisibility();
    resetGame();
}

function handleDifficultyChange() {
    computerDifficulty = difficultySelect.value;
    updateDifficultyInfo();
    resetGame();
}

function updatePlayerNamesVisibility() {
    playerNames.style.display = vsComputer ? 'none' : 'flex';
}

function updateDifficultyInfo() {
    let info = '';
    switch (computerDifficulty) {
        case 'easy':
            info = 'Easy AI: Computer makes random moves';
            break;
        case 'medium':
            info = 'Medium AI: Computer will block wins and try to win';
            break;
        case 'hard':
            info = 'Hard AI: Computer uses advanced strategy to win';
            break;
    }
    difficultyInfo.textContent = info;
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
}

loadTheme();
