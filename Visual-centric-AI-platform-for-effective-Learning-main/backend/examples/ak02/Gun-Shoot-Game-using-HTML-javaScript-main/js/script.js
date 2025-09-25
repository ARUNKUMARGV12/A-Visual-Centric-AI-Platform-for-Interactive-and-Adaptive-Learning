$(document).ready(()=>{
    $("#canvas").html("");
    setupYesNoBalloonGame();
});

// Yes/No Balloon Game Data
const yesNoQuestions = [
    // Easy
    {q: "The sun rises in the east.", a: true},
    {q: "An octopus has five legs.", a: false},
    {q: "Water boils at 100°C.", a: true},
    {q: "A triangle can have two right angles.", a: false},
    {q: "The capital of France is Paris.", a: true},
    {q: "Photosynthesis occurs in animal cells.", a: false},
    {q: "The sun is a star.", a: true},
    {q: "Bats are mammals.", a: true},
    {q: "The chemical symbol for oxygen is Ox.", a: false},
    {q: "Humans have 206 bones.", a: true},
    {q: "Humans have 306 bones.", a: false},
    {q: "Gold is heavier than silver.", a: true},
    {q: "The Great Wall of China is the longest wall in the world.", a: true},
    {q: "Lightning is hotter than the surface of the sun.", a: true},
    {q: "Humans have more than five senses.", a: true},
    {q: "The Earth’s atmosphere is mostly nitrogen.", a: true},
    {q: "The human heart has four chambers.", a: true},
    {q: "The Earth orbits the Sun.", a: true},
    {q: "A penguin can fly.", a: false},
    {q: "Light travels faster than sound.", a: true},
    // Medium/Hard
    {q: "Mercury is the hottest planet in the solar system.", a: false},
    {q: "Venus is the closest planet to the Sun.", a: false},
    {q: "The chemical symbol for gold is Au.", a: true},
    {q: "Mount Everest is over 8,000 meters tall.", a: true},
    {q: "The speed of light is about 300,000 km per second.", a: true},
    {q: "Sharks are mammals.", a: false},
    {q: "The Pacific Ocean is the largest ocean on Earth.", a: true},
    {q: "The Mona Lisa was painted by Leonardo da Vinci.", a: true},
    {q: "The square root of 64 is 6.", a: false},
    {q: "The Statue of Liberty is in Los Angeles.", a: false},
    {q: "The chemical formula for table salt is NaCl.", a: true},
    {q: "The human body has 12 pairs of ribs.", a: false},
    {q: "The currency of Japan is the yen.", a: true},
    {q: "Albert Einstein developed the theory of relativity.", a: true},
    {q: "The Amazon is the longest river in the world.", a: false},
    {q: "The freezing point of water is 0°C.", a: true},
    {q: "The Eiffel Tower is taller than the Empire State Building.", a: false},
    {q: "The largest planet in our solar system is Jupiter.", a: true},
    {q: "Sound travels faster in air than in water.", a: false}
];
let currentYesNoIndex = 0;
let yesNoScore = 0;
let yesNoBalloonInterval;
let yesNoBalloonList = [];

// Track attempted questions
let yesNoAttemptLog = [];

function setupYesNoBalloonGame() {
    renderYesNoScore();
    renderYesNoQuestion();
    renderYesNoLegend();
    startYesNoBalloons();
}

function renderYesNoQuestion() {
    // Show the question at the top center, big and bold
    let html = `<div class='yesno-question-box' style='position:absolute;top:20px;left:50%;transform:translateX(-50%);z-index:10;width:500px;display:flex;align-items:center;justify-content:center;'>`;
    html += `<div style='font-size:2.2rem;font-weight:bold;flex:1;text-align:center;'>${yesNoQuestions[currentYesNoIndex].q}</div>`;
    html += `</div>`;
    $("#canvas .yesno-question-box").remove();
    $("#canvas").append(html);
    renderYesNoAttemptLog();
}

// Move previously attempted questions to the right side
function renderYesNoAttemptLog() {
    // Place the attempt log to the right of the question box, not above
    let logHtml = `<div class='yesno-attempt-log bg-light p-2' style='position:absolute;top:20px;left:calc(50% + 270px);width:320px;z-index:12;border-radius:8px;border:1px solid #ccc;'>`;
    logHtml += `<div class='font-weight-bold mb-2'>Previously Attempted</div>`;
    if (yesNoAttemptLog.length === 0) {
        logHtml += `<div class='text-muted'>No attempts yet.</div>`;
    } else {
        logHtml += `<ul style='padding-left:18px;'>`;
        yesNoAttemptLog.slice(-5).reverse().forEach(entry => {
            logHtml += `<li style='margin-bottom:6px;'>${entry.q} <span style='font-weight:bold;padding:2px 10px;border-radius:6px;' class='${entry.a ? "bg-success text-white" : "bg-danger text-white"}'>${entry.a ? "True" : "False"}</span></li>`;
        });
        logHtml += `</ul>`;
    }
    logHtml += `</div>`;
    $("#canvas .yesno-attempt-log").remove();
    $("#canvas").append(logHtml);
}

function renderYesNoLegend() {
    // Place the legend statically at the bottom left and right of the canvas
    $("#canvas .yesno-legend-false").remove();
    $("#canvas .yesno-legend-true").remove();
    // Left bottom for False
    $("#canvas").append(`<div class='yesno-legend-false' style='position:absolute;left:30px;bottom:20px;z-index:20;font-size:1.3rem;color:#ff5f6d;font-weight:bold;text-shadow:0 2px 8px #232526;'>
        <span class='ballon ballon-red' style='width:30px;height:40px;display:inline-block;vertical-align:middle;margin-right:8px;'></span>False
    </div>`);
    // Right bottom for True
    $("#canvas").append(`<div class='yesno-legend-true' style='position:absolute;right:30px;bottom:20px;z-index:20;font-size:1.3rem;color:#43e97b;font-weight:bold;text-shadow:0 2px 8px #232526;'>
        <span class='ballon ballon-green' style='width:30px;height:40px;display:inline-block;vertical-align:middle;margin-right:8px;'></span>True
    </div>`);
}

// Update legend position on every balloon move
function moveYesNoBalloons() {
    for (let i = 0; i < yesNoBalloonList.length; i++) {
        const b = yesNoBalloonList[i];
        b.bottom += b.speed;
        $("#"+b.id).css('bottom', b.bottom + 'px');
        if (b.bottom > 400) {
            // Remove balloon and respawn
            $("#"+b.id).remove();
            yesNoBalloonList.splice(i, 1);
            spawnYesNoBalloon();
            i--;
        }
    }
    // No legend update here
}

function renderYesNoScore() {
    // Show the score card at the left side of the canvas
    let scoreHtml = `<div class='yesno-score bg-light p-2' style='position:absolute;top:30px;left:10px;width:150px;z-index:11;border-radius:8px;border:1px solid #ccc;'>`;
    scoreHtml += `<div class='font-weight-bold mb-2'>Score Card</div>`;
    scoreHtml += `<div style='font-size:1.5rem;'>Score: <span class='text-primary'>${yesNoScore}</span></div>`;
    scoreHtml += `</div>`;
    $("#canvas .yesno-score").remove();
    $("#canvas").append(scoreHtml);
}

function startYesNoBalloons() {
    // Remove any existing balloons and intervals
    yesNoBalloonList = [];
    $("#canvas .yesno-ballon").remove();
    if (yesNoBalloonInterval) clearInterval(yesNoBalloonInterval);
    // Spawn multiple balloons (randomly true/false)
    for (let i = 0; i < 6; i++) {
        spawnYesNoBalloon();
    }
    yesNoBalloonInterval = setInterval(moveYesNoBalloons, 40);
}

function spawnYesNoBalloon() {
    const isTrue = Math.random() > 0.5;
    const colorClass = isTrue ? 'ballon-green' : 'ballon-red';
    const answer = isTrue;
    const left = Math.floor(Math.random() * ($("#canvas").width() - 60));
    const id = 'yesno-ballon-' + Math.random().toString(36).substr(2, 9);
    $("#canvas").append(`<div id='${id}' class='ballon yesno-ballon ${colorClass}' style='bottom: 0px; left: ${left}px; cursor:pointer;'><div class='dhaga'></div></div>`);
    // Slow down the speed: random between 1 and 2
    yesNoBalloonList.push({id, answer, bottom: 0, speed: Math.random() + 1});
    $("#"+id).on('click', function() { handleYesNoBalloonClick(id); });
}

function handleYesNoBalloonClick(id) {
    const bIndex = yesNoBalloonList.findIndex(b => b.id === id);
    if (bIndex === -1) return;
    const b = yesNoBalloonList[bIndex];
    // Log the attempt
    yesNoAttemptLog.push({q: yesNoQuestions[currentYesNoIndex].q, a: b.answer});
    // Check answer
    if (b.answer === yesNoQuestions[currentYesNoIndex].a) {
        yesNoScore++;
        renderYesNoScore();
        // Next question
        currentYesNoIndex = (currentYesNoIndex + 1) % yesNoQuestions.length;
        renderYesNoQuestion();
        renderYesNoLegend();
    } else {
        // Wrong answer, just remove the balloon
        $("#"+b.id).remove();
        yesNoBalloonList.splice(bIndex, 1);
        spawnYesNoBalloon();
    }
}