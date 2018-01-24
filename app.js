const canvas = document.getElementById('canvas');
const scoreBoard = document.getElementById('score');
const livesBoard = document.getElementById('lives');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;
const squareSize = 20;
const loopInterval = 10;
let score = 0;
let lives = 3;
let direction = 'left';
const invaders = {
	row0: [],
	row1: [],
	row2: [],
	row3: [],
	row4: [],
};
const player = {
	row0: [],
	row1: [],
}
const barriers = [];
const lasers = [];
let timerHandle;

function drawSquare(x, y, color) {
	ctx.fillStyle = color;
	ctx.fillRect(x, y, squareSize, squareSize);	
}

function drawLine(x, y, color) {
	ctx.fillStyle = color;
	ctx.fillRect(x, y, squareSize / 8, squareSize);	
}

function drawLasers() {
	lasers.forEach(laser => {
		const color = laser.player ? '#ff0066' : '#ffffff';
		drawLine(laser.x, laser.y, color);
	});
}

function drawInvaders() {
	for (let row in invaders) {
		invaders[row].forEach(invader => {
			if (invader.alive) {
				const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
				drawSquare(invader.x, invader.y, color);
			}
		});
	}
}

function drawPlayer(color = '#0000cc') {
	for (let row in player) {
		player[row].forEach(element => {
			drawSquare(element.x, element.y, color);
		});
	}
}

function drawBarriers() {
	barriers.forEach(barrier => {
		if (barrier.hitCount < 3) {
			const color = barrier.hitCount === 0 ? '#009900' : barrier.hitCount === 1 ? '#ff9933' : '#ff3300';
			drawSquare(barrier.x, barrier.y, color);
		} 
	});
}

function createInvaders() {
	let i = 0;
	for (let row in invaders) {
		fillInvaderRow(invaders[row], i++);
	}
}

function createBarriers() {
	for (let i = squareSize * 8; i < (width - (squareSize * 8)); i += squareSize * 8) {
		let count = 0;
		while (count <= 3) {
			const block = {x: i + (squareSize * count++), y: height - (squareSize * 6), hitCount: 0};
			barriers.push(block);
		}
	}
}

function createPlayer() {
	let i = -1;
	while (i <= 1) {
		player.row1.push({x: (width / 2) - (squareSize * i++), y: height - squareSize * 2});
	}
	player.row0.push({x: width / 2, y: height - (squareSize * 3)});
}

function createLaser(gunPoint, player = true) {
	lasers.push({x: gunPoint.x + (squareSize / 2), y: gunPoint.y - squareSize, player});
}

function checkCollision(laser, solid) {
	return ((solid.x <= laser.x && laser.x <= solid.x + squareSize) && (solid.y <= laser.y && laser.y <= solid.y + squareSize));
}

function fillInvaderRow(row, heightBuffer) {
	for (let i = squareSize * 8; i < (width - (squareSize * 8)); i += squareSize * 2) {
		const invader = {x: i, y: (squareSize * 2) * heightBuffer, alive: true};
		row.push(invader);
	}
}
 
function killedInvader(invader) {
	invader.alive = false;
	scoreBoard.innerHTML = score += 10;
}

function laserCollision(index) {
	lasers.splice(index, 1);
}

function barrierCollision(index) {
	barriers[index].hitCount++;
}

function playerTookDamage() {
	if (lives >= 1) {
		livesBoard.innerHTML = --lives;
		drawPlayer('#ff3300');
	} else {
		// restart();
	}
}

function moveLasers() {
	lasers.forEach((laser, laserIndex) => {
		if (laser.y <= 0) {
			laserCollision(laserIndex);
		} else {
			if (laser.player) {
				laser.y -= squareSize / 4;
				for (let row in invaders) {
					invaders[row].forEach(invader => {
						if (checkCollision(laser, invader) && invader.alive) {
							killedInvader(invader);
							laserCollision(laserIndex);
						}
					});
				}
				barriers.forEach((barrier, barrierIndex) => {
					if (checkCollision(laser, barrier) && barriers[barrierIndex].hitCount < 3) {
						laserCollision(laserIndex);
					}
				});
			} else if (!laser.player) {
				laser.y += squareSize / 16;
				barriers.forEach((barrier, barrierIndex) => {
					if (checkCollision(laser, barrier) && barriers[barrierIndex].hitCount < 3) {
						laserCollision(laserIndex);
						barrierCollision(barrierIndex);
					}
				});
				for (let row in player) {
					player[row].forEach(element => {
						if (checkCollision(laser, element) && lives >= 0) {
							playerTookDamage();
							laserCollision(laserIndex);
						}
					});
				}
			}
		}
	});
}

function invadersAttack() {
	const invaderColumn = Math.floor(Math.random() * Math.floor(invaders.row0.length));
	let invaderRow;
	for (let row in invaders) {
		if (invaders[row][invaderColumn].alive) invaderRow = row;
	}
	if (invaderRow) {
		createLaser(invaders[invaderRow][invaderColumn], false);
	} else {
		invadersAttack();
	}
}

function moveInvaders() {
	if (direction === 'left') {
		if (invaders.row0[0].x - squareSize <= 0) {
			direction = 'right';
		} else {
			for (let row in invaders) {
				invaders[row].forEach(invader => {
					invader.x -= squareSize;
				});
			}
		}
	} else if ( direction === 'right') {
		if (invaders.row0[invaders.row0.length - 1].x + squareSize >= width) {
			for (let row in invaders) {
				invaders[row].forEach(invader => {
					invader.y += squareSize;
				});
			}
			direction = 'left';
		} else {
			for (let row in invaders) {
				invaders[row].forEach(invader => {
					invader.x += squareSize;
				});
			}
		}
	} else {
		console.log('Invaders have no direction');
	}
	invadersAttack();
	setTimeout(moveInvaders, 1000);
}

function handleInput(key) {
	if ((key === 'ArrowLeft' || key === 'KeyA') && player.row1[2].x > 0) { 
		for (let row in player) {
			player[row].forEach(element => {
				element.x -= squareSize / 4;
			});
		}
	} else if ((key === 'ArrowRight' || key === 'KeyD') && player.row1[0].x + squareSize < width) { 
		for (let row in player) {
			player[row].forEach(element => {
				element.x += squareSize / 4;
			});
		}
	} 
	if (key === 'Space') {
		createLaser(player.row0[0]);
	}
}

function gameLoop() {
	ctx.clearRect(0, 0, width, height);
	drawInvaders();
	drawPlayer();
	drawBarriers();
	drawLasers();
	moveLasers();
}

function run() {
	createInvaders();
	createPlayer();
	createBarriers();
	moveInvaders();
	timerHandle = setInterval(gameLoop, loopInterval);
}

function restart () {
	clearInterval(timerHandle);
	score = 0;
	scoreBoard.innerHTML = score;
	// run();
}

document.onkeydown = function(event) {
	handleInput(event.code);
}

run();