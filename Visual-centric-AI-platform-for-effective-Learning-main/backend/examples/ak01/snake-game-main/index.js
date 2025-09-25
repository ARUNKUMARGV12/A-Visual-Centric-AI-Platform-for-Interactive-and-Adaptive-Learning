let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");  
// draw on the screen to get the context, ask canvas  to get the 2d context

// snake axis
class SnakePart {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
// speed of the game
let speed = 7;
// size and count of a tile 
let tileCount = 20;
let tileSize = Math.floor(canvas.width / tileCount);
// head of the snake
let headX = 10;
let headY = 10;
let snakeParts = [];
let tailLength = 2;
// apple size
let appleX = 5;
let appleY = 5;
// movement
let inputsXVelocity = 0;
let inputsYVelocity = 0;

let xVelocity = 0;
let yVelocity = 0;

let score = 0;
let gulpSound = new Audio("gulp.mp3");

// Quiz Data
const QUIZ = [
  {
    question: "What is the capital of France?",
    options: ["Berlin", "London", "Paris", "Rome"],
    answer: "Paris"
  },
  {
    question: "2 + 2 = ?",
    options: ["3", "4", "5", "2"],
    answer: "4"
  },
  {
    question: "Which is a mammal?",
    options: ["Shark", "Dolphin", "Trout", "Octopus"],
    answer: "Dolphin"
  },
  {
    question: "Largest planet?",
    options: ["Earth", "Mars", "Jupiter", "Venus"],
    answer: "Jupiter"
  },
  {
    question: "Python is a ...",
    options: ["Snake", "Programming Language", "Car", "Fruit"],
    answer: "Programming Language"
  },
  {
    question: "HTML stands for?",
    options: ["Hyper Trainer Marking Language", "Hyper Text Markup Language", "Hyper Text Marketing Language", "Hyper Text Markup Leveler"],
    answer: "Hyper Text Markup Language"
  },
  {
    question: "Which is NOT a programming language?",
    options: ["Python", "Java", "HTML", "C++"],
    answer: "HTML"
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Earth", "Mars", "Jupiter", "Saturn"],
    answer: "Mars"
  },
  {
    question: "What is the boiling point of water?",
    options: ["90°C", "100°C", "80°C", "120°C"],
    answer: "100°C"
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    answer: "William Shakespeare"
  }
];

let questionIdx = 0;
let currentQuestion = QUIZ[questionIdx];
let eggPositions = [];
let eggsActive = true;

// UI Colors
const RIGHT_COLOR = "#43b581";
const WRONG_COLOR = "#f04747";
const PANEL_COLOR = "#23272a";
const TEXT_COLOR = "#fff";

let paused = false;
let questionHistory = [];

// Timer variables
let timerInterval = null;
let timeLeft = 15;
const TIMER_DURATION = 15;
let timerExpired = false;

// Helper to get random tile position (not on snake)
function randomEggPosition() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (
    (pos.x === headX && pos.y === headY) ||
    snakeParts.some(part => part.x === pos.x && part.y === pos.y) ||
    eggPositions.some(e => e.x === pos.x && e.y === pos.y)
  );
  return pos;
}

// Render question and eggs (options)
function renderQuestionAndEggs() {
  document.getElementById("question-area").textContent = currentQuestion.question;
  eggPositions = [];
  for (let i = 0; i < currentQuestion.options.length; i++) {
    eggPositions.push(randomEggPosition());
  }
  const optionsArea = document.getElementById("options-area");
  optionsArea.innerHTML = "";
  currentQuestion.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "egg-option";
    btn.textContent = String.fromCharCode(65 + idx) + ": " + opt;
    btn.onclick = () => handleEggClick(idx);
    btn.disabled = paused;
    optionsArea.appendChild(btn);
  });
  updateScoreDisplay();
  updateHistoryPanel();
  startTimer();
}

function startTimer() {
  clearTimer();
  timeLeft = TIMER_DURATION;
  timerExpired = false;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    if (paused) return;
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      timerExpired = true;
      clearTimer();
      handleTimeUp();
    }
  }, 1000);
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  const timer = document.getElementById('timer');
  timer.innerHTML = `⏳ Time: ${timeLeft}s`;
  if (timeLeft <= 5) {
    timer.style.color = '#ff4646';
  } else {
    timer.style.color = 'var(--secondary)';
  }
}

// Handle egg selection (by click or snake collision)
function handleEgg(idx) {
  clearTimer();
  const selected = currentQuestion.options[idx];
  const isCorrect = selected === currentQuestion.answer;
  if (isCorrect) {
    score++;
    tailLength++;
  }
  questionHistory.push({
    question: currentQuestion.question,
    correct: currentQuestion.answer,
    selected: selected,
    isCorrect: isCorrect
  });
  paused = true;
  eggsActive = false;
  updateScoreDisplay();
  updateHistoryPanel();
  showFeedback(isCorrect, idx);
  setTimeout(() => {
    questionIdx++;
    if (questionIdx >= QUIZ.length) {
      gameOver("Quiz Complete!");
      return;
    }
    currentQuestion = QUIZ[questionIdx];
    paused = false;
    eggsActive = true;
    renderQuestionAndEggs();
  }, 1500);
}

function showFeedback(isCorrect, selectedOption) {
    const options = document.querySelectorAll('.egg-option');
    const selectedBtn = options[selectedOption];
    const correctBtn = Array.from(options).find(btn => 
        btn.textContent.includes(currentQuestion.answer)
    );

    if (isCorrect) {
        selectedBtn.classList.add('correct');
        setTimeout(() => selectedBtn.classList.remove('correct'), 1000);
    } else {
        selectedBtn.classList.add('wrong');
        correctBtn.classList.add('correct');
        setTimeout(() => {
            selectedBtn.classList.remove('wrong');
            correctBtn.classList.remove('correct');
        }, 1000);
    }
}

function handleTimeUp() {
    if (!paused) {
        showFeedback(false, -1);
        nextQuestion();
    }
}

function nextQuestion() {
    questionIdx++;
    if (questionIdx >= QUIZ.length) {
        gameOver("Quiz Complete!");
        return;
    }
    currentQuestion = QUIZ[questionIdx];
    paused = false;
    eggsActive = true;
    renderQuestionAndEggs();
}

// For button click (for accessibility)
function handleEggClick(idx) {
  if (!eggsActive) return;
  handleEgg(idx);
}

// Overwrite checkAppleCollision to check for egg collision
function checkEggCollision() {
  if (!eggsActive) return;
  for (let i = 0; i < eggPositions.length; i++) {
    if (eggPositions[i].x === headX && eggPositions[i].y === headY) {
      handleEgg(i);
      break;
    }
  }
}

// Overwrite drawApple to draw eggs
function drawEggs() {
  for (let i = 0; i < eggPositions.length; i++) {
    ctx.beginPath();
    ctx.ellipse(
      eggPositions[i].x * tileSize + tileSize / 2,
      eggPositions[i].y * tileSize + tileSize / 2,
      (tileSize - 2) / 2, (tileSize - 2) / 2, 0, 0, 2 * Math.PI
    );
    ctx.fillStyle = ["#ffe066", "#ff6666", "#66b3ff", "#baffc9"][i % 4];
    ctx.fill();
    ctx.strokeStyle = "#aaa";
    ctx.stroke();
    // Draw A/B/C/D on egg
    ctx.fillStyle = "#222";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      String.fromCharCode(65 + i),
      eggPositions[i].x * tileCount + tileSize / 2,
      eggPositions[i].y * tileCount + tileSize / 2
    );
  }
}

// Overwrite drawGame for quiz logic
function drawGame() {
  if (paused) {
    window._gameLoopTimeout = setTimeout(drawGame, 1000 / speed);
    return;
  }
  xVelocity = inputsXVelocity;
  yVelocity = inputsYVelocity;

  changeSnakePosition();
  let result = checkGameOver();
  if (result) {
    return;
  }

  clearScreen();

  drawEggs();
  drawSnake();

  drawScore();

  checkEggCollision();

  window._gameLoopTimeout = setTimeout(drawGame, 1000 / speed);
}

// Overwrite gameOver to show message and disable controls
function gameOver() {
    paused = true;
    clearTimer();
    
    const overlay = document.getElementById('game-over-overlay');
    const finalScore = document.getElementById('final-score');
    finalScore.textContent = `Final Score: ${score} / ${QUIZ.length}`;
    overlay.classList.add('visible');
    
    // Remove keyboard controls
    document.body.removeEventListener("keydown", keyDown);
    
    // Stop the game loop
    if (window._gameLoopTimeout) {
        clearTimeout(window._gameLoopTimeout);
    }
}

function checkGameOver() {
    let gameOver = false;

    if (yVelocity === 0 && xVelocity === 0) {
        return false;
    }

    // Check for self-collision
    for (let i = 0; i < snakeParts.length; i++) {
        let part = snakeParts[i];
        if (part.x === headX && part.y === headY) {
            gameOver = true;
            break;
        }
    }

    if (gameOver) {
        gameOver();
    }

    return gameOver;
}

function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "10px Verdana";
  ctx.fillText("Score " + score, canvas.width - 50, 10);
}

function clearScreen() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
  ctx.fillStyle = "green";
  for (let i = 0; i < snakeParts.length; i++) {
    let part = snakeParts[i];
    ctx.fillRect(part.x * tileSize, part.y * tileSize, tileSize - 1, tileSize - 1);
  }

  snakeParts.push(new SnakePart(headX, headY)); //put an item at the end of the list next to the head
  while (snakeParts.length > tailLength) {
    snakeParts.shift(); // remove the furthet item from the snake parts if have more than our tail size.
  }

  ctx.fillStyle = "orange";
  ctx.fillRect(headX * tileSize, headY * tileSize, tileSize - 1, tileSize - 1);
}

function changeSnakePosition() {
  headX = headX + xVelocity;
  headY = headY + yVelocity;

  // Wrap around logic
  if (headX < 0) {
    headX = tileCount - 1;
  } else if (headX >= tileCount) {
    headX = 0;
  }
  if (headY < 0) {
    headY = tileCount - 1;
  } else if (headY >= tileCount) {
    headY = 0;
  }
}

function drawApple() {
  ctx.fillStyle = "red";
  ctx.fillRect(appleX * tileCount, appleY * tileCount, tileSize, tileSize);
}

function checkAppleCollision() {
  if (appleX === headX && appleY == headY) {
    appleX = Math.floor(Math.random() * tileCount);
    appleY = Math.floor(Math.random() * tileCount);
    tailLength++;
    score++;
    gulpSound.play();
  }
}

document.body.addEventListener("keydown", keyDown);

function keyDown(event) {
  //up
  if (event.keyCode == 38 || event.keyCode == 87) {
    //87 is w
    if (inputsYVelocity == 1) return;
    inputsYVelocity = -1;
    inputsXVelocity = 0;
  }

  //down
  if (event.keyCode == 40 || event.keyCode == 83) {
    // 83 is s
    if (inputsYVelocity == -1) return;
    inputsYVelocity = 1;
    inputsXVelocity = 0;
  }

  //left
  if (event.keyCode == 37 || event.keyCode == 65) {
    // 65 is a
    if (inputsXVelocity == 1) return;
    inputsYVelocity = 0;
    inputsXVelocity = -1;
  }

  //right
  if (event.keyCode == 39 || event.keyCode == 68) {
    //68 is d
    if (inputsXVelocity == -1) return;
    inputsYVelocity = 0;
    inputsXVelocity = 1;
  }
}

// Add/update score display in HTML
function updateScoreDisplay() {
  let scoreTag = document.getElementById("score-tag");
  if (!scoreTag) {
    scoreTag = document.createElement("div");
    scoreTag.id = "score-tag";
    scoreTag.style.margin = "8px";
    scoreTag.style.fontWeight = "bold";
    scoreTag.style.fontSize = "1.1em";
    scoreTag.style.color = TEXT_COLOR;
    scoreTag.style.textAlign = "center";
    document.body.insertBefore(scoreTag, document.getElementById("question-area"));
  }
  scoreTag.innerHTML = `🏆 Score: ${score}`;
}

function updateHistoryPanel() {
  let panel = document.getElementById("history-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "history-panel";
    panel.style.position = "fixed";
    panel.style.left = "0";
    panel.style.top = "0";
    panel.style.width = "260px";
    panel.style.height = "100vh";
    panel.style.background = PANEL_COLOR;
    panel.style.color = TEXT_COLOR;
    panel.style.overflowY = "auto";
    panel.style.padding = "16px 8px 16px 16px";
    panel.style.fontSize = "0.98em";
    panel.style.boxShadow = "2px 0 16px #111";
    panel.style.zIndex = "10";
    document.body.appendChild(panel);
    document.getElementById("game").style.marginLeft = "260px";
    document.getElementById("score-tag").style.marginLeft = "260px";
    document.getElementById("question-area").style.marginLeft = "260px";
    document.getElementById("options-area").style.marginLeft = "260px";
  }
  let html = `<div style="font-weight:bold; font-size:1.1em; margin-bottom:10px;">Questions Attempted</div>`;
  if (questionHistory.length === 0) {
    html += `<div style="color:#aaa;">No questions attempted yet.</div>`;
  } else {
    html += `<ol style="padding-left:18px;">`;
    questionHistory.forEach((q, idx) => {
      html += `<li style="margin-bottom:8px;">
        <div style="font-weight:bold; color:${q.isCorrect ? RIGHT_COLOR : WRONG_COLOR};">${q.question}</div>
        <div style="margin-left:8px;">
          <span>Your answer: <b style="color:${q.isCorrect ? RIGHT_COLOR : WRONG_COLOR}">${q.selected}</b></span><br>
          <span>Correct answer: <b style="color:${RIGHT_COLOR}">${q.correct}</b></span>
        </div>
      </li>`;
    });
    html += `</ol>`;
  }
  panel.innerHTML = html;
}

// Define showFeedback function
function showFeedback(isCorrect, selected, correct, isTimeout) {
  let overlay = document.getElementById("feedback-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "feedback-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(44,47,51,0.92)";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "1000";
    overlay.style.fontSize = "2em";
    overlay.style.color = TEXT_COLOR;
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div style="padding: 32px 48px; background: #23272a; border-radius: 16px; box-shadow: 0 0 32px #111;">
      <div style="font-size:2em; font-weight:bold; color:${isTimeout ? '#ff2222' : (isCorrect ? RIGHT_COLOR : WRONG_COLOR)}; margin-bottom: 12px;">
        ${isTimeout ? "Time's up!" : (isCorrect ? "Correct!" : "Wrong!")}
      </div>
      <div style="font-size:1.1em; margin-bottom: 8px;">
        Your answer: <b style="color:${isTimeout ? '#ff2222' : (isCorrect ? RIGHT_COLOR : WRONG_COLOR)}">${selected}</b>
      </div>
      <div style="font-size:1.1em;">
        Correct answer: <b style="color:${RIGHT_COLOR}">${correct}</b>
      </div>
    </div>
  `;
  setTimeout(() => {
    if (overlay) overlay.remove();
  }, 1400);
}

// On load, render first question and eggs
renderQuestionAndEggs();
// Only start the game loop once
if (typeof window._snakeGameStarted === 'undefined') {
  window._snakeGameStarted = true;
  drawGame();
}