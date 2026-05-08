const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreElement = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");

const grid = 20; 
let count = 0;
let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;
highScoreElement.textContent = highScore;
let isGameOver = false;

let snake = {
    x: 160,
    y: 160,
    dx: grid,
    dy: 0,
    cells: [],
    maxCells: 4
};

let apple = { x: 320, y: 320 };

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function placeApple() {
    apple.x = getRandomInt(0, canvas.width / grid) * grid;
    apple.y = getRandomInt(0, canvas.height / grid) * grid;
}

function resetGame() {
    snake.x = 160;
    snake.y = 160;
    snake.cells = [];
    snake.maxCells = 4;
    snake.dx = grid;
    snake.dy = 0;
    score = 0;
    scoreElement.textContent = score;
    isGameOver = false;
    gameOverScreen.classList.add("hidden");
    placeApple();
    requestAnimationFrame(update);
}

function gameOver() {
    isGameOver = true;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("snakeHighScore", highScore);
        highScoreElement.textContent = highScore;
    }
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove("hidden");
}

function update() {
    if (isGameOver) return;

    if (++count < 6) {
        requestAnimationFrame(update);
        return;
    }
    count = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    snake.x += snake.dx;
    snake.y += snake.dy;

    if (snake.x < 0) snake.x = canvas.width - grid;
    else if (snake.x >= canvas.width) snake.x = 0;
    if (snake.y < 0) snake.y = canvas.height - grid;
    else if (snake.y >= canvas.height) snake.y = 0;

    snake.cells.unshift({x: snake.x, y: snake.y});
    if (snake.cells.length > snake.maxCells) {
        snake.cells.pop();
    }

    ctx.fillStyle = '#ef4444'; 
    ctx.beginPath();
    ctx.arc(apple.x + grid/2, apple.y + grid/2, grid/2 - 2, 0, 2*Math.PI);
    ctx.fill();

    snake.cells.forEach((cell, index) => {

        ctx.fillStyle = index === 0 ? '#10b981' : '#34d399';
        
        ctx.fillRect(cell.x + 1, cell.y + 1, grid - 2, grid - 2);

        if (cell.x === apple.x && cell.y === apple.y) {
            snake.maxCells++;
            score += 10;
            scoreElement.textContent = score;
            placeApple();
        }

        for (let i = index + 1; i < snake.cells.length; i++) {
            if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
                gameOver();
            }
        }
    });

    if (!isGameOver) {
        requestAnimationFrame(update);
    }
}

function changeDirection(e) {
    if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && snake.dx === 0) {
        snake.dx = -grid;
        snake.dy = 0;
    } else if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && snake.dy === 0) {
        snake.dx = 0;
        snake.dy = -grid;
    } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && snake.dx === 0) {
        snake.dx = grid;
        snake.dy = 0;
    } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && snake.dy === 0) {
        snake.dx = 0;
        snake.dy = grid;
    }
}

document.addEventListener('keydown', changeDirection);
restartBtn.addEventListener('click', resetGame);

const handleBtnClick = (dx, dy) => {
    if (dx !== 0 && snake.dx === 0) {
        snake.dx = dx; snake.dy = dy;
    } else if (dy !== 0 && snake.dy === 0) {
        snake.dx = dx; snake.dy = dy;
    }
};

document.getElementById('left').addEventListener('click', () => handleBtnClick(-grid, 0));
document.getElementById('right').addEventListener('click', () => handleBtnClick(grid, 0));
document.getElementById('up').addEventListener('click', () => handleBtnClick(0, -grid));
document.getElementById('down').addEventListener('click', () => handleBtnClick(0, grid));

placeApple();
requestAnimationFrame(update);