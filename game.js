const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const crossBtn = document.getElementById("crossBtn");
const gameStatusContainer = document.getElementById("gameStatus");
const scoreDisplay = document.getElementById("currentScore");
const livesDisplay = document.getElementById("currentLives");

const initialPrinceState = { x: 50, y: 350, width: 100, height: 100, lives: 5 };
const initialDragonState = { x: 650, y: 300, width: 150, height: 150 };

let prince = { ...initialPrinceState };
let dragon = { ...initialDragonState };
let bullets = [];
let fireballs = [];
let score = 0;
let gameOver = false;
let fireballInterval;
let prevScore = 0;
let prevLives = initialPrinceState.lives;

let princeWounded = false;
let dragonWounded = false;

// --- Image Assets ---
const bg = new Image();
bg.src = "assets/bg_game .jpg";
const princeImg = new Image();
princeImg.src = "assets/prince.png";
const dragonImg = new Image();
dragonImg.src = "assets/dragon.png";
const bulletImg = new Image();
bulletImg.src = "assets/bullet.png";
const fireballImg = new Image();
fireballImg.src = "assets/fireball.png";
const gameoverImg = new Image();
gameoverImg.src = "assets/bg_defeat.png";
const victoryImg = new Image();
victoryImg.src = "assets/bg_victory.png";

// Wounded Image Assets (These will be *temporarily* ignored in draw for testing)
const princeWoundedImg = new Image();
princeWoundedImg.src = "assets/prince_wounded.png";
const dragonWoundedImg = new Image();
dragonWoundedImg.src = "assets/dragon_wounded.png";

// --- Sound Assets ---
const shootSound = new Audio("assets/shoot.wav");
const gameOverSound = new Audio("assets/gameover.wav");
const hitSound = new Audio("assets/hit.wav");
const damageSound = new Audio("assets/damage.wav");

function draw() {
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    // --- TEMPORARY CHANGE FOR DEBUGGING ---
    // Instead of princeWoundedImg, draw princeImg to see if the switch happens
    // if (princeWounded) {
    //     ctx.drawImage(princeWoundedImg, prince.x, prince.y, prince.width, prince.height);
    // } else {
    //     ctx.drawImage(princeImg, prince.x, prince.y, prince.width, prince.height);
    // }
    // For testing, always draw the normal image, but observe if the *flash* happens
    ctx.drawImage(princeWounded ? princeImg : princeImg, prince.x, prince.y, prince.width, prince.height);


    // --- TEMPORARY CHANGE FOR DEBUGGING ---
    // Instead of dragonWoundedImg, draw dragonImg to see if the switch happens
    // if (dragonWounded) {
    //     ctx.drawImage(dragonWoundedImg, dragon.x, dragon.y, dragon.width, dragon.height);
    // } else {
    //     ctx.drawImage(dragonImg, dragon.x, dragon.y, dragon.width, dragon.height);
    // }
    // For testing, always draw the normal image, but observe if the *flash* happens
    ctx.drawImage(dragonWounded ? dragonImg : dragonImg, dragon.x, dragon.y, dragon.width, dragon.height);


    bullets.forEach(b => {
        ctx.drawImage(bulletImg, b.x, b.y, 40, 30);
    });

    fireballs.forEach(f => {
        ctx.drawImage(fireballImg, f.x, f.y, 40, 30);
    });
}

function updateHTMLScoreboard() {
    if (score > prevScore) {
        scoreDisplay.classList.add("score-up-anim");
        setTimeout(() => {
            scoreDisplay.classList.remove("score-up-anim");
        }, 300);
    }
    scoreDisplay.textContent = score;

    if (prince.lives < prevLives) {
        livesDisplay.classList.add("lives-down-anim");
        setTimeout(() => {
            livesDisplay.classList.remove("lives-down-anim");
        }, 300);
    }
    livesDisplay.textContent = prince.lives;

    prevScore = score;
    prevLives = prince.lives;
}


function update() {
    // --- Process Bullets ---
    bullets.forEach(b => {
        b.x += 7;

        let bulletWasConsumed = false;

        // Collision with Dragon
        if (
            !bulletWasConsumed &&
            b.x + b.width > dragon.x &&
            b.y < dragon.y + dragon.height &&
            b.y + b.height > dragon.y
        ) {
            score += 1;
            b.hit = true;
            dragonWounded = true;
            if (damageSound) damageSound.play();
            // --- TEMPORARY CHANGE FOR DEBUGGING ---
            // Make wounded state last longer
            console.log("Dragon hit! Wounded state ON. Lives:", prince.lives, "Score:", score);
            setTimeout(() => {
                dragonWounded = false;
                console.log("Dragon wounded state OFF.");
            }, 1000); // Changed from 300ms to 1000ms for easier observation
            bulletWasConsumed = true;
        }

        // Collision with Fireballs (if bullet hasn't hit dragon)
        if (!bulletWasConsumed) {
            for (let i = 0; i < fireballs.length; i++) {
                const f = fireballs[i];
                if (
                    !f.hit &&
                    b.x + b.width > f.x &&
                    b.y < f.y + f.height &&
                    b.y + b.height > f.y
                ) {
                    score += 1;
                    b.hit = true;
                    f.hit = true;
                    if (hitSound) hitSound.play();
                    bulletWasConsumed = true;
                    break;
                }
            }
        }
    });

    // --- Process Fireballs ---
    fireballs.forEach(f => {
        f.x -= 3;

        // Collision with Prince
        if (
            !f.hit &&
            f.x < prince.x + prince.width &&
            f.x + f.width > prince.x &&
            f.y < prince.y + prince.height &&
            f.y + f.height > prince.y
        ) {
            prince.lives--;
            f.hit = true;
            princeWounded = true;
            if (damageSound) damageSound.play();
            // --- TEMPORARY CHANGE FOR DEBUGGING ---
            // Make wounded state last longer
            console.log("Prince hit! Wounded state ON. Lives:", prince.lives, "Score:", score);
            setTimeout(() => {
                princeWounded = false;
                console.log("Prince wounded state OFF.");
            }, 1000); // Changed from 300ms to 1000ms for easier observation
        }
    });

    // Filter out hit/out-of-bounds objects
    bullets = bullets.filter(b => b.x < canvas.width && !b.hit);
    fireballs = fireballs.filter(f => f.x > -f.width && !f.hit);

    updateHTMLScoreboard();

    // --- TEMPORARY CHANGE FOR DEBUGGING ---
    console.log("Current gameOver state:", gameOver);

    // Game Over / Victory Conditions
    if (score >= 5) {
        console.log("Victory condition met!");
        gameOver = true;
        clearInterval(fireballInterval);
        setTimeout(() => {
            ctx.drawImage(victoryImg, 0, 0, canvas.width, canvas.height);
            retryBtn.style.display = "block";
            crossBtn.style.display = "block";
            gameStatusContainer.style.display = "flex";
        }, 100);
    }

    if (prince.lives <= 0) {
        console.log("Game Over condition met!");
        gameOver = true;
        clearInterval(fireballInterval);
        gameOverSound.play();
        setTimeout(() => {
            ctx.drawImage(gameoverImg, 0, 0, canvas.width, canvas.height);
            retryBtn.style.display = "block";
            crossBtn.style.display = "block";
            gameStatusContainer.style.display = "flex";
        }, 100);
    }
}

function gameLoop() {
    if (!gameOver) {
        draw();
        update();
        requestAnimationFrame(gameLoop);
    }
}

function shootFireball() {
    if (!gameOver) {
        fireballs.push({ x: dragon.x, y: dragon.y + dragon.height / 2 - 15, width: 40, height: 30, hit: false });
    }
}

function goToStartScreen() {
    startScreen.style.display = "flex";
    canvas.style.display = "none";
    retryBtn.style.display = "none";
    crossBtn.style.display = "none";
    gameStatusContainer.style.display = "none";

    princeWounded = false;
    dragonWounded = false;

    clearInterval(fireballInterval);
}

function resetGame() {
    prince = { ...initialPrinceState };
    dragon = { ...initialDragonState };
    bullets = [];
    fireballs = [];
    score = 0;
    gameOver = false;

    princeWounded = false;
    dragonWounded = false;

    clearInterval(fireballInterval);
    fireballInterval = setInterval(shootFireball, 2000);
    retryBtn.style.display = "none";
    crossBtn.style.display = "none";
    prevScore = 0;
    prevLives = initialPrinceState.lives;
    updateHTMLScoreboard();
    gameStatusContainer.style.display = "flex";
    gameLoop();
}

window.addEventListener("keydown", (e) => {
    if (!gameOver) {
        if (e.key === "ArrowUp" && prince.y > canvas.height / 2) prince.y -= 20;
        if (e.key === "ArrowDown" && prince.y + prince.height < canvas.height) prince.y += 20;
        if (e.key === "ArrowLeft" && prince.x > 0) prince.x -= 20;
        if (e.key === "ArrowRight" && prince.x + prince.width < canvas.width / 2) prince.x += 20;
        if (e.key === " ") {
            shootSound.play();
            bullets.push({ x: prince.x + prince.width, y: prince.y + prince.height / 2 - 15, width: 40, height: 30, hit: false });
        }
    }
});

startBtn.addEventListener("click", () => {
    startScreen.style.display = "none";
    canvas.style.display = "block";
    gameStatusContainer.style.display = "flex";
    updateHTMLScoreboard();
    gameLoop();
    fireballInterval = setInterval(shootFireball, 2000);
});

retryBtn.addEventListener("click", resetGame);
crossBtn.addEventListener("click", goToStartScreen);

gameStatusContainer.style.display = "none";
retryBtn.style.display = "none";
crossBtn.style.display = "none";