// Game variables
let powerLevel = 0;
let isPoweringUp = false;
let powerInterval;
let powerDirection = 1;
let powerSpeed = 2;
const maxPowerSpeed = 6;
const minPowerSpeed = 2;
let speedChangeInterval;
let game;

// DOM Elements
const startGameButton = document.getElementById('start-game');
const gameArea = document.getElementById('game-area');
const playerSetup = document.getElementById('player-setup');
const throwButton = document.getElementById('throwButton');
const powerBar = document.querySelector('.power-bar');
const ball = document.getElementById('bowlingBall');
const pins = document.querySelectorAll('.pin');
const newGameButton = document.getElementById('newGameButton');

class BowlingGame {
    constructor(player1Name, player2Name, player1Color, player2Color) {
        this.players = [
            { name: player1Name, color: player1Color, frames: Array(10).fill().map(() => []), score: 0 },
            { name: player2Name, color: player2Color, frames: Array(10).fill().map(() => []), score: 0 }
        ];
        this.currentPlayerIndex = 0;
        this.currentFrame = 0;
        this.currentThrow = 0;
        this.gameOver = false;
        this.initializeScoreboard();
    }

    initializeScoreboard() {
        for (let i = 0; i < 2; i++) {
            const scoreboard = document.getElementById(`player${i+1}-scoreboard`);
            const nameElement = scoreboard.querySelector('.player-name');
            const framesElement = scoreboard.querySelector('.frames');
            
            nameElement.textContent = this.players[i].name;
            framesElement.innerHTML = '';
            
            for (let j = 0; j < 10; j++) {
                const frameDiv = document.createElement('div');
                frameDiv.className = 'frame';
                frameDiv.innerHTML = `
                    <div class="frame-number">${j + 1}</div>
                    <div class="throws"></div>
                    <div class="frame-score">0</div>
                `;
                framesElement.appendChild(frameDiv);
            }
        }
        this.updateCurrentPlayerDisplay();
    }

    updateCurrentPlayerDisplay() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        document.getElementById('current-player-name').textContent = currentPlayer.name;
        ball.style.backgroundColor = currentPlayer.color;
    }

    roll(pins) {
        if (this.gameOver) return;
        
        const currentFrame = this.players[this.currentPlayerIndex].frames[this.currentFrame];
        currentFrame.push(pins);
        
        // Check if current frame is complete
        if (this.isFrameComplete(currentFrame)) {
            if (this.currentFrame === 9) { // 10th frame special rules
                if (currentFrame.length === 3 || // Three throws done
                    (currentFrame.length === 2 && currentFrame[0] + currentFrame[1] < 10)) { // Two throws without strike/spare
                    this.nextPlayer();
                }
            } else {
                this.nextPlayer();
            }
        } else {
            this.currentThrow++;
        }
        
        this.updateCurrentPlayerDisplay();
        this.updateScoreboard();
        
        if (this.isGameOver()) {
            this.gameOver = true;
            this.announceWinner();
        }
    }

    isFrameComplete(frame) {
        if (!frame) return false;
        
        if (this.currentFrame === 9) { // 10th frame
            if (frame[0] === 10) { // Strike
                return frame.length === 3;
            } else if (frame.length === 2 && frame[0] + frame[1] === 10) { // Spare
                return frame.length === 3;
            } else {
                return frame.length === 2;
            }
        } else { // Frames 1-9
            return frame[0] === 10 || frame.length === 2;
        }
    }

    calculateFrameScore(frames, frameIndex) {
        const frame = frames[frameIndex];
        if (!frame || frame.length === 0) return null;

        let score = 0;
        
        // Last frame special handling
        if (frameIndex === 9) {
            // Sum up all throws in the 10th frame
            return frame.reduce((sum, pins) => sum + pins, 0);
        }
        
        // Strike
        if (frame[0] === 10) {
            // Need next two throws for strike bonus
            let nextThrows = [];
            
            // Look in next frame
            if (frames[frameIndex + 1]) {
                nextThrows = nextThrows.concat(frames[frameIndex + 1]);
                
                // If next frame is a strike and we still need throws, look in the frame after
                if (nextThrows.length === 1 && nextThrows[0] === 10 && frameIndex < 8) {
                    if (frames[frameIndex + 2]) {
                        nextThrows = nextThrows.concat(frames[frameIndex + 2]);
                    }
                }
            }
            
            // Only calculate if we have enough throws for bonus
            if (nextThrows.length >= 2) {
                score = 10 + nextThrows[0] + nextThrows[1];
                return score;
            }
            return null;
        }
        
        // Spare
        if (frame.length === 2 && frame[0] + frame[1] === 10) {
            // Need one throw from next frame
            if (frames[frameIndex + 1] && frames[frameIndex + 1].length > 0) {
                score = 10 + frames[frameIndex + 1][0];
                return score;
            }
            return null;
        }
        
        // Open frame
        if (frame.length === 2) {
            score = frame[0] + frame[1];
            return score;
        }
        
        return null;
    }

    updateScoreboard() {
        const players = [0, 1];
        
        players.forEach(playerIndex => {
            const player = this.players[playerIndex];
            const scoreboard = document.getElementById(`player${playerIndex + 1}-scoreboard`);
            const framesDiv = scoreboard.querySelector('.frames');
            let totalScore = 0;

            // Clear existing frames
            framesDiv.innerHTML = '';
            
            // Create frame elements
            for (let i = 0; i < 10; i++) {
                const frameDiv = document.createElement('div');
                frameDiv.className = 'frame';
                
                const frameNumberDiv = document.createElement('div');
                frameNumberDiv.className = 'frame-number';
                frameNumberDiv.textContent = i + 1;
                
                const throwsDiv = document.createElement('div');
                throwsDiv.className = 'throws';
                
                const scoreDiv = document.createElement('div');
                scoreDiv.className = 'frame-score';
                
                frameDiv.appendChild(frameNumberDiv);
                frameDiv.appendChild(throwsDiv);
                frameDiv.appendChild(scoreDiv);
                framesDiv.appendChild(frameDiv);
                
                const frame = player.frames[i];
                if (!frame) continue;
                
                // Update throws display
                throwsDiv.innerHTML = frame.map((pins, throwIndex) => {
                    // Strike
                    if (pins === 10 && (i < 9 || throwIndex === 0)) return 'X';
                    // Spare
                    if (throwIndex === 1 && frame[0] + pins === 10) return '/';
                    // Normal throw
                    return pins === 0 ? '-' : pins;
                }).join(' ');
                
                // Update frame score
                const frameScore = this.calculateFrameScore(player.frames, i);
                if (frameScore !== null) {
                    totalScore += frameScore;
                    scoreDiv.textContent = totalScore;
                }
            }
            
            // Update total score
            scoreboard.querySelector('.total-score').textContent = `Total: ${totalScore}`;
            player.score = totalScore;
            
            // Update player name
            scoreboard.querySelector('.player-name').textContent = player.name;
        });
    }

    announceWinner() {
        const player1Score = this.players[0].score;
        const player2Score = this.players[1].score;
        let message;
        
        if (player1Score > player2Score) {
            message = `${this.players[0].name} wins with ${player1Score} points!`;
        } else if (player2Score > player1Score) {
            message = `${this.players[1].name} wins with ${player2Score} points!`;
        } else {
            message = `It's a tie! Both players scored ${player1Score} points!`;
        }
        
        setTimeout(() => {
            alert(message);
        }, 500);
    }

    nextPlayer() {
        if (this.currentPlayerIndex === 0) {
            this.currentPlayerIndex = 1;
            this.updateCurrentPlayerDisplay();
        } else {
            this.currentPlayerIndex = 0;
            this.currentFrame++;
            this.updateCurrentPlayerDisplay();
        }
        this.currentThrow = 0;
    }

    isGameOver() {
        return this.currentFrame === 10;
    }
}

function updatePowerBar() {
    // Randomly change direction with 5% chance
    if (Math.random() < 0.05) {
        powerDirection *= -1;
    }
    
    powerLevel += powerSpeed * powerDirection;
    
    // Bounce between 0 and 100
    if (powerLevel >= 100) {
        powerLevel = 100;
        powerDirection = -1;
    } else if (powerLevel <= 0) {
        powerLevel = 0;
        powerDirection = 1;
    }
    
    powerBar.style.width = `${powerLevel}%`;
    
    // Change color based on power level
    let color;
    if (powerLevel >= 47 && powerLevel <= 53) {
        color = '#4CAF50'; // Perfect zone - green
    } else if (powerLevel >= 40 && powerLevel <= 60) {
        color = '#FFC107'; // Good zone - yellow
    } else {
        color = '#F44336'; // Poor zone - red
    }
    powerBar.style.backgroundColor = color;
}

function animateBall(power) {
    const ball = document.getElementById('bowlingBall');
    const currentPlayer = game.players[game.currentPlayerIndex];
    ball.style.backgroundColor = currentPlayer.color;
    
    // Reset ball position and transition
    ball.style.transition = 'none';
    ball.style.transform = 'translateX(-50%) translateY(0)';
    
    // Force reflow to ensure the reset takes effect
    ball.offsetHeight;
    
    // Add smooth animation
    ball.style.transition = 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)';
    
    // Animate the ball moving up the lane
    const randomOffset = (Math.random() - 0.5) * 20; // Add slight randomness to trajectory
    ball.style.transform = `translateX(calc(-50% + ${randomOffset}px)) translateY(-350px)`;
    
    setTimeout(() => {
        const pinsDown = calculatePinsKnockedDown(power);
        knockDownPins(pinsDown);
        game.roll(pinsDown);
        game.updateScoreboard();
        
        // Reset ball position after animation
        setTimeout(() => {
            ball.style.transition = 'transform 0.5s ease-out';
            ball.style.transform = 'translateX(-50%) translateY(0)';
        }, 1000);
    }, 1000);
}

function knockDownPins(count) {
    const pins = document.querySelectorAll('.pin');
    const standingPins = Array.from(pins).filter(pin => !pin.classList.contains('knocked'));
    const pinIndices = standingPins.map(pin => Array.from(pins).indexOf(pin));
    
    // Randomly select pins to knock down from remaining standing pins
    for (let i = 0; i < count; i++) {
        if (pinIndices.length === 0) break;
        const randomIndex = Math.floor(Math.random() * pinIndices.length);
        const pinIndex = pinIndices.splice(randomIndex, 1)[0];
        pins[pinIndex].classList.add('knocked');
    }
    
    // Only reset pins if:
    // 1. All pins are knocked down (strike), or
    // 2. This is the second throw of the frame, or
    // 3. We're in the 10th frame with special rules
    const isStrike = count === 10;
    const isSecondThrow = game.currentThrow === 1;
    const isTenthFrame = game.currentFrame === 9;
    const currentFrameThrows = game.players[game.currentPlayerIndex].frames[game.currentFrame];
    const isTenthFrameThirdThrow = isTenthFrame && currentFrameThrows && currentFrameThrows.length === 2;
    
    if (isStrike || isSecondThrow || isTenthFrameThirdThrow) {
        setTimeout(resetPins, 2000);
    }
}

function resetPins() {
    const pins = document.querySelectorAll('.pin');
    pins.forEach(pin => pin.classList.remove('knocked'));
}

function calculatePinsKnockedDown(power) {
    const distanceFromPerfect = Math.abs(50 - power);
    let accuracy;
    
    if (distanceFromPerfect <= 3) {
        accuracy = 0.8 + (Math.random() * 0.15);
    } else if (distanceFromPerfect <= 10) {
        accuracy = 0.5 + (Math.random() * 0.2);
    } else {
        accuracy = 0.1 + (Math.random() * 0.3);
    }
    
    const laneVariation = Math.random() * 0.2 - 0.1;
    accuracy = Math.max(0.05, Math.min(0.95, accuracy + laneVariation));
    
    const remainingPins = Array.from(pins).filter(pin => pin.style.opacity !== '0').length;
    let pinsDown = 0;
    
    for (let i = 0; i < remainingPins; i++) {
        const pinDifficulty = 1 - (i * 0.05);
        if (Math.random() < accuracy * pinDifficulty) {
            pinsDown++;
        }
    }
    
    return pinsDown;
}

// Event Listeners
startGameButton.addEventListener('click', () => {
    const player1Name = document.getElementById('player1-name').value || 'Player 1';
    const player2Name = document.getElementById('player2-name').value || 'Player 2';
    const player1Color = document.getElementById('player1-color').value;
    const player2Color = document.getElementById('player2-color').value;
    
    game = new BowlingGame(player1Name, player2Name, player1Color, player2Color);
    playerSetup.style.display = 'none';
    gameArea.style.display = 'block';
});

throwButton.addEventListener('mousedown', () => {
    if (!game || game.gameOver) return;
    
    if (game.currentThrow === 0) {
        resetPins();
    }
    
    isPoweringUp = true;
    powerLevel = 0;
    powerDirection = Math.random() < 0.5 ? 1 : -1;
    powerSpeed = minPowerSpeed;
    
    powerInterval = setInterval(updatePowerBar, 16);
    
    speedChangeInterval = setInterval(() => {
        powerSpeed = minPowerSpeed + Math.random() * (maxPowerSpeed - minPowerSpeed);
        if (Math.random() < 0.2) {
            powerDirection *= -1;
        }
    }, Math.random() * 500 + 300);
});

throwButton.addEventListener('mouseup', () => {
    if (!game || game.gameOver) return;
    
    isPoweringUp = false;
    clearInterval(powerInterval);
    clearInterval(speedChangeInterval);
    
    animateBall(powerLevel);
    setTimeout(() => {
        powerBar.style.width = '0%';
        powerBar.style.backgroundColor = '#4CAF50';
        powerLevel = 0;
    }, 1000);
});

newGameButton.addEventListener('click', () => {
    playerSetup.style.display = 'block';
    gameArea.style.display = 'none';
    resetPins();
});
