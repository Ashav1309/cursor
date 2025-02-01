const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 20;
const tetrominoSequence = [];

// Игровое поле
const playfield = Array(20).fill().map(() => Array(12).fill(0));

// Фигуры тетромино
const tetrominos = {
    'I': [
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0]
    ],
    'J': [
        [1,0,0],
        [1,1,1],
        [0,0,0],
    ],
    'L': [
        [0,0,1],
        [1,1,1],
        [0,0,0],
    ],
    'O': [
        [1,1],
        [1,1],
    ],
    'S': [
        [0,1,1],
        [1,1,0],
        [0,0,0],
    ],
    'Z': [
        [1,1,0],
        [0,1,1],
        [0,0,0],
    ],
    'T': [
        [0,1,0],
        [1,1,1],
        [0,0,0],
    ]
};

let count = 0;
let tetromino = getNextTetromino();
let rAF = null;  
let gameOver = false;
let score = 0;
let isPaused = false;
let isSoundEnabled = true;
let level = 1;
let speed = 35; // Начальная скорость падения
const maxLevel = 10;

// Генерация случайной фигуры
function getNextTetromino() {
    if (tetrominoSequence.length === 0) {
        const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
        while (sequence.length) {
            const rand = Math.floor(Math.random() * sequence.length);
            tetrominoSequence.push(sequence.splice(rand, 1)[0]);
        }
    }

    const name = tetrominoSequence.pop();
    const matrix = tetrominos[name];

    const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
    const row = name === 'I' ? -1 : -2;

    return {
        name: name,
        matrix: matrix,
        row: row,
        col: col
    };
}

// Основной игровой цикл
function loop() {
    if (!isPaused) {
        rAF = requestAnimationFrame(loop);
        context.clearRect(0,0,canvas.width,canvas.height);

        // Отрисовка поля
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 12; col++) {
                if (playfield[row][col]) {
                    context.fillStyle = '#000';
                    // Рисуем блоки в стиле LCD
                    context.fillRect(col * grid + 1, row * grid + 1, grid - 2, grid - 2);
                    context.strokeStyle = '#a8b298';
                    context.strokeRect(col * grid + 2, row * grid + 2, grid - 4, grid - 4);
                }
            }
        }

        // Отрисовка текущей фигуры
        if (tetromino) {
            if (++count > speed) {
                tetromino.row++;
                count = 0;

                if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
                    tetromino.row--;
                    placeTetromino();
                }
            }

            context.fillStyle = '#000';

            for (let row = 0; row < tetromino.matrix.length; row++) {
                for (let col = 0; col < tetromino.matrix[row].length; col++) {
                    if (tetromino.matrix[row][col]) {
                        // Рисуем блоки в стиле LCD
                        context.fillRect((tetromino.col + col) * grid + 1,
                                       (tetromino.row + row) * grid + 1,
                                       grid - 2, grid - 2);
                        context.strokeStyle = '#a8b298';
                        context.strokeRect((tetromino.col + col) * grid + 2,
                                          (tetromino.row + row) * grid + 2,
                                          grid - 4, grid - 4);
                    }
                }
            }
        }
    }
}

// Обработчики кнопок
document.addEventListener('keydown', function(e) {
    if (gameOver) return;

    if (e.which === 37 || e.which === 39) {
        const col = e.which === 37
            ? tetromino.col - 1
            : tetromino.col + 1;

        if (isValidMove(tetromino.matrix, tetromino.row, col)) {
            tetromino.col = col;
        }
    }

    if (e.which === 38) {
        const matrix = rotate(tetromino.matrix);
        if (isValidMove(matrix, tetromino.row, tetromino.col)) {
            tetromino.matrix = matrix;
        }
    }

    if(e.which === 40) {
        const row = tetromino.row + 1;

        if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
            tetromino.row = row - 1;
            placeTetromino();
            return;
        }

        tetromino.row = row;
    }
});

// Добавляем обработчики для кнопок управления
document.getElementById('left').addEventListener('click', () => {
    if (isValidMove(tetromino.matrix, tetromino.row, tetromino.col - 1)) {
        tetromino.col -= 1;
    }
});

document.getElementById('right').addEventListener('click', () => {
    if (isValidMove(tetromino.matrix, tetromino.row, tetromino.col + 1)) {
        tetromino.col += 1;
    }
});

document.getElementById('rotate').addEventListener('click', () => {
    const matrix = rotate(tetromino.matrix);
    if (isValidMove(matrix, tetromino.row, tetromino.col)) {
        tetromino.matrix = matrix;
    }
});

document.getElementById('down').addEventListener('click', () => {
    if (isValidMove(tetromino.matrix, tetromino.row + 1, tetromino.col)) {
        tetromino.row += 1;
    }
});

// Запуск игры
document.getElementById('start').addEventListener('click', () => {
    if (gameOver) {
        reset();
    }
    if (!rAF) {
        rAF = requestAnimationFrame(loop);
    }
});

// Обработчик паузы
document.getElementById('pause').addEventListener('click', () => {
    if (!gameOver) {
        isPaused = !isPaused;
        if (isPaused) {
            cancelAnimationFrame(rAF);
            context.fillStyle = 'black';
            context.globalAlpha = 0.75;
            context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
            context.globalAlpha = 1;
            context.fillStyle = 'white';
            context.font = '16px monospace';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('ПАУЗА', canvas.width / 2, canvas.height / 2);
        } else {
            rAF = requestAnimationFrame(loop);
        }
    }
});

// Обработчик звука
document.getElementById('sound').addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
});

// Добавляем обработчики для кнопок уровня
document.getElementById('level-up').addEventListener('click', () => {
    if (!gameOver && !isPaused) {
        changeLevel(1);
    }
});

document.getElementById('level-down').addEventListener('click', () => {
    if (!gameOver && !isPaused) {
        changeLevel(-1);
    }
});

// Вспомогательные функции
function rotate(matrix) {
    const N = matrix.length - 1;
    const result = matrix.map((row, i) =>
        row.map((val, j) => matrix[N - j][i])
    );
    return result;
}

function isValidMove(matrix, cellRow, cellCol) {
    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col] && (
                cellCol + col < 0 ||
                cellCol + col >= playfield[0].length ||
                cellRow + row >= playfield.length ||
                playfield[cellRow + row][cellCol + col])
            ) {
                return false;
            }
        }
    }
    return true;
}

function placeTetromino() {
    for (let row = 0; row < tetromino.matrix.length; row++) {
        for (let col = 0; col < tetromino.matrix[row].length; col++) {
            if (tetromino.matrix[row][col]) {
                if (tetromino.row + row < 0) {
                    return showGameOver();
                }
                playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
            }
        }
    }

    // Проверка заполненных линий
    for (let row = playfield.length - 1; row >= 0; ) {
        if (playfield[row].every(cell => !!cell)) {
            score += 10 * level; // Очки зависят от уровня
            document.getElementById('score').textContent = score;
            
            for (let r = row; r >= 0; r--) {
                for (let c = 0; c < playfield[r].length; c++) {
                    playfield[r][c] = playfield[r-1][c];
                }
            }
        }
        else {
            row--;
        }
    }

    tetromino = getNextTetromino();
}

function showGameOver() {
    cancelAnimationFrame(rAF);
    gameOver = true;
    
    context.fillStyle = 'black';
    context.globalAlpha = 0.75;
    context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
    
    context.globalAlpha = 1;
    context.fillStyle = 'white';
    context.font = '16px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('ИГРА ОКОНЧЕНА!', canvas.width / 2, canvas.height / 2);
}

function reset() {
    for (let row = 0; row < playfield.length; row++) {
        for (let col = 0; col < playfield[row].length; col++) {
            playfield[row][col] = 0;
        }
    }
    score = 0;
    level = 1;
    speed = 35;
    document.getElementById('score').textContent = '0';
    document.getElementById('level').textContent = '1';
    gameOver = false;
    tetromino = getNextTetromino();
}

// Начальный запуск
rAF = requestAnimationFrame(loop);

// Функция изменения уровня
function changeLevel(change) {
    const newLevel = level + change;
    if (newLevel >= 1 && newLevel <= maxLevel) {
        level = newLevel;
        speed = Math.max(35 - (level - 1) * 3, 5); // Уменьшаем задержку с каждым уровнем
        document.getElementById('level').textContent = level;
    }
} 
