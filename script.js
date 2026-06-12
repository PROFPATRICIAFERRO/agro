// ============================================================
// AGROHERÓIS - JOGO EDUCATIVO COMPLETO
// Variáveis globais, estados, pontuação, conquistas e fases
// ============================================================

// --- Armazena dados do jogador ---
let nomeJogador = "";
let generoPersonagem = "menino"; // menino ou menina
let pontuacaoTotal = 0;
let conquistas = {
    guardiaoAbelhas: false,
    mestreCompostagem: false,
    agricultorSustentavel: false,
    heroiAgro: false
};
let faseAtual = 0; // 0=apresentação,1=abelhas,2=compostagem,3=plantio,4=quiz,5=certificado
let progresso = 0; // 0-100

// --- Minijogo Abelha (canvas) variáveis ---
let jogoAbelhaAtivo = false;
let abelhaX, abelhaY;
let flores = [], fumaças = [], fogos = [];
let floresColetadas = 0;
let animFrame;
let teclas = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

// --- Fase Compostagem arrastar---
let itensCompostagem = [];
let acertosCompostagem = 0;
let errosCompostagem = 0;
const metaCompostagem = 5; // precisa de 5 acertos

// --- Fase Plantio ---
let mudasPlantadas = 0;
let regado = false;
let plantasCrescidas = false;

// --- Quiz ---
let quizRespostas = [false, false, false];
const quizGabarito = [1, 0, 2]; // indices das respostas certas (0-base nas opções)

// ========== DOM Elements ==========
const telaAtivaDiv = document.getElementById("telaAtiva");
const pontuacaoSpan = document.getElementById("pontuacaoTotal");
const totalConquistasSpan = document.getElementById("totalConquistas");
const progressoBar = document.getElementById("progressoGlobal");
const progressoPercentual = document.getElementById("progressoPercentual");
const falaTexto = document.getElementById("falaTexto");

// --- Controles de acessibilidade ---
const modoEscuroBtn = document.getElementById("modoEscuroBtn");
const altoContrasteBtn = document.getElementById("altoContrasteBtn");
const aumentarFonteBtn = document.getElementById("aumentarFonteBtn");
const diminuirFonteBtn = document.getElementById("diminuirFonteBtn");
const reiniciarJogoBtn = document.getElementById("reiniciarJogoBtn");
const menuPrincipalBtn = document.getElementById("menuPrincipalBtn");

// ========== FUNÇÕES AUXILIARES ==========
function atualizarInterface() {
    pontuacaoSpan.innerText = pontuacaoTotal;
    let conquistasCount = Object.values(conquistas).filter(v => v === true).length;
    totalConquistasSpan.innerText = conquistasCount;
    progressoBar.value = progresso;
    progressoPercentual.innerText = `${progresso}%`;
}

function mostrarFeedback(texto, tipo = "acerto") {
    const feedbackDiv = document.createElement("div");
    feedbackDiv.className = "feedback";
    feedbackDiv.innerText = texto;
    feedbackDiv.style.backgroundColor = tipo === "acerto" ? "#2ecc71" : "#e74c3c";
    document.body.appendChild(feedbackDiv);
    setTimeout(() => feedbackDiv.remove(), 1800);
}

function setarFala(fala) {
    falaTexto.innerText = fala;
}

function atualizarProgresso() {
    let base = 0;
    if (conquistas.guardiaoAbelhas) base += 25;
    if (conquistas.mestreCompostagem) base += 25;
    if (conquistas.agricultorSustentavel) base += 25;
    if (conquistas.heroiAgro) base += 25;
    progresso = base;
    atualizarInterface();
}

// Conquistas
function desbloquearConquista(chave, titulo) {
    if (!conquistas[chave]) {
        conquistas[chave] = true;
        mostrarFeedback(`🏅 CONQUISTA: ${titulo}`, "acerto");
        atualizarProgresso();
    }
}

// ========== FASES ==========
// FASE 0: Apresentação e escolha de nome/personagem
function faseApresentacao() {
    telaAtivaDiv.innerHTML = `
        <div class="card">
            <h2>🌾 Bem-vindo à Fazenda Sustentável!</h2>
            <div class="form-group">
                <label for="nomeJogador">👤 Como você se chama?</label>
                <input type="text" id="nomeJogador" placeholder="Digite seu nome" autocomplete="off">
            </div>
            <div class="form-group">
                <label>Escolha seu personagem:</label><br>
                <button id="btnMenino">👦 Menino</button>
                <button id="btnMenina">👧 Menina</button>
            </div>
            <button id="confirmarNome">🌱 Iniciar Missão</button>
        </div>
    `;
    setarFala("Olá! Eu sou Felipe! Qual é o seu nome? Vamos juntos proteger a natureza!");
    document.getElementById("btnMenino")?.addEventListener("click", () => { generoPersonagem = "menino"; mostrarFeedback("Personagem Menino selecionado!"); });
    document.getElementById("btnMenina")?.addEventListener("click", () => { generoPersonagem = "menina"; mostrarFeedback("Personagem Menina selecionada!"); });
    document.getElementById("confirmarNome")?.addEventListener("click", () => {
        const inputNome = document.getElementById("nomeJogador");
        if (inputNome.value.trim() === "") {
            mostrarFeedback("Digite seu nome primeiro!", "erro");
            return;
        }
        nomeJogador = inputNome.value.trim();
        setarFala(`Prazer, ${nomeJogador}! Agora você é um AgroHerói. Vamos salvar os polinizadores!`);
        faseAtual = 1;
        iniciarFase1();
    });
}

// FASE 1 - Minijogo Abelha (canvas com setas)
let canvas, ctx;
function iniciarFase1() {
    telaAtivaDiv.innerHTML = `
        <div class="card">
            <h2>🐝 Salvando os Polinizadores</h2>
            <p>Controle a abelha com as setas do teclado, colete 10 flores e desvie da fumaça e do fogo!</p>
            <canvas id="abelhaCanvas" width="800" height="400" class="canvas-jogo"></canvas>
            <div>🌸 Flores coletadas: <span id="floresCount">0</span>/10</div>
            <button id="reiniciarAbelha">🔄 Reiniciar jogo</button>
        </div>
    `;
    setarFala(`${nomeJogador}, use as setas! As abelhas são essenciais para polinização. Vamos protegê-las!`);
    canvas = document.getElementById("abelhaCanvas");
    ctx = canvas.getContext("2d");
    // Inicializar objetos
    abelhaX = canvas.width/2;
    abelhaY = canvas.height/2;
    flores = [];
    fumaças = [];
    fogos = [];
    floresColetadas = 0;
    for(let i=0;i<12;i++) flores.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, r:8});
    for(let i=0;i<6;i++) fumaças.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, r:12});
    for(let i=0;i<4;i++) fogos.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, r:10});
    
    jogoAbelhaAtivo = true;
    function loopJogo() {
        if(!jogoAbelhaAtivo) return;
        atualizarMovimento();
        desenharJogo();
        requestAnimationFrame(loopJogo);
    }
    loopJogo();
    
    window.addEventListener("keydown", (e) => { if(teclas.hasOwnProperty(e.key)) { teclas[e.key]=true; e.preventDefault(); } });
    window.addEventListener("keyup", (e) => { if(teclas.hasOwnProperty(e.key)) teclas[e.key]=false; });
    document.getElementById("reiniciarAbelha")?.addEventListener("click", () => { iniciarFase1(); });
}

function atualizarMovimento() {
    let vel=6;
    if(teclas.ArrowUp) abelhaY -= vel;
    if(teclas.ArrowDown) abelhaY += vel;
    if(teclas.ArrowLeft) abelhaX -= vel;
    if(teclas.ArrowRight) abelhaX += vel;
    abelhaX = Math.min(Math.max(abelhaX,20), canvas.width-20);
    abelhaY = Math.min(Math.max(abelhaY,20), canvas.height-20);
    // colisão flores
    for(let i=0;i<flores.length;i++) {
        let f=flores[i];
        let dx = abelhaX-f.x, dy=abelhaY-f.y;
        if(Math.hypot(dx,dy)<20) {
            flores.splice(i,1);
            floresColetadas++;
            pontuacaoTotal+=10;
            atualizarInterface();
            document.getElementById("floresCount").innerText = floresColetadas;
            mostrarFeedback("+10 pontos! Flor coletada!", "acerto");
            break;
        }
    }
    // colisão perigos
    for(let p of [...fumaças, ...fogos]) {
        if(Math.hypot(abelhaX-p.x, abelhaY-p.y) < 22) {
            pontuacaoTotal = Math.max(0, pontuacaoTotal-5);
            atualizarInterface();
            mostrarFeedback("-5 pontos! Evite fumaça/fogo!", "erro");
            // reposiciona abelha um pouco
            abelhaX = 50; abelhaY = 50;
        }
    }
    if(floresColetadas >= 10) {
        jogoAbelhaAtivo = false;
        desbloquearConquista("guardiaoAbelhas", "Guardião das Abelhas");
        setarFala(`Muito bem, ${nomeJogador}! Você protegeu os polinizadores! Vamos à compostagem.`);
        faseAtual = 2;
        iniciarFase2();
    }
}

function desenharJogo() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#a9d67b";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    flores.forEach(f=>{ ctx.beginPath(); ctx.arc(f.x,f.y,8,0,Math.PI*2); ctx.fillStyle="#ffb347"; ctx.fill(); ctx.fillStyle="#e67e22"; ctx.beginPath(); ctx.arc(f.x-2,f.y-2,3,0,Math.PI*2); ctx.fill(); });
    fumaças.forEach(f=>{ ctx.beginPath(); ctx.arc(f.x,f.y,14,0,Math.PI*2); ctx.fillStyle="#a0a0a0"; ctx.fill(); });
    fogos.forEach(f=>{ ctx.beginPath(); ctx.arc(f.x,f.y,12,0,Math.PI*2); ctx.fillStyle="#e67e22"; ctx.fill(); ctx.fillStyle="#d35400"; ctx.beginPath(); ctx.arc(f.x-3,f.y-3,4,0,Math.PI*2); ctx.fill(); });
    ctx.fillStyle="#f1c40f";
    ctx.beginPath(); ctx.ellipse(abelhaX,abelhaY,15,12,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#2c3e50"; ctx.beginPath(); ctx.ellipse(abelhaX-5,abelhaY-3,3,2,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="white"; ctx.beginPath(); ctx.ellipse(abelhaX+5,abelhaY-3,3,2,0,0,Math.PI*2); ctx.fill();
}

// FASE 2 - Compostagem (Drag and Drop)
function iniciarFase2() {
    telaAtivaDiv.innerHTML = `
        <div class="card">
            <h2>♻️ Compostagem Sustentável</h2>
            <p>Arraste os itens ORGÂNICOS para a composteira. Evite lixo não biodegradável!</p>
            <div class="lixeira-composteira" id="composteiraArea" style="background:#5a3e1f; padding:25px;">🗑️ COMPOSTEIRA 🌱</div>
            <div id="itensContainer" style="margin-top:20px;"></div>
            <p>✅ Acertos: <span id="acertosComp">0</span> / ${metaCompostagem} </p>
            <button id="resetCompostagem">↺ Reiniciar Fase</button>
        </div>
    `;
    acertosCompostagem = 0;
    errosCompostagem = 0;
    const itens = [
        { nome: "🍌 Casca de banana", tipo: "organico" }, { nome: "🍎 Casca de maçã", tipo: "organico" },
        { nome: "🍂 Folhas secas", tipo: "organico" }, { nome: "🥬 Restos de verdura", tipo: "organico" },
        { nome: "🔋 Pilha", tipo: "perigoso" }, { nome: "🥫 Lata", tipo: "rejeito" }, { nome: "🥤 Plástico", tipo: "rejeito" }
    ];
    const container = document.getElementById("itensContainer");
    itens.forEach((item,idx) => {
        let div = document.createElement("div");
        div.innerText = item.nome;
        div.setAttribute("draggable", "true");
        div.classList.add("item-arrastavel");
        div.setAttribute("data-tipo", item.tipo);
        div.setAttribute("data-nome", item.nome);
        div.addEventListener("dragstart", e => {
            e.dataTransfer.setData("text/plain", JSON.stringify({ tipo: item.tipo, nome: item.nome }));
        });
        container.appendChild(div);
    });
    const composteira = document.getElementById("composteiraArea");
    composteira.addEventListener("dragover", e => e.preventDefault());
    composteira.addEventListener("drop", e => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        if(data.tipo === "organico") {
            acertosCompostagem++;
            pontuacaoTotal += 10;
            mostrarFeedback(`+10: ${data.nome} vai para compostagem!`, "acerto");
        } else {
            errosCompostagem++;
            pontuacaoTotal = Math.max(0, pontuacaoTotal - 5);
            mostrarFeedback(`-5: ${data.nome} não é orgânico!`, "erro");
        }
        atualizarInterface();
        document.getElementById("acertosComp").innerText = acertosCompostagem;
        if(acertosCompostagem >= metaCompostagem) {
            desbloquearConquista("mestreCompostagem", "Mestre da Compostagem");
            setarFala("Excelente! Você produziu adubo natural. Próxima fase: Plantar o Futuro!");
            faseAtual = 3;
            iniciarFase3();
        }
    });
    document.getElementById("resetCompostagem")?.addEventListener("click", () => iniciarFase2());
}

// FASE 3 - Plantio Sustentável (Arrastar mudas + regar)
function iniciarFase3() {
    telaAtivaDiv.innerHTML = `
        <div class="card">
            <h2>🌽 Plantando o Futuro</h2>
            <p>Arraste as mudas para os canteiros corretos, depois regue e veja crescer!</p>
            <div class="grid-canteiros" id="canteirosGrid">
                <div class="canteiro" data-cultura="tomate">🍅 Tomate</div>
                <div class="canteiro" data-cultura="alface">🥬 Alface</div>
                <div class="canteiro" data-cultura="milho">🌽 Milho</div>
            </div>
            <div id="mudasContainer">
                <div class="muda" draggable="true" data-tipo="tomate">🍅 Muda de Tomate</div>
                <div class="muda" draggable="true" data-tipo="alface">🥬 Muda de Alface</div>
                <div class="muda" draggable="true" data-tipo="milho">🌽 Muda de Milho</div>
            </div>
            <button id="regarBtn" disabled>💧 Regar Plantas</button>
            <div id="crescimentoAnimado" style="margin-top:20px;"></div>
        </div>
    `;
    mudasPlantadas = 0;
    regado = false;
    const mudas = document.querySelectorAll(".muda");
    const canteiros = document.querySelectorAll(".canteiro");
    mudas.forEach(m => {
        m.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", m.getAttribute("data-tipo")));
    });
    canteiros.forEach(c => {
        c.addEventListener("dragover", e => e.preventDefault());
        c.addEventListener("drop", e => {
            e.preventDefault();
            let cultura = e.dataTransfer.getData("text/plain");
            if(c.getAttribute("data-cultura") === cultura) {
                if(c.innerText.includes("🌱")) return;
                c.innerHTML += " 🌱";
                mudasPlantadas++;
                pontuacaoTotal += 15;
                atualizarInterface();
                mostrarFeedback("Muda plantada corretamente!", "acerto");
                if(mudasPlantadas === 3) document.getElementById("regarBtn").disabled = false;
            } else {
                pontuacaoTotal -= 5;
                mostrarFeedback("Canteiro errado para essa muda!", "erro");
                atualizarInterface();
            }
        });
    });
    document.getElementById("regarBtn")?.addEventListener("click", () => {
        if(mudasPlantadas === 3 && !regado) {
            regado = true;
            mostrarFeedback("💦 Você regou as plantas! Estão crescendo...", "acerto");
            let areaCresc = document.getElementById("crescimentoAnimado");
            areaCresc.innerHTML = "<p>🌱 → 🌿 → 🍅🥬🌽</p><p>Colheita abundante e sustentável!</p>";
            pontuacaoTotal += 30;
            atualizarInterface();
            desbloquearConquista("agricultorSustentavel", "Agricultor Sustentável");
            setarFala(`Parabéns ${nomeJogador}! Você cultivou alimentos de forma sustentável! Hora do Quiz!`);
            faseAtual = 4;
            iniciarQuiz();
        } else if(!regado) mostrarFeedback("Plante todas as mudas primeiro!", "erro");
    });
}

// QUIZ FINAL
function iniciarQuiz() {
    telaAtivaDiv.innerHTML = `
        <div class="card">
            <h2>📝 Quiz do AgroHerói</h2>
            <div id="pergunta1"><p>1. Qual é a função das abelhas?</p><button data-resp="0">Produzir plástico</button><button data-resp="1">Polinizar plantas ✅</button><button data-resp="2">Produzir fumaça</button></div>
            <div id="pergunta2"><p>2. O que pode ir para a composteira?</p><button data-resp="0">Casca de banana ✅</button><button data-resp="1">Pilha</button><button data-resp="2">Plástico</button></div>
            <div id="pergunta3"><p>3. O que ajuda uma agricultura sustentável?</p><button data-resp="0">Queimadas</button><button data-resp="1">Desmatamento</button><button data-resp="2">Compostagem e preservação ✅</button></div>
            <button id="finalizarQuiz">✅ Finalizar Quiz</button>
        </div>
    `;
    let acertosQuiz = 0;
    const botoes = document.querySelectorAll("[data-resp]");
    botoes.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const perguntaDiv = btn.parentElement;
            const resp = parseInt(btn.getAttribute("data-resp"));
            let certo = false;
            if(perguntaDiv.id === "pergunta1" && resp === 1) certo = true;
            if(perguntaDiv.id === "pergunta2" && resp === 0) certo = true;
            if(perguntaDiv.id === "pergunta3" && resp === 2) certo = true;
            if(certo) {
                btn.style.background = "#2ecc71";
                mostrarFeedback("Correto!", "acerto");
                acertosQuiz++;
            } else {
                btn.style.background = "#e74c3c";
                mostrarFeedback("Errado! Estude mais.", "erro");
            }
            perguntaDiv.querySelectorAll("button").forEach(b => b.disabled = true);
        });
    });
    document.getElementById("finalizarQuiz")?.addEventListener("click", () => {
        if(acertosQuiz === 3) {
            desbloquearConquista("heroiAgro", "🏆 Herói do Agro Sustentável");
            pontuacaoTotal += 100;
            atualizarInterface();
            faseAtual = 5;
            gerarCertificado();
        } else {
            mostrarFeedback("Você errou algumas questões. Reinicie o jogo para tentar novamente.", "erro");
        }
    });
}

// CERTIFICADO E TELA FINAL
function gerarCertificado() {
    telaAtivaDiv.innerHTML = `
        <div class="card" style="text-align:center;">
            <h2>🏅 CERTIFICADO AGROHERÓI 🏅</h2>
            <p>Certificamos que <strong>${nomeJogador}</strong> concluiu a missão <strong>AGROHERÓIS: A MISSÃO SUSTENTÁVEL</strong> demonstrando conhecimentos sobre sustentabilidade, agricultura e preservação ambiental.</p>
            <button id="baixarCertificado">📄 Baixar Certificado (Imprimir)</button>
            <hr>
            <div style="background:#dcf5b0; margin-top:20px; padding:20px; border-radius:30px;">
                🌳🐝🌱🚜☀️
                <h3>AGRICULTURA + MEIO AMBIENTE = FUTURO SUSTENTÁVEL</h3>
                <p>${nomeJogador}, lembre-se: produzir alimentos e preservar a natureza caminham juntos.</p>
                <button id="jogarNovamente">🔄 Jogar Novamente</button>
                <button id="menuFinal">🏠 Menu Principal</button>
            </div>
        </div>
    `;
    document.getElementById("baixarCertificado")?.addEventListener("click", () => {
        window.print();
    });
    document.getElementById("jogarNovamente")?.addEventListener("click", () => location.reload());
    document.getElementById("menuFinal")?.addEventListener("click", () => location.reload());
}

// Reiniciar / Menu
function reiniciarCompleto() {
    location.reload();
}
reiniciarJogoBtn.addEventListener("click", reiniciarCompleto);
menuPrincipalBtn.addEventListener("click", () => location.reload());

// ACESSIBILIDADE
modoEscuroBtn.addEventListener("click", () => {
    let theme = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", theme);
});
altoContrasteBtn.addEventListener("click", () => {
    let contrast = document.body.getAttribute("data-contrast") === "high" ? "normal" : "high";
    document.body.setAttribute("data-contrast", contrast);
});
aumentarFonteBtn.addEventListener("click", () => {
    let size = document.body.getAttribute("data-fontsize");
    if(size === "large") document.body.setAttribute("data-fontsize", "xlarge");
    else if(size === "xlarge") return;
    else document.body.setAttribute("data-fontsize", "large");
});
diminuirFonteBtn.addEventListener("click", () => {
    let size = document.body.getAttribute("data-fontsize");
    if(size === "large") document.body.setAttribute("data-fontsize", "normal");
    else if(size === "xlarge") document.body.setAttribute("data-fontsize", "large");
    else return;
});

// INICIALIZAÇÃO
function iniciarJogo() {
    faseAtual = 0;
    faseApresentacao();
    atualizarInterface();
}
iniciarJogo();
