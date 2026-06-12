// =========================================================================
// AGROHERÓIS - JOGO EDUCATIVO COMPLETO
// Fases: Apresentação, Abelhas (canvas/teclado), Compostagem (drag&drop),
//        Plantio (drag&drop + regar), Quiz, Certificado.
// Funcionalidades extras: modo escuro, alto contraste, fonte, reiniciar, menu.
// =========================================================================

// ------------------------- ESTADO GLOBAL -------------------------
let playerName = "";
let gender = "boy";
let totalScore = 0;
let currentPhase = 0;   // 0=apresentação, 1=abelhas, 2=compostagem, 3=plantio, 4=quiz, 5=certificado
let achievements = { bees: false, compost: false, farming: false, hero: false };

// variáveis da fase abelhas
let beeActive = false;
let beeX, beeY;
let flowers = [], smokes = [], fires = [];
let flowersCollected = 0;
let animFrameId;
let keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
let canvas, ctx;
let keydownHandler, keyupHandler;

// compostagem
let compostCorrect = 0;
const COMPOST_NEED = 5;

// plantio
let plantedCount = 0;
let isWatered = false;

// quiz
let quizHits = 0;

// ------------------------- DOM elements -------------------------
const gameMain = document.getElementById("gameMain");
const totalScoreSpan = document.getElementById("totalScore");
const totalBadgesSpan = document.getElementById("totalBadges");
const globalProgress = document.getElementById("globalProgress");
const progressPercentSpan = document.getElementById("progressPercent");
const felipeSpeech = document.getElementById("felipeSpeech");

// ------------------------- FUNÇÕES AUXILIARES -------------------------
function updateUI() {
    totalScoreSpan.innerText = totalScore;
    let totalBadges = Object.values(achievements).filter(v => v === true).length;
    totalBadgesSpan.innerText = totalBadges;
    let progress = 0;
    if (achievements.bees) progress += 25;
    if (achievements.compost) progress += 25;
    if (achievements.farming) progress += 25;
    if (achievements.hero) progress += 25;
    globalProgress.value = progress;
    progressPercentSpan.innerText = progress + "%";
}

function showToast(msg, isSuccess = true) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = msg;
    toast.style.backgroundColor = isSuccess ? "#2e7d32" : "#b52b1e";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
}

function setFelipeMessage(msg) {
    felipeSpeech.innerText = msg;
}

function unlockAchievement(key, title) {
    if (!achievements[key]) {
        achievements[key] = true;
        showToast(`🏅 CONQUISTA: ${title}`, true);
        updateUI();
    }
}

// ------------------------- FASE 0: APRESENTAÇÃO -------------------------
function phase0() {
    gameMain.innerHTML = `
        <div class="card">
            <h2>🌾 Bem-vindo à Fazenda Sustentável 🌻</h2>
            <div class="form-group">
                <label>👤 Seu nome:</label>
                <input type="text" id="playerNameInput" placeholder="Digite seu nome" autocomplete="off">
            </div>
            <div class="form-group">
                <label>🧑‍🌾 Escolha seu personagem:</label><br>
                <button id="boyChoice">👦 Menino</button>
                <button id="girlChoice">👧 Menina</button>
            </div>
            <button id="startMissionBtn">🌱 INICIAR MISSÃO</button>
        </div>
    `;
    setFelipeMessage("Olá! Eu sou Felipe. Como você se chama? Vamos salvar o planeta! 🌎");

    document.getElementById("boyChoice")?.addEventListener("click", () => {
        gender = "boy";
        showToast("👦 Personagem Menino selecionado!", true);
    });
    document.getElementById("girlChoice")?.addEventListener("click", () => {
        gender = "girl";
        showToast("👧 Personagem Menina selecionada!", true);
    });
    document.getElementById("startMissionBtn")?.addEventListener("click", () => {
        const nameInput = document.getElementById("playerNameInput");
        if (!nameInput.value.trim()) {
            showToast("❌ Digite seu nome primeiro!", false);
            return;
        }
        playerName = nameInput.value.trim();
        setFelipeMessage(`Prazer, ${playerName}! Agora você é um AgroHerói. Vamos proteger os polinizadores! 🐝`);
        currentPhase = 1;
        phase1();
    });
}

// ------------------------- FASE 1: ABELHAS (CANVAS + SETAS) -------------------------
function phase1() {
    gameMain.innerHTML = `
        <div class="card">
            <h2>🐝 Salvando os Polinizadores</h2>
            <p>🕹️ Use as <strong>setas do teclado</strong> para mover a abelha. Colete 10 flores 🌸 e desvie da fumaça 💨 e do fogo 🔥!</p>
            <canvas id="beeCanvas" width="950" height="500" class="bee-canvas"></canvas>
            <div style="text-align:center; margin-top: 20px; font-size:1.2rem;">🌸 Flores coletadas: <span id="flowerCount">0</span> / 10</div>
            <button id="resetBeeBtn" style="margin-top:20px;">🔄 Reiniciar fase</button>
        </div>
    `;

    setFelipeMessage(`${playerName}, as abelhas polinizam 75% das plantas. Vamos salvá-las! 🐝💛`);

    canvas = document.getElementById("beeCanvas");
    ctx = canvas.getContext("2d");

    // Ajuste responsivo
    const resizeCanvas = () => {
        const container = canvas.parentElement;
        let maxW = container.clientWidth - 40;
        if (maxW < 950) {
            canvas.style.width = "100%";
            canvas.style.height = "auto";
        } else {
            canvas.style.width = "950px";
        }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Inicializar elementos
    beeX = canvas.width / 2;
    beeY = canvas.height / 2;
    flowers = [];
    smokes = [];
    fires = [];
    flowersCollected = 0;
    document.getElementById("flowerCount").innerText = flowersCollected;

    for (let i = 0; i < 14; i++) flowers.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
    for (let i = 0; i < 8; i++) smokes.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
    for (let i = 0; i < 5; i++) fires.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });

    beeActive = true;

    function updateMovement() {
        let speed = 6;
        if (keys.ArrowUp) beeY -= speed;
        if (keys.ArrowDown) beeY += speed;
        if (keys.ArrowLeft) beeX -= speed;
        if (keys.ArrowRight) beeX += speed;
        beeX = Math.min(Math.max(beeX, 22), canvas.width - 22);
        beeY = Math.min(Math.max(beeY, 22), canvas.height - 22);

        // Coletar flores
        for (let i = 0; i < flowers.length; i++) {
            let f = flowers[i];
            if (Math.hypot(beeX - f.x, beeY - f.y) < 24) {
                flowers.splice(i, 1);
                flowersCollected++;
                totalScore += 10;
                updateUI();
                document.getElementById("flowerCount").innerText = flowersCollected;
                showToast("+10 pontos! 🌸 Flor protegida!", true);
                break;
            }
        }
        // Perigos: fumaça e fogo
        for (let s of smokes) {
            if (Math.hypot(beeX - s.x, beeY - s.y) < 26) {
                totalScore = Math.max(0, totalScore - 5);
                updateUI();
                showToast("-5 pontos! Evite a fumaça! 💨", false);
                beeX = 60; beeY = 60;
            }
        }
        for (let f of fires) {
            if (Math.hypot(beeX - f.x, beeY - f.y) < 26) {
                totalScore = Math.max(0, totalScore - 5);
                updateUI();
                showToast("-5 pontos! Fogo queima a vegetação! 🔥", false);
                beeX = 60; beeY = 60;
            }
        }

        if (flowersCollected >= 10) {
            beeActive = false;
            cancelAnimationFrame(animFrameId);
            window.removeEventListener("keydown", keydownHandler);
            window.removeEventListener("keyup", keyupHandler);
            unlockAchievement("bees", "Guardião das Abelhas");
            setFelipeMessage(`Excelente, ${playerName}! Você protegeu os polinizadores. Vamos compostar! ♻️`);
            currentPhase = 2;
            phase2();
        }
    }

    function drawGame() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#c5e5a2";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Flores
        flowers.forEach(f => {
            ctx.beginPath();
            ctx.arc(f.x, f.y, 10, 0, Math.PI * 2);
            ctx.fillStyle = "#ffbf69";
            ctx.fill();
            ctx.fillStyle = "#e67e22";
            ctx.beginPath();
            ctx.arc(f.x - 3, f.y - 3, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        // Fumaças
        smokes.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, 15, 0, Math.PI * 2);
            ctx.fillStyle = "#a0a0a0";
            ctx.fill();
        });
        // Fogos
        fires.forEach(f => {
            ctx.beginPath();
            ctx.arc(f.x, f.y, 14, 0, Math.PI * 2);
            ctx.fillStyle = "#e67e22";
            ctx.fill();
            ctx.fillStyle = "#c0392b";
            ctx.beginPath();
            ctx.arc(f.x - 4, f.y - 4, 6, 0, Math.PI * 2);
            ctx.fill();
        });
        // Abelha
        ctx.fillStyle = "#f7d44a";
        ctx.beginPath();
        ctx.ellipse(beeX, beeY, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2c2b26";
        ctx.beginPath();
        ctx.ellipse(beeX - 7, beeY - 4, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(beeX + 7, beeY - 4, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function gameLoop() {
        if (!beeActive) return;
        updateMovement();
        drawGame();
        animFrameId = requestAnimationFrame(gameLoop);
    }
    gameLoop();

    keydownHandler = (e) => {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = true;
            e.preventDefault();
        }
    };
    keyupHandler = (e) => {
        if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
    };
    window.addEventListener("keydown", keydownHandler);
    window.addEventListener("keyup", keyupHandler);

    document.getElementById("resetBeeBtn")?.addEventListener("click", () => {
        beeActive = false;
        cancelAnimationFrame(animFrameId);
        window.removeEventListener("keydown", keydownHandler);
        window.removeEventListener("keyup", keyupHandler);
        phase1();
    });
}

// ------------------------- FASE 2: COMPOSTAGEM (DRAG & DROP) -------------------------
function phase2() {
    gameMain.innerHTML = `
        <div class="card">
            <h2>♻️ Compostagem Sustentável</h2>
            <p>Arraste os <strong>resíduos orgânicos</strong> para a composteira. Evite pilha, lata e plástico! 🌿</p>
            <div class="compost-bin" id="compostBin">🗑️ COMPOSTEIRA 🌱</div>
            <div id="itemsContainer" style="margin: 20px 0;"></div>
            <p>✅ Acertos: <span id="compostCorrectCount">0</span> / ${COMPOST_NEED}</p>
            <button id="resetCompostBtn">↺ Reiniciar fase</button>
        </div>
    `;

    setFelipeMessage("Separe os resíduos corretamente: orgânicos viram adubo, rejeitos não! 🍂");

    compostCorrect = 0;
    const itemList = [
        { name: "🍌 Casca de banana", type: "org" }, { name: "🍎 Casca de maçã", type: "org" },
        { name: "🍂 Folhas secas", type: "org" }, { name: "🥬 Restos de verduras", type: "org" },
        { name: "🔋 Pilha", type: "bad" }, { name: "🥫 Lata de alumínio", type: "bad" },
        { name: "🥤 Garrafa PET", type: "bad" }
    ];

    const container = document.getElementById("itemsContainer");
    itemList.forEach(item => {
        const div = document.createElement("div");
        div.innerText = item.name;
        div.setAttribute("draggable", "true");
        div.classList.add("drag-item");
        div.setAttribute("data-type", item.type);
        div.addEventListener("dragstart", e => {
            e.dataTransfer.setData("text/plain", JSON.stringify({ type: item.type, name: item.name }));
        });
        container.appendChild(div);
    });

    const compostArea = document.getElementById("compostBin");
    compostArea.addEventListener("dragover", e => e.preventDefault());
    compostArea.addEventListener("drop", e => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        if (data.type === "org") {
            compostCorrect++;
            totalScore += 10;
            updateUI();
            showToast(`+10 pontos! ✅ ${data.name} foi para compostagem!`, true);
        } else {
            totalScore = Math.max(0, totalScore - 5);
            updateUI();
            showToast(`❌ -5 pontos! ${data.name} NÃO é orgânico!`, false);
        }
        document.getElementById("compostCorrectCount").innerText = compostCorrect;
        if (compostCorrect >= COMPOST_NEED) {
            unlockAchievement("compost", "Mestre da Compostagem");
            setFelipeMessage(`Maravilha, ${playerName}! Você produziu adubo natural. Vamos plantar o futuro! 🌽`);
            currentPhase = 3;
            phase3();
        }
    });

    document.getElementById("resetCompostBtn")?.addEventListener("click", () => phase2());
}

// ------------------------- FASE 3: PLANTIO (DRAG + REGAR) -------------------------
function phase3() {
    gameMain.innerHTML = `
        <div class="card">
            <h2>🌽 Plantando o Futuro</h2>
            <p>Arraste cada muda para o canteiro correto e depois regue com carinho 💧</p>
            <div class="garden-grid" id="gardenPlots">
                <div class="plot" data-crop="tomato">🍅 Tomate</div>
                <div class="plot" data-crop="lettuce">🥬 Alface</div>
                <div class="plot" data-crop="corn">🌽 Milho</div>
            </div>
            <div id="seedlingsContainer">
                <div class="seedling" draggable="true" data-crop="tomato">🍅 Muda de Tomate</div>
                <div class="seedling" draggable="true" data-crop="lettuce">🥬 Muda de Alface</div>
                <div class="seedling" draggable="true" data-crop="corn">🌽 Muda de Milho</div>
            </div>
            <button id="waterBtn" disabled>💧 REGAR PLANTAÇÃO</button>
            <div id="growthAnim" style="margin-top: 25px;"></div>
        </div>
    `;

    plantedCount = 0;
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
                plantedCount++;
                totalScore += 15;
                updateUI();
                showToast("✅ Muda plantada corretamente!", true);
                if (plantedCount === 3) document.getElementById("waterBtn").disabled = false;
            } else {
                totalScore = Math.max(0, totalScore - 5);
                updateUI();
                showToast("❌ Canteiro errado para essa muda!", false);
            }
        });
    });

    document.getElementById("waterBtn").addEventListener("click", () => {
        if (plantedCount === 3 && !isWatered) {
            isWatered = true;
            showToast("💦 Você regou! As plantas estão crescendo... 🌱➡️🌿", true);
            document.getElementById("growthAnim").innerHTML = `
                <div style="background:#def0c3; border-radius:48px; padding:20px; text-align:center;">
                    <p style="font-size:1.8rem;">🌱 → 🌿 → 🍅🥬🌽</p>
                    <p><strong>Colheita abundante e sustentável!</strong></p>
                </div>
            `;
            totalScore += 30;
            updateUI();
            unlockAchievement("farming", "Agricultor Sustentável");
            setFelipeMessage(`Parabéns, ${playerName}! Você cultivou alimentos de forma ecológica. Hora do quiz! 📚`);
            currentPhase = 4;
            phase4();
        } else if (!isWatered) {
            showToast("⚠️ Plante todas as mudas antes de regar!", false);
        }
    });
    setFelipeMessage("Plante cada muda no lugar certo e depois regue para ver a magia acontecer! 🌿");
}

// ------------------------- QUIZ FINAL -------------------------
function phase4() {
    gameMain.innerHTML = `
        <div class="card">
            <h2>📝 Quiz do AgroHerói</h2>
            <div id="q1"><p>🐝 1. Qual a principal função das abelhas na agricultura?</p>
                <button data-resp="0">Produzir mel</button><button data-resp="1">Polinizar plantas ✅</button><button data-resp="2">Fazer barulho</button>
            </div>
            <div id="q2"><p>♻️ 2. O que pode ir para a composteira?</p>
                <button data-resp="0">Casca de banana ✅</button><button data-resp="1">Pilha</button><button data-resp="2">Garrafa PET</button>
            </div>
            <div id="q3"><p>🌍 3. Qual prática ajuda uma agricultura sustentável?</p>
                <button data-resp="0">Queimadas</button><button data-resp="1">Desmatamento</button><button data-resp="2">Compostagem e preservação ✅</button>
            </div>
            <button id="finishQuizBtn" style="margin-top: 30px;">✅ FINALIZAR QUIZ</button>
        </div>
    `;

    quizHits = 0;
    const allBtns = document.querySelectorAll("[data-resp]");
    allBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const parent = btn.parentElement;
            const answer = parseInt(btn.getAttribute("data-resp"));
            let correct = false;
            if (parent.id === "q1" && answer === 1) correct = true;
            if (parent.id === "q2" && answer === 0) correct = true;
            if (parent.id === "q3" && answer === 2) correct = true;
            if (correct) {
                btn.style.background = "#2ecc71";
                showToast("✅ Resposta correta!", true);
                quizHits++;
            } else {
                btn.style.background = "#e74c3c";
                showToast("❌ Resposta incorreta. Revisite os conteúdos!", false);
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
            showToast("Você errou algumas questões. Reinicie o jogo para tentar novamente.", false);
        }
    });
    setFelipeMessage("Teste seus conhecimentos sobre sustentabilidade no campo! 🌱");
}

// ------------------------- CERTIFICADO E TELA FINAL -------------------------
function phase5() {
    gameMain.innerHTML = `
        <div class="card" style="text-align:center;">
            <h2>🏅 CERTIFICADO AGROHERÓI 🏅</h2>
            <p style="font-size:1.1rem;">Certificamos que <strong>${playerName}</strong> concluiu com sucesso a missão <strong>"AGROHERÓIS: A MISSÃO SUSTENTÁVEL"</strong>, demonstrando conhecimentos sobre polinização, compostagem, plantio sustentável e preservação ambiental.</p>
            <button id="downloadCertBtn">📄 Baixar Certificado (Imprimir)</button>
            <hr style="margin: 30px 0;">
            <div style="background:#e2f0cf; border-radius: 60px; padding: 30px;">
                <p style="font-size:2rem;">🌳🐝🌱🚜☀️</p>
                <h3>Agricultura + Natureza = Futuro Vivo</h3>
                <p style="margin:15px 0;">"Pequenas ações geram grandes transformações."</p>
                <button id="playAgainBtn">🔄 Jogar Novamente</button>
                <button id="menuAgainBtn">🏠 Menu Principal</button>
            </div>
        </div>
    `;
    setFelipeMessage(`${playerName}, você é um verdadeiro guardião do agro sustentável! Continue assim! 🌎💚`);

    document.getElementById("downloadCertBtn")?.addEventListener("click", () => window.print());
    document.getElementById("playAgainBtn")?.addEventListener("click", () => location.reload());
    document.getElementById("menuAgainBtn")?.addEventListener("click", () => location.reload());
}

// ------------------------- INICIALIZAÇÃO E ACESSIBILIDADE -------------------------
function startGame() {
    phase0();
    updateUI();
}

// Eventos de acessibilidade e controles globais
document.getElementById("darkModeBtn")?.addEventListener("click", () => document.body.classList.toggle("dark"));
document.getElementById("highContrastBtn")?.addEventListener("click", () => document.body.classList.toggle("high-contrast"));
let fontSizeLevel = 0;
document.getElementById("fontPlusBtn")?.addEventListener("click", () => {
    if (fontSizeLevel === 0) { document.body.classList.add("font-large"); fontSizeLevel = 1; }
    else if (fontSizeLevel === 1) { document.body.classList.remove("font-large"); document.body.classList.add("font-xlarge"); fontSizeLevel = 2; }
});
document.getElementById("fontMinusBtn")?.addEventListener("click", () => {
    if (fontSizeLevel === 2) { document.body.classList.remove("font-xlarge"); document.body.classList.add("font-large"); fontSizeLevel = 1; }
    else if (fontSizeLevel === 1) { document.body.classList.remove("font-large"); fontSizeLevel = 0; }
});
document.getElementById("resetGameBtn")?.addEventListener("click", () => location.reload());
document.getElementById("mainMenuBtn")?.addEventListener("click", () => location.reload());

startGame();
