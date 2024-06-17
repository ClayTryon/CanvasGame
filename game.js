const canvas = document.querySelector('canvas');
let c = canvas.getContext('2d');

// Take canvas dimensions into JS for game reference
let canvasWidth = canvas.width;
let canvasHeight = canvas.height;

let backgroundImage = new Image();
backgroundImage.src = "images/background.jpg";

let spriteSheet = new Image();
spriteSheet.src = "images/spriteSheet.png";

let explosionSprite = new Image();
explosionSprite.src = "images/boom3.png";

let enemyImage = new Image();
enemyImage.src = "images/hero.png";

let projectileSound = new Audio("fireLaser.mp3");
projectileSound.volume = 0.07;

let backgroundTrack = new Audio("backgroundTrack.mp3");
backgroundTrack.volume = 0.4;

let explosionSound = new Audio("explosion.wav");
explosionSound.volume = 0.07;

// Initial character position
let characterX = 163;
let characterY = 725;

// Score variables
let score = 0;
let scoreRounded=0;

// Character size
let characterWidth = 75;
let characterHeight = 75;

// Scaling stats based on score
let hpScaling = 1 + score / 100;


// Default Speeds and stats(Can upgrade as score increases)
let characterSpeed = 75
let enemySpawnRate = 1500
let projectileFireRate = 1000;
let enemySpeed=85


let keysDown = {};

// Arraus to hold information
let projectiles = [];

let enemies = [];

let explosions = [];

// Sprite sheet properties
let spriteWidth = 80;
let spriteHeight = 80;

let explosionSpriteWidth = 128;
let explosionSpriteLength = 128;

// Current frame in the sprite sheet
let currentFrame = 0;
let frameCount = 4;

let currentFrameExplosion = 0;
let frameCountExplosion = 64;

let playerRow = 0;

// Columns of the player sprite in the sprite sheet for different directions
let playerColumns = [2, 0, 3]; // Stationary, Left, Right

// Intervals and game state
let shootInterval;
let spawnInterval;
let isGameOver = false;

// Draw background image when site is loaded
backgroundImage.onload = () => {
    drawBgImg();
    drawCharacter();
};

function resetShootInterval() {
    clearInterval(shootInterval);
    shootInterval = setInterval(shootProjectile, projectileFireRate);
}

function resetSpawnInterval() {
    clearInterval(spawnInterval);
    spawnInterval = setInterval(spawnEnemy, enemySpawnRate);
}

function increaseStats() {
    let needsResetShootInterval = false;
    let needsResetSpawnInterval = false;

    if (characterSpeed < 400) {
        characterSpeed += 3;
        if (characterSpeed > 400) {
            characterSpeed = 400;
        }
        console.log("Character Speed:", characterSpeed);
    }

    if (projectileFireRate > 100) {
        projectileFireRate -= 2;
        needsResetShootInterval = true; 
    }
    console.log("Projectile Fire Rate:", projectileFireRate);

    if (enemySpawnRate > 500) {
        enemySpawnRate -= 2;
        needsResetSpawnInterval = true; 
    }
    console.log("Enemy Spawn Rate:", enemySpawnRate);

    if (needsResetShootInterval) {
        resetShootInterval();
    }
    if (needsResetSpawnInterval) {
        resetSpawnInterval();
    }
}

function drawBgImg() {
    c.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
}

function drawCharacter() {
    let currentColumn = playerColumns[0]; // Default to stationary
    if (37 in keysDown) { // Left arrow key
        currentColumn = playerColumns[1]; // Move left
    }
    if (39 in keysDown) { // Right arrow key
        currentColumn = playerColumns[2]; // Move right
    }

    c.drawImage(spriteSheet, currentColumn * spriteWidth, playerRow * spriteHeight, spriteWidth, spriteHeight, characterX, characterY, characterWidth, characterHeight);
}

function drawExplosion() {
    for (let explosion of explosions) {
        let frameX = (explosion.frame % 8) * explosionSpriteWidth;
        let frameY = Math.floor(explosion.frame / 8) * explosionSpriteLength;
        c.drawImage(explosionSprite, frameX, frameY, explosionSpriteWidth, explosionSpriteLength, explosion.x, explosion.y, characterWidth, characterHeight);
    }
}

function updateCharacterPosition(modifier) {
    if (37 in keysDown) { // Left arrow key
        if (characterX > 0) {
            characterX -= characterSpeed * modifier; // Move left only if not at the left edge of the canvas
        }
    }
    if (39 in keysDown) { // Right arrow key
        if (characterX + characterWidth < canvasWidth) {
            characterX += characterSpeed * modifier; // Move right only if not at the right edge of the canvas
        }
    }
}

function shootProjectile() {
    projectiles.push({ x: characterX + characterWidth / 2, y: characterY + characterHeight / 2 });
    projectileSound.play();
}

function updateProjectiles(modifier) {
    // Move projectiles every frame
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].y -= (200*modifier); // Move projectile upwards

        // Check if projectile is out of bounds (y < 0)
        if (projectiles[i].y < 0) {
            // Remove projectile from the array
            projectiles.splice(i, 1);
        }
    }
}

function drawProjectiles() {
    for (let projectile of projectiles) {
        // Draw projectiles as circles
        c.beginPath();
        c.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
        c.fillStyle = 'white';
        c.fill();
        c.closePath();
    }
}

function spawnEnemy() {
    // Spawn enemy at random x position at the top of the canvas
    let enemyX = Math.random() * (canvasWidth - characterWidth);
    enemies.push({ x: enemyX, y: 0 });
}

function updateEnemies(modifier) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemySpeed*modifier; // Move enemy downwards

        // Check if enemy is out of bounds (y > canvasHeight)
        if (enemies[i].y > canvasHeight) {
            enemies.splice(i, 1);
            gameOver();
        }
    }
}

function drawEnemies() {
    for (let enemy of enemies) {
        c.drawImage(enemyImage, enemy.x, enemy.y, characterWidth, characterHeight);
    }
}


function increaseScore() {
    for (let enemy of enemies) {
        let distanceFromPlayer = characterY - enemy.y;
        score += Math.floor(distanceFromPlayer/200)
    }
    // Update the rounded score
    scoreRounded = score.toFixed(2);

    // Increase stats based on the new score at specific thresholds
    if (score % 10 === 0) { 
        increaseStats();
    }
}


function checkCollision() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            let projectile = projectiles[i];
            let enemy = enemies[j];

            if (
                projectile &&
                enemy &&
                projectile.x >= enemy.x &&
                projectile.x <= enemy.x + characterWidth &&
                projectile.y >= enemy.y &&
                projectile.y <= enemy.y + characterHeight
            ) {
                projectiles.splice(i, 1);
                enemies.splice(j, 1);

                explosions.push({ x: enemy.x, y: enemy.y, frame: 0 });
                explosionSound.play();

                increaseScore();

                break;
            }
        }
    }
}


function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        let explosion = explosions[i];
        explosion.frame++;
        if (explosion.frame > frameCountExplosion) {
            explosions.splice(i, 1); // Remove explosion after last frame
        }
    }
}

function drawScore() {
    c.fillStyle = "white";
    c.font = "24px Arial";
    c.fillText("Score: " + scoreRounded, canvasWidth - 150, 30);
}

function drawGameOverScreen() {
    // Clear the canvas
    c.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw the game over message
    c.fillStyle = "red";
    c.font = "48px Arial";
    c.fillText("Game Over", canvasWidth / 2 - 120, canvasHeight / 2 - 24);
    c.font = "24px Arial";
    c.fillText("Your Score: "+ String(scoreRounded), canvasWidth/2 -120, canvasHeight/2 + 24)
    c.fillText("Press 'R' to Restart", canvasWidth / 2 - 120, canvasHeight / 2 + 48);
}

function gameOver() {
    isGameOver = true;
    clearInterval(shootInterval);
    clearInterval(spawnInterval);
    backgroundTrack.pause();

    // Draw game over screen
    drawGameOverScreen();
}

function resetGame() {
    isGameOver = false;
    score = 0;
    scoreRounded=0
    characterX = 163;
    characterY = 725;
    projectiles = [];
    enemies = [];
    explosions = [];

    // Restart intervals and game loop
    shootInterval = setInterval(shootProjectile, projectileFireRate);
    spawnInterval = setInterval(spawnEnemy, enemySpawnRate);
    backgroundTrack.currentTime = 0;
    backgroundTrack.play();
    gameLoop();
}

function render(){
    drawBgImg();
    drawCharacter();
    drawProjectiles();
    drawEnemies();
    drawExplosion(); 
    drawScore(); 
}

function update(modifier){
    updateCharacterPosition(modifier);
    updateProjectiles(modifier); 
    updateEnemies(modifier); 
    updateExplosions();
    checkCollision();   
}

function gameLoop() {
    if (isGameOver) {
        // Clear the canvas and draw the game over message if game over has been triggered
        drawGameOverScreen();
        return; 
    }
    var now=Date.now();
    var delta=now-then
    update(delta/1000)
    render()
    then = now;
    requestAnimationFrame(gameLoop);
}

// Start the game loop when the "Start Game" button is clicked
// This is necessary because otherwise stupid stinky chrome won't play the music :(

let then=Date.now; 

document.getElementById("StartGame").addEventListener("click", () => {

    gameLoop();

    backgroundTrack.loop = true;
    backgroundTrack.play();

    shootInterval = setInterval(shootProjectile, projectileFireRate);

    spawnInterval = setInterval(spawnEnemy, enemySpawnRate);
    
    // Hide the button
    document.getElementById("StartGame").style.display = "none";
});



addEventListener("keydown", function (e) {
    keysDown[e.keyCode] = true;
    if (e.keyCode === 82 && isGameOver) { // 'R' key
        resetGame();
    }
});

addEventListener("keyup", function (e) {
    delete keysDown[e.keyCode];
});
