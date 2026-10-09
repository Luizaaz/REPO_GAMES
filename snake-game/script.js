
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
];

let dx = 1, dy = 0;
let nextDx = 1, nextDy = 0;

let food = { x: 5, y: 5 };
let specialFood = { x: -1, y: -1, active: false, timer: 0 };

let portal = { axis: "h", pos1: 5, pos2: 12, timer: 0 };
let obstacle = { x: -1, y: -1, timer: 0 };

let score = 0;
let topScore = Number(localStorage.getItem("byteSnakeScore")) || 0;
let topInitials = localStorage.getItem("byteSnakeInitials") || "---";

let lastTime = 0;
let moveTimer = 0;
const speed = 0.18;

document.getElementById("high-score").textContent = topScore;
document.getElementById("high-score-initials").textContent = topInitials;

// =============================
// MOVIMENTAÇÃO DO JOGO
// =============================

function update(dt) {
    moveTimer += dt;

    if (specialFood.active) {
        specialFood.timer -= dt;

        if (specialFood.timer <= 0) {
            specialFood.active = false;
        }
    }

    portal.timer -= dt;
    if (portal.timer <= 0) spawnPortal();

    obstacle.timer -= dt;
    if (obstacle.timer <= 0) spawnObstacle();

    if (moveTimer < speed) return;

    moveTimer = 0;

    dx = nextDx;
    dy = nextDy;

    if (dx === 0 && dy === 0) return;

    let head = {
        x: snake[0].x + dx,
        y: snake[0].y + dy
    };

    let enteredPortal = false;

    // Portais nas bordas
    if (portal.axis === "h") {
        if (head.x < 0 && head.y === portal.pos1) {
            head.x = tileCount - 1;
            head.y = portal.pos2;
            enteredPortal = true;
        } else if (head.x >= tileCount && head.y === portal.pos2) {
            head.x = 0;
            head.y = portal.pos1;
            enteredPortal = true;
        }
    } else {
        if (head.y < 0 && head.x === portal.pos1) {
            head.y = tileCount - 1;
            head.x = portal.pos2;
            enteredPortal = true;
        } else if (head.y >= tileCount && head.x === portal.pos2) {
            head.y = 0;
            head.x = portal.pos1;
            enteredPortal = true;
        }
    }

    // Colisão com as paredes
    if (
        !enteredPortal &&
        (head.x < 0 || head.x >= tileCount ||
         head.y < 0 || head.y >= tileCount)
    ) {
        return gameOver();
    }

    const eating =
        head.x === food.x && head.y === food.y;

    const eatingSpecial =
        specialFood.active &&
        head.x === specialFood.x &&
        head.y === specialFood.y;

    // Permite entrar na posição da cauda se ela for se mover
    const bodyToCheck = eating || eatingSpecial
        ? snake
        : snake.slice(0, -1);

    const hitSelf = bodyToCheck.some(
        part => part.x === head.x && part.y === head.y
    );

    if (hitSelf || isObstacle(head.x, head.y)) {
        return gameOver();
    }

    snake.unshift(head);

    if (eating) {
        score += 10;
        document.getElementById("score").textContent = score;

        spawnFood();

        if (!specialFood.active && Math.random() < 0.2) {
            spawnSpecialFood();
        }
    } else if (eatingSpecial) {
        score += 30;
        document.getElementById("score").textContent = score;
        specialFood.active = false;
    } else {
        snake.pop();
    }
}

// =============================
// DESENHO DO JOGO
// =============================

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo
    ctx.fillStyle = "#117a91ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grama na parte inferior
    ctx.fillStyle = "#2f481dff";
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

    // Quadradinhos da grama
    for (let x = 0; x < tileCount; x++) {
        for (let y = 17; y < tileCount; y++) {
            if ((x + y) % 2 === 0) {
                ctx.fillStyle = "rgba(40, 180, 25, 0.25)";
                ctx.fillRect(
                    x * gridSize,
                    y * gridSize,
                    gridSize,
                    gridSize
                );
            }
        }
    }

    // Portais
    ctx.shadowBlur = 8;

    if (portal.axis === "h") {
        ctx.fillStyle = "#00d4ff";
        ctx.shadowColor = "#00d4ff";
        ctx.fillRect(0, portal.pos1 * gridSize, 4, gridSize);

        ctx.fillStyle = "#ff8c00";
        ctx.shadowColor = "#ff8c00";
        ctx.fillRect(
            canvas.width - 4,
            portal.pos2 * gridSize,
            4,
            gridSize
        );
    } else {
        ctx.fillStyle = "#00d4ff";
        ctx.shadowColor = "#00d4ff";
        ctx.fillRect(portal.pos1 * gridSize, 0, gridSize, 4);

        ctx.fillStyle = "#ff8c00";
        ctx.shadowColor = "#ff8c00";
        ctx.fillRect(
            portal.pos2 * gridSize,
            canvas.height - 4,
            gridSize,
            4
        );
    }

    ctx.shadowBlur = 0;

    // Obstáculo
    if (obstacle.timer > 0) {
        const ox = obstacle.x * gridSize;
        const oy = obstacle.y * gridSize;

        ctx.fillStyle = "#ff1744";
        ctx.beginPath();
        ctx.arc(ox + 10, oy + 10, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#7a001c";
        ctx.beginPath();
        ctx.arc(ox + 10, oy + 10, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Maçã normal
    drawApple(
        food.x * gridSize + 10,
        food.y * gridSize + 10,
        "#ff3434",
        8
    );

    // Comida especial dourada
    if (
        specialFood.active &&
        (specialFood.timer > 1.5 ||
         Math.floor(specialFood.timer * 10) % 2 === 0)
    ) {
        drawApple(
            specialFood.x * gridSize + 10,
            specialFood.y * gridSize + 10,
            "#ffcc00",
            8
        );
    }

    // Desenha o corpo arredondado do bichinho
    drawSnake();
}

// Desenha uma maçã com cabinho
function drawApple(x, y, color, radius) {
    ctx.save();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y + 1, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#1e8d30ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - radius + 2);
    ctx.lineTo(x + 2, y - radius - 3);
    ctx.stroke();

    ctx.fillStyle = "#0f3012ff";
    ctx.beginPath();
    ctx.ellipse(
        x + 5, y - radius - 1,
        4, 2, -0.5, 0, Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
}

// Centro de cada segmento
function center(part) {
    return {
        x: part.x * gridSize + gridSize / 2,
        y: part.y * gridSize + gridSize / 2
    };
}

// Desenha a cobrinha como um animal com rosto
function drawSnake() {
    if (!snake.length) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Corpo contínuo e arredondado
    if (snake.length > 1) {
        ctx.beginPath();

        const first = center(snake[0]);
        ctx.moveTo(first.x, first.y);

        for (let i = 1; i < snake.length; i++) {
            const p = center(snake[i]);
            ctx.lineTo(p.x, p.y);
        }

        ctx.strokeStyle = "#df1756ff";
        ctx.lineWidth = 19;
        ctx.stroke();

        // Brilho suave no corpo
        ctx.strokeStyle = "#ff34e1ff";
        ctx.lineWidth = 14;
        ctx.stroke();
    }

    // Segmentos arredondados
    snake.forEach((part, i) => {
        const p = center(part);

        ctx.beginPath();
        ctx.arc(p.x, p.y, i === 0 ? 11 : 8, 0, Math.PI * 2);

        ctx.fillStyle = i === 0 ? "#ba246aff" : "#df1735ff";
        ctx.fill();
    });

    // Cabeça
    const h = center(snake[0]);

    const angle = Math.atan2(dy, dx);
    const fx = Math.cos(angle);
    const fy = Math.sin(angle);
    const sx = -fy;
    const sy = fx;

    // Focinho projetado para a frente
    ctx.fillStyle = "#a435aeff";
    ctx.beginPath();
    ctx.ellipse(
        h.x + fx * 6,
        h.y + fy * 6,
        12,
        10,
        angle,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Olhos grandes e saltados
    for (const side of [-1, 1]) {
        const ex = h.x + fx * 1 + sx * side * 6;
        const ey = h.y + fy * 1 + sy * side * 6;

        // Parte branca do olho
        ctx.beginPath();
        ctx.arc(ex, ey, 6, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();

        // Pupila
        ctx.beginPath();
        ctx.arc(
            ex + fx * 2,
            ey + fy * 2,
            3.5,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = "#ce27cbff";
        ctx.fill();

        // Brilho dos olhos
        ctx.beginPath();
        ctx.arc(
            ex + fx * 2.5 - 1,
            ey + fy * 2.5 - 1,
            1.2,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = "white";
        ctx.fill();
    }

    // Sorriso
    const mx = h.x + fx * 11;
    const my = h.y + fy * 11;

    ctx.beginPath();
    ctx.moveTo(mx - sx * 6, my - sy * 3);
    ctx.quadraticCurveTo(
        mx + fx * 3,
        my + fy * 5,
        mx + sx * 6,
        my - sy * 3
    );

    ctx.strokeStyle = "#f7400eff";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.restore();
}

// =============================
// COMIDAS E OBSTÁCULOS
// =============================

function spawnFood() {
    let valid = false;

    while (!valid) {
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * tileCount);

        valid =
            !isOnSnake(food.x, food.y) &&
            !isObstacle(food.x, food.y) &&
            !(specialFood.active &&
              food.x === specialFood.x &&
              food.y === specialFood.y);
    }
}

function spawnSpecialFood() {
    let valid = false;

    while (!valid) {
        specialFood.x = Math.floor(Math.random() * tileCount);
        specialFood.y = Math.floor(Math.random() * tileCount);

        valid =
            !isOnSnake(specialFood.x, specialFood.y) &&
            !isObstacle(specialFood.x, specialFood.y) &&
            (specialFood.x !== food.x ||
             specialFood.y !== food.y);
    }

    specialFood.active = true;
    specialFood.timer = 6;
}

function spawnPortal() {
    portal.axis = Math.random() < 0.5 ? "h" : "v";

    portal.pos1 = Math.floor(Math.random() * (tileCount - 2)) + 1;
    portal.pos2 = Math.floor(Math.random() * (tileCount - 2)) + 1;

    portal.timer = 12;
}

function spawnObstacle() {
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 200) {
        attempts++;

        obstacle.x = Math.floor(Math.random() * (tileCount - 4)) + 2;
        obstacle.y = Math.floor(Math.random() * (tileCount - 4)) + 2;

        valid =
            !isOnSnake(obstacle.x, obstacle.y) &&
            !(obstacle.x === food.x && obstacle.y === food.y) &&
            !(specialFood.active &&
              obstacle.x === specialFood.x &&
              obstacle.y === specialFood.y);
    }

    if (valid) {
        obstacle.timer = 8;
    } else {
        obstacle.x = -1;
        obstacle.y = -1;
        obstacle.timer = 2;
    }
}

function isOnSnake(x, y) {
    return snake.some(
        part => part.x === x && part.y === y
    );
}

function isObstacle(x, y) {
    return obstacle.timer > 0 &&
           x === obstacle.x &&
           y === obstacle.y;
}

// =============================
// FIM DE JOGO
// =============================

function gameOver() {
    if (score > topScore) {
        const initials = prompt(
            "NOVO RECORDE! Digite suas iniciais (3 letras):",
            "AAA"
        );

        if (initials && initials.trim()) {
            topInitials = initials.trim().substring(0, 3).toUpperCase();
            topScore = score;

            localStorage.setItem("byteSnakeScore", topScore);
            localStorage.setItem("byteSnakeInitials", topInitials);
        }
    }

    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];

    dx = 0;
    dy = 0;
    nextDx = 0;
    nextDy = 0;

    score = 0;

    document.getElementById("score").textContent = score;
    document.getElementById("high-score").textContent = topScore;
    document.getElementById("high-score-initials").textContent = topInitials;

    specialFood.active = false;

    spawnFood();
    spawnPortal();
    spawnObstacle();
}

// =============================
// CONTROLES DO TECLADO
// =============================

window.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    if ([
        "arrowup", "arrowdown",
        "arrowleft", "arrowright",
        " "
    ].includes(key)) {
        event.preventDefault();
    }

    if (
        (key === "arrowup" || key === "w") &&
        dy === 0 && nextDy !== 1
    ) {
        nextDx = 0;
        nextDy = -1;
    }

    if (
        (key === "arrowdown" || key === "s") &&
        dy === 0 && nextDy !== -1
    ) {
        nextDx = 0;
        nextDy = 1;
    }

    if (
        (key === "arrowleft" || key === "a") &&
        dx === 0 && nextDx !== 1
    ) {
        nextDx = -1;
        nextDy = 0;
    }

    if (
        (key === "arrowright" || key === "d") &&
        dx === 0 && nextDx !== -1
    ) {
        nextDx = 1;
        nextDy = 0;
    }
});

// =============================
// INICIALIZAÇÃO
// =============================

function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;

    const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

spawnFood();
spawnPortal();
spawnObstacle();

requestAnimationFrame(loop);