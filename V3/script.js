"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const highScoreElement = document.getElementById("highScore");
const gameOverScreen = document.getElementById("gameOverScreen");
const pauseScreen = document.getElementById("pauseScreen");
const finalScoreElement = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");
const scoreBoard = document.getElementById("scoreBoard");

const grid = 20; 
let score = 0;
let level = 1;
let highScore = localStorage.getItem("snakeHighScoreV3") || 0;
highScoreElement.textContent = highScore;

let isGameOver = false;
let isPaused = false;
let inputLocked = false; 

let lastTime = 0;
let accumulator = 0;
const BASE_SPEED = 140; 

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'eat') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'gold') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(); osc.stop(audioCtx.currentTime + 0.4);
    }
}

let snake = { x: 160, y: 160, dx: grid, dy: 0, cells: [], maxCells: 4 };
let apple = { x: 320, y: 320 };
let goldenApple = { x: -grid, y: -grid, active: false, timer: 0 };
let particles = [];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function placeApple() {
    apple.x = getRandomInt(0, canvas.width / grid) * grid;
    apple.y = getRandomInt(0, canvas.height / grid) * grid;
    
    if (!goldenApple.active && Math.random() < 0.15) {
        goldenApple.x = getRandomInt(0, canvas.width / grid) * grid;
        goldenApple.y = getRandomInt(0, canvas.height / grid) * grid;
        goldenApple.active = true;
        goldenApple.timer = 6000;
    }
}

function spawnParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x + grid/2,
            y: y + grid/2,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 1,
            color: color
        });
    }
}

function updateLevel() {
    level = Math.floor(score / 50) + 1;
    levelElement.textContent = level;
}

function resetGame() {
    snake = { x: 160, y: 160, dx: grid, dy: 0, cells: [], maxCells: 4 };
    score = 0; level = 1;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    isGameOver = false; isPaused = false;
    goldenApple.active = false;
    particles = [];
    gameOverScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");
    placeApple();
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    isGameOver = true;
    playSound('die');
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("snakeHighScoreV3", highScore);
        highScoreElement.textContent = highScore;
    }
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove("hidden");
}

function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    if (isPaused) {
        pauseScreen.classList.remove("hidden");
    } else {
        pauseScreen.classList.add("hidden");
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

function gameLoop(timestamp) {
    if (isGameOver || isPaused) return;

    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    accumulator += deltaTime;

    let currentSpeed = Math.max(50, BASE_SPEED - (level * 8));

    if (accumulator >= currentSpeed) {
        accumulator -= currentSpeed;
        
        snake.x += snake.dx;
        snake.y += snake.dy;
        inputLocked = false;

        if (snake.x < 0) snake.x = canvas.width - grid;
        else if (snake.x >= canvas.width) snake.x = 0;
        if (snake.y < 0) snake.y = canvas.height - grid;
        else if (snake.y >= canvas.height) snake.y = 0;

        snake.cells.unshift({x: snake.x, y: snake.y});
        if (snake.cells.length > snake.maxCells) snake.cells.pop();

        for (let i = 1; i < snake.cells.length; i++) {
            if (snake.x === snake.cells[i].x && snake.y === snake.cells[i].y) {
                gameOver();
                return;
            }
        }

        if (snake.x === apple.x && snake.y === apple.y) {
            snake.maxCells++;
            score += 10;
            updateLevel();
            scoreElement.textContent = score;
            playSound('eat');
            spawnParticles(apple.x, apple.y, '#ef4444');
            placeApple();
        }

        if (goldenApple.active && snake.x === goldenApple.x && snake.y === goldenApple.y) {
            snake.maxCells += 2;
            score += 30;
            updateLevel();
            scoreElement.textContent = score;
            playSound('gold');
            spawnParticles(goldenApple.x, goldenApple.y, '#eab308');
            goldenApple.active = false;
        }
    }

    if (goldenApple.active) {
        goldenApple.timer -= deltaTime;
        if (goldenApple.timer <= 0) goldenApple.active = false;
    }

    particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.05;
    });
    particles = particles.filter(p => p.life > 0);

    draw();
    requestAnimationFrame(gameLoop);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (goldenApple.active) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#eab308';
        ctx.fillStyle = (Math.floor(goldenApple.timer / 200) % 2 === 0) ? '#fef08a' : '#eab308'; 
        ctx.beginPath();
        ctx.arc(goldenApple.x + grid/2, goldenApple.y + grid/2, grid/2 - 2, 0, 2*Math.PI);
        ctx.fill();
    }

    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ef4444';
    ctx.fillStyle = '#ef4444'; 
    ctx.beginPath();
    ctx.arc(apple.x + grid/2, apple.y + grid/2, grid/2 - 2, 0, 2*Math.PI);
    ctx.fill();
    ctx.shadowBlur = 10;
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, 2*Math.PI);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    ctx.shadowColor = '#10b981';
    snake.cells.forEach((cell, index) => {
        ctx.fillStyle = index === 0 ? '#34d399' : '#10b981';
        ctx.fillRect(cell.x + 1, cell.y + 1, grid - 2, grid - 2);
    });

    ctx.shadowBlur = 0;
}

function processDirection(dir) {
    if (inputLocked || isPaused) return;

    if (dir === 'LEFT' && snake.dx === 0) {
        snake.dx = -grid; snake.dy = 0; inputLocked = true;
    } else if (dir === 'UP' && snake.dy === 0) {
        snake.dx = 0; snake.dy = -grid; inputLocked = true;
    } else if (dir === 'RIGHT' && snake.dx === 0) {
        snake.dx = grid; snake.dy = 0; inputLocked = true;
    } else if (dir === 'DOWN' && snake.dy === 0) {
        snake.dx = 0; snake.dy = grid; inputLocked = true;
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
        return;
    }
    
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') processDirection('LEFT');
    else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') processDirection('UP');
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') processDirection('RIGHT');
    else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') processDirection('DOWN');
});

let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: true});

canvas.addEventListener('touchend', e => {
    let dx = e.changedTouches[0].screenX - touchStartX;
    let dy = e.changedTouches[0].screenY - touchStartY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) processDirection('RIGHT');
        else if (dx < -30) processDirection('LEFT');
    } else {
        if (dy > 30) processDirection('DOWN');
        else if (dy < -30) processDirection('UP');
    }
}, {passive: true});

restartBtn.addEventListener('click', resetGame);
scoreBoard.addEventListener('click', togglePause);
document.getElementById('left').addEventListener('click', () => processDirection('LEFT'));
document.getElementById('right').addEventListener('click', () => processDirection('RIGHT'));
document.getElementById('up').addEventListener('click', () => processDirection('UP'));
document.getElementById('down').addEventListener('click', () => processDirection('DOWN'));

audioCtx.resume(); 
placeApple();
lastTime = performance.now();
requestAnimationFrame(gameLoop);