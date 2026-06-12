// ============================================================
// AGROHERÓIS - MISSÃO SUSTENTÁVEL (VERSÃO APRIMORADA)
// ============================================================

// ---------- ESTADO GLOBAL ----------
let playerName = "";
let gender = "boy";
let totalScore = 0;
let currentPhase = 0;   // 0-apresentação, 1-abelhas, 2-compostagem, 3-plantio, 4-quiz, 5-certificado
let achievements = { bees: false, compost: false, farming: false, hero: false };

// Minijogo Abelha
let beeActive = false;
let beeX, beeY;
let flowers = [], smokes = [], fires = [];
let flowersCollected = 0;
let animationId = null;
let keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
let canvas, ctx;

// Compostagem
let correctCompost = 0;
const COMPOST_NEED = 5;

// Plantio
let plantsPlanted = 0;
let isWatered = false;

// Quiz
let quizHits = 0;

// ---------- DOM ----------
const gameScreen = document.getElementById("gameScreen");
const scoreSpan = document.getElementById("score");
const badgesSpan = document.getElementById("badges");
const progressBar = document.getElementById("globalProgress");
const progressPercent = document.getElementById("progressPercent");
const felipeMsg = document.getElementById("felipeMessage");

// helpers
function updateUI() {
    scoreSpan.innerText = totalScore;
    let total = Object.values(achievements).filter(v => v).length;
    badgesSpan.innerText = total;
    let progress = 0;
    if (achievements.bees) progress += 25;
    if (achievements.compost) progress += 25;
    if (achievements.farming) progress += 25;
    if (achievements.hero) progress += 25;
    progressBar.value = progress;
    progressPercent.innerText = progress + "%";
}

function showFeedback(msg, isSuccess = true) {
    const div = document.createElement("div");
    div.className = "feedback";
    div.innerText = msg;
    div.style.backgroundColor = isSuccess ? "#2e7d32" : "#b22234";
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 1800);
}

function setFelipeMessage(msg) {
    felipeMsg.innerText = msg;
}

function unlockAchievement(key, title) {
    if (!achievements[key]) {
        achievements[key] = true;
        showFeedback(`🏅 CONQUISTA: ${title}`, true);
        updateUI();
    }
}

// ---------- FASE 0: APRESENTAÇÃO ----------
function phase0() {
    gameScreen.innerHTML = `
        <div class="card">
            <h2>🌾 Bem-vindo, futuro AgroHerói!</h2>
            <div class="form-group">
                <label>👤 Seu nome:</label>
                <input type="text" id="playerNameInput" placeholder="Digite seu nome" autocomplete="off">
            </div>
            <div class="form-group">
                <label>🧑‍🌾 Escolha seu avatar:</label><br>
                <button id="boyBtn">👦 Menino</button>
                <button id="girlBtn">👧 Menina</button>
            </div>
            <button id="startBtn" style="background:#f3b33d;">🌱 Iniciar Missão</button>
        </div>
    `;
    setFelipeMessage("Olá! Sou Felipe. Vamos aprender sobre sustentabilidade no campo. Qual é o seu nome?");

    document.getElementById("boyBtn")?.addEventListener("click", () => {
        gender = "boy";
        showFeedback("Avatar Menino selecionado!");
    });
    document.getElementById("girlBtn")?.addEventListener("click", () => {
        gender = "girl";
        showFeedback("Avatar Menina selecionada!");
    });
    document.getElementById("startBtn")?.addEventListener("click", () => {
        const input = document.getElementById("playerNameInput");
        if (!input.value.trim()) {
            showFeedback("Digite seu nome primeiro!", false);
            return;
        }
        playerName = input.value.trim();
        setFelipeMessage(`Prazer, ${playerName}! Você agora é um AgroHerói. Vamos proteger os polinizadores!`);
        currentPhase = 1;
        phase1();
    });
}

// ---------- FASE 1: ABELHAS (Canvas + Teclado) ----------
function phase1() {
    gameScreen.innerHTML = `
        <div class="card">
            <h2>🐝 Salvando os Polinizadores</h2>
            <p>🕹️ Use as <strong>setas do teclado</strong> para mover a abelha. Colete 10 flores e desvie da fumaça/fogo!</p>
            <canvas id="beeCanvas" width="850" height="450" class="canvas-game"></canvas>
            <div style="text-align:center; margin-top:16px;">🌸 Flores coletadas: <span id="flowerCount">0</span> / 10</div>
            <button id="resetBeeBtn">🔄 Reiniciar fase</button>
        </div>
    `;

    setFelipeMessage(`${playerName}, as abelhas são vitais para a agricultura. Salve-as!`);

    canvas = document.getElementById("beeCanvas");
    ctx = canvas.getContext("2d");

    // Ajuste responsivo do canvas
    const resizeCanvas = () => {
        const container = canvas.parentElement;
        const maxWidth = container.clientWidth - 40;
        if (maxWidth < 850) {
            canvas.style.width = "100%";
            canvas.style.height = "auto";
        } else {
            canvas.style.width = "850px";
        }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    beeX = canvas.width / 2;
    beeY = canvas.height / 2;
    flowers = [];
    smokes = [];
    fires = [];
    flowersCollected = 0;
    document.getElementById("flowerCount").innerText = flowersCollected;

    for (let i = 0; i < 12; i++) flowers.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
    for (let i = 0; i < 6; i++) smokes.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
    for (let i = 0; i < 4; i++) fires.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });

    beeActive = true;

    function updateMovement() {
        let speed = 5.5;
        if (keys.ArrowUp) beeY -= speed;
        if (keys.ArrowDown) beeY += speed;
        if (keys.ArrowLeft) beeX -= speed;
        if (keys.ArrowRight) beeX += speed;
        beeX = Math.min(Math.max(beeX, 18), canvas.width - 18);
        beeY = Math.min(Math.max(beeY, 18), canvas.height - 18);

        // coleta flores
        for (let i = 0; i < flowers.length; i++) {
            let f = flowers[i];
            if (Math.hypot(beeX - f.x, beeY - f.y) < 22) {
                flowers.splice(i, 1);
                flowersCollected++;
                totalScore += 10;
                updateUI();
                document.getElementById("flowerCount").innerText = flowersCollected;
                showFeedback("+10 pts | Flor protegida!", true);
                break;
            }
        }
        // colisão perigos
        for (let s of smokes) {
            if (Math.hypot(beeX - s.x, beeY - s.y) < 24) {
                totalScore = Math.max(0, totalScore - 5);
                updateUI();
                showFeedback("-5 pts! Evite a fumaça!", false);
                beeX = 40; beeY = 40;
            }
        }
        for (let f of fires) {
            if (Math.hypot(beeX - f.x, beeY - f.y) < 24) {
                totalScore = Math.max(0, totalScore - 5);
                updateUI();
                showFeedback("-5 pts! Fogo queima a vegetação!", false);
                beeX = 40; beeY = 40;
            }
        }

        if (flowersCollected >= 10) {
            beeActive = false;
            if (animationId) cancelAnimationFrame(animationId);
            unlockAchievement("bees", "Guardião das Abelhas");
            setFelipeMessage(`Excelente, ${playerName}! Você protegeu os polinizadores. Agora, compostagem!`);
            currentPhase = 2;
            phase2();
        }
    }

    function drawGame() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#c5e3a2";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // flores
        flowers.forEach(f => {
            ctx.beginPath();
            ctx.arc(f.x, f.y, 9, 0, Math.PI * 2);
            ctx.fillStyle = "#ffbb77";
            ctx.fill();
            ctx.fillStyle = "#e67e22";
            ctx.beginPath();
            ctx.arc(f.x - 2, f.y - 2, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        // fumaças
        smokes.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, 14, 0, Math.PI * 2);
            ctx.fillStyle = "#8a8a8a";
            ctx.fill();
        });
        // fogo
        fires.forEach(f => {
            ctx.beginPath();
            ctx.arc(f.x, f.y, 13, 0, Math.PI * 2);
            ctx.fillStyle = "#e67e22";
            ctx.fill();
            ctx.fillStyle = "#c0392b";
            ctx.beginPath();
            ctx.arc(f.x - 3, f.y - 3, 5, 0, Math.PI * 2);
            ctx.fill();
        });
        // abelha
        ctx.fillStyle = "#f5c542";
        ctx.beginPath();
        ctx.ellipse(beeX, beeY, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2c2b26";
        ctx.beginPath();
        ctx.ellipse(beeX - 6, beeY - 3, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(beeX + 6, beeY - 3, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function gameLoop() {
        if (!beeActive) return;
        updateMovement();
        drawGame();
        animationId = requestAnimationFrame(gameLoop);
    }

    gameLoop();

    // eventos teclado
    const keydownHandler = (e) => {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = true;
            e.preventDefault();
        }
    };
    const keyupHandler = (e) => {
        if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
    };
    window.addEventListener("keydown", keydownHandler);
    window.addEventListener("keyup", keyupHandler);

    document.getElementById("resetBeeBtn")?.addEventListener("click", () => {
        beeActive = false;
        cancelAnimationFrame(animationId);
        window.removeEventListener("keydown", keydownHandler);
        window.removeEventListener("keyup", keyupHandler);
        phase1();
    });
}

// ---------- FASE 2: COMPOSTAGEM (Drag & Drop) ----------
function phase2() {
    gameScreen.innerHTML = `
        <div class="card">
            <h2>♻️ Compostagem Inteligente</h2>
            <p>Arraste os <strong>resíduos orgânicos</strong> para a composteira. Evite lixo não biodegradável.</p>
            <div class="compost-bin" id="compostBin">🗑️ COMPOSTEIRA 🌱</div>
            <div id="itemsContainer" style="margin: 20px 0;"></div>
            <p>✅ Acertos: <span id="compostCorrect">0</span> / ${COMPOST_NEED}</p>
            <button id="resetCompostBtn">↺ Reiniciar Fase</button>
        </div>
    `;

    correctCompost = 0;
    const itens = [
        { nome: "🍌 Casca de banana", tipo: "org" }, { nome: "🍎 Casca de maçã", tipo: "org" },
        { nome: "🍂 Folhas secas", tipo: "org" }, { nome: "🥬 Restos de verdura", tipo: "org" },
        { nome: "🔋 Pilha", tipo: "bad" }, { nome: "🥫 Lata de alumínio", tipo: "bad" },
        { nome: "🥤 Garrafa PET", tipo: "bad" }
    ];

    const container = document.getElementById("itemsContainer");
    itens.forEach(item => {
        const div = document.createElement("div");
        div.innerText = item.nome;
        div.setAttribute("draggable", "true");
        div.classList.add("drag-item");
        div.setAttribute("data-type", item.tipo);
        div.addEventListener("dragstart", e => {
            e.dataTransfer.setData("text/plain", JSON.stringify({ type: item.tipo, name: item.nome }));
        });
        container.appendChild(div);
    });

    const compostArea = document.getElementById("compostBin");
    compostArea.addEventListener("dragover", e => e.preventDefault());
    compostArea.addEventListener("drop", e => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        if (data.type === "org") {
            correctCompost++;
            totalScore += 10;
            updateUI();
            showFeedback(`+10: ${data.name} -> compostagem!`, true);
        } else {
            totalScore = Math.max(0, totalScore - 5);
            updateUI();
            showFeedback(`-5: ${data.name} não é orgânico!`, false);
        }
        document.getElementById("compostCorrect").innerText = correctCompost;
        if (correctCompost >= COMPOST_NEED) {
            unlockAchievement("compost", "Mestre da Compostagem");
            setFelipeMessage(`Incrível, ${playerName}! Você produziu adubo natural. Vamos plantar!`);
            currentPhase = 3;
            phase3();
        }
    });

    document.getElementById("resetCompostBtn")?.addEventListener("click", () => phase2());
    setFelipeMessage("Separe corretamente: orgânicos viram adubo, rejeitos não!");
}

// ---------- FASE 3: PLANTIO ----------
function phase3() {
    gameScreen.innerHTML = `
        <div class="card">
            <h2>🌽 Plantando o Futuro</h2>
            <p>Arraste cada muda para o canteiro correspondente e depois regue.</p>
            <div class="garden-grid" id="gardenPlots">
                <div class="plot" data-crop="tomato">🍅 Tomate</div>
                <div class="plot" data-crop="lettuce">🥬 Alface</div>
                <div class="plot" data-crop="corn">🌽 Milho</div>
            </div>
            <div id="seedlingsArea">
                <div class="seedling" draggable="true" data-crop="tomato">🍅 Muda de Tomate</div>
                <div class="seedling" draggable="true" data-crop="lettuce">🥬 Muda de Alface</div>
                <div class="seedling" draggable="true" data-crop="corn">🌽 Muda de Milho</div>
            </div>
            <button id="waterBtn" disabled>💧 Regar Plantação</button>
            <div id="growthAnimation" style="margin-top:20px;"></div>
        </div>
    `;

    plantsPlanted = 0;
    isWatered = false;

    const seedlings = document.querySelectorAll(".seedling");
    const plots = document.querySelectorAll(".plot");

    seedlings.forEach(seed => {
        seed.addEventListener("dragstart", e => {
            e.dataTransfer.setData("text/plain", seed.getAttribute("data-crop"));
        });
    });
    plots.forEach(plot => {
        plot.addEventListener("dragover", e => e.preventDefault());
        plot.addEventListener("drop", e => {
            e.preventDefault();
            const crop = e.dataTransfer.getData("text/plain");
            if (plot.getAttribute("data-crop") === crop && !plot.innerText.includes("🌱")) {
                plot.innerHTML += " 🌱";
                plantsPlanted++;
                totalScore += 15;
                updateUI();
                showFeedback("Muda plantada corretamente!", true);
                if (plantsPlanted === 3) document.getElementById("waterBtn").disabled = false;
            } else {
                totalScore = Math.max(0, totalScore - 5);
                updateUI();
                showFeedback("Canteiro errado para essa muda", false);
            }
        });
    });

    document.getElementById("waterBtn").addEventListener("click", () => {
        if (plantsPlanted === 3 && !isWatered) {
            isWatered = true;
            showFeedback("💦 Você regou as plantas! Elas cresceram fortes.", true);
            document.getElementById("growthAnimation").innerHTML = "<p style='font-size:1.4rem'>🌱 → 🌿 → 🍅🥬🌽</p><p>Colheita sustentável realizada!</p>";
            totalScore += 30;
            updateUI();
            unlockAchievement("farming", "Agricultor Sustentável");
            setFelipeMessage(`Parabéns, ${playerName}! Você produziu alimentos de forma ecológica. Quiz final!`);
            currentPhase = 4;
            phase4();
        } else if (!isWatered) showFeedback("Plante todas as mudas antes de regar!", false);
    });
    setFelipeMessage("Plante cada muda no lugar certo. Depois, regue com carinho!");
}

// ---------- QUIZ FINAL ----------
function phase4() {
    gameScreen.innerHTML = `
        <div class="card">
            <h2>📝 Quiz do AgroHerói</h2>
            <div id="q1"><p>1️⃣ Qual a principal função das abelhas?</p><button data-resp="0">Produzir mel</button><button data-resp="1">Polinizar plantas ✅</button><button data-resp="2">Fazer barulho</button></div>
            <div id="q2"><p>2️⃣ O que pode ir para a composteira?</p><button data-resp="0">Casca de banana ✅</button><button data-resp="1">Pilha</button><button data-resp="2">Garrafa PET</button></div>
            <div id="q3"><p>3️⃣ Prática sustentável no campo?</p><button data-resp="0">Queimada</button><button data-resp="1">Desmatamento</button><button data-resp="2">Compostagem e preservação ✅</button></div>
            <button id="finishQuizBtn" style="margin-top:25px;">✅ Finalizar Quiz</button>
        </div>
    `;

    quizHits = 0;
    const allBtns = document.querySelectorAll("[data-resp]");
    allBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const parent = btn.parentElement;
            const val = parseInt(btn.getAttribute("data-resp"));
            let correct = false;
            if (parent.id === "q1" && val === 1) correct = true;
            if (parent.id === "q2" && val === 0) correct = true;
            if (parent.id === "q3" && val === 2) correct = true;
            if (correct) {
                btn.style.background = "#2ecc71";
                showFeedback("Resposta correta!", true);
                quizHits++;
            } else {
                btn.style.background = "#e74c3c";
                showFeedback("Resposta incorreta. Revisite os conceitos!", false);
            }
            parent.querySelectorAll("button").forEach(b => b.disabled = true);
        });
    });

    document.getElementById("finishQuizBtn").addEventListener("click", () => {
        if (quizHits === 3) {
            unlockAchievement("hero", "🏆 Herói do Agro Sustentável");
            totalScore += 100;
            updateUI();
            currentPhase = 5;
            phase5();
        } else {
            showFeedback("Você errou algumas perguntas. Reinicie o jogo para tentar novamente.", false);
        }
    });
    setFelipeMessage("Vamos testar seus conhecimentos sobre sustentabilidade!");
}

// ---------- CERTIFICADO E TELA FINAL ----------
function phase5() {
    gameScreen.innerHTML = `
        <div class="card" style="text-align:center;">
            <h2>🏅 CERTIFICADO AGROHERÓI</h2>
            <p>Certificamos que <strong>${playerName}</strong> completou a missão <strong>"AGROHERÓIS: A MISSÃO SUSTENTÁVEL"</strong> com excelência em práticas ecológicas, proteção aos polinizadores, compostagem e plantio sustentável.</p>
            <button id="downloadCert">📄 Baixar Certificado (Imprimir)</button>
            <hr style="margin: 24px 0;">
            <div style="background:#e4f5cf; border-radius:48px; padding:22px;">
                🌳🐝🌱🚜☀️
                <h3>Agricultura + Natureza = Futuro Vivo</h3>
                <p>"Produzir alimentos e preservar a natureza caminham juntos."</p>
                <button id="playAgain">🔄 Jogar Novamente</button>
                <button id="menuAgain">🏠 Menu Principal</button>
            </div>
        </div>
    `;
    setFelipeMessage(`${playerName}, você é um verdadeiro guardião do agro sustentável! Continue assim.`);

    document.getElementById("downloadCert")?.addEventListener("click", () => window.print());
    document.getElementById("playAgain")?.addEventListener("click", () => location.reload());
    document.getElementById("menuAgain")?.addEventListener("click", () => location.reload());
}

// ---------- INICIALIZAÇÃO E ACESSIBILIDADE ----------
function initGame() {
    phase0();
    updateUI();
}

// Controles externos
document.getElementById("darkModeBtn")?.addEventListener("click", () => document.body.classList.toggle("dark"));
document.getElementById("highContrastBtn")?.addEventListener("click", () => document.body.classList.toggle("high-contrast"));
let fontLevel = 0;
document.getElementById("fontPlusBtn")?.addEventListener("click", () => {
    if (fontLevel === 0) { document.body.classList.add("font-large"); fontLevel = 1; }
    else if (fontLevel === 1) { document.body.classList.remove("font-large"); document.body.classList.add("font-xlarge"); fontLevel = 2; }
});
document.getElementById("fontMinusBtn")?.addEventListener("click", () => {
    if (fontLevel === 2) { document.body.classList.remove("font-xlarge"); document.body.classList.add("font-large"); fontLevel = 1; }
    else if (fontLevel === 1) { document.body.classList.remove("font-large"); fontLevel = 0; }
});
document.getElementById("resetGameBtn")?.addEventListener("click", () => location.reload());
document.getElementById("menuBtn")?.addEventListener("click", () => location.reload());

initGame();
