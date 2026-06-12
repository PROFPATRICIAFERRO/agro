// AGROHERÓIS: GAME COMPLETO
// Controle de estado, fases, pontuação, conquistas, etc.

// --- DADOS GLOBAIS ---
let gameState = {
    nome: "",
    avatar: "👦",
    pontos: 0,
    faseAtual: "intro", // intro, fase1, fase2, fase3, quiz, certificado, final
    progresso: 0, // 0-100
    conquistas: {
        polinizador: false,
        compostagem: false,
        agricultor: false,
        heroi: false
    },
    floresColetadasFase1: 0,
    fase1Complete: false,
    fase2Complete: false,
    fase3Complete: false,
    quizAcertos: 0,
    // Controle das fases
    compostagemAcertos: 0,
    compostagemErros: 0,
    compostagemTotalArrastados: 0,
    itensCompostagemList: [], // armazenar elementos originais
    fase3MudasPlantadas: 0,
    regado: false
};

// Elementos DOM
const screens = {
    intro: document.getElementById("screenIntro"),
    fase1: document.getElementById("screenFase1"),
    fase2: document.getElementById("screenFase2"),
    fase3: document.getElementById("screenFase3"),
    quiz: document.getElementById("screenQuiz"),
    certificado: document.getElementById("screenCertificado"),
    final: document.getElementById("screenFinal")
};

// Função auxiliar: mostrar tela
function showScreen(screenId) {
    Object.keys(screens).forEach(id => {
        screens[id].classList.remove("active");
    });
    screens[screenId].classList.add("active");
    gameState.faseAtual = screenId;
}

// Atualizar barra de progresso global
function updateGlobalProgress() {
    let progressValue = 0;
    if (gameState.fase1Complete) progressValue += 25;
    if (gameState.fase2Complete) progressValue += 25;
    if (gameState.fase3Complete) progressValue += 25;
    if (gameState.quizAcertos >= 3) progressValue += 25;
    document.getElementById("globalProgressBar").style.width = `${progressValue}%`;
}

// Atualizar pontuação na tela
function updateScoreUI() {
    document.getElementById("totalScore").innerText = gameState.pontos;
}

// Desbloquear conquista (visual)
function unlockConquista(chave, badgeTextId) {
    if (!gameState.conquistas[chave]) {
        gameState.conquistas[chave] = true;
        const badge = document.querySelector(`.conquista-badge[data-conquista="${chave}"]`);
        if (badge) badge.classList.add("obtida");
        // feedback
        mostrarFeedback(`🏅 Conquista desbloqueada: ${badgeTextId}`, "success");
    }
}

// Feedback visual
function mostrarFeedback(msg, tipo = "info") {
    const feedbackDiv = document.getElementById("feedbackMsg") || document.querySelector(".feedback");
    if (feedbackDiv) {
        feedbackDiv.innerText = msg;
        feedbackDiv.style.color = tipo === "error" ? "red" : "green";
        setTimeout(() => { if(feedbackDiv) feedbackDiv.innerText = ""; }, 2000);
    } else {
        alert(msg);
    }
}

// Atualizar diálogo do Felipe
function setFelipeDialog(fase, texto) {
    let elemento;
    if (fase === "intro") elemento = document.querySelector("#screenIntro .fala-balao p");
    else if (fase === "fase1") elemento = document.getElementById("fase1Fala");
    else if (fase === "fase2") elemento = document.getElementById("fase2Fala");
    else if (fase === "fase3") elemento = document.getElementById("fase3Fala");
    if (elemento) elemento.innerHTML = texto;
}

// ---- FASE 1: ABELHA CANVAS ----
let canvas, ctx, beeX, beeY, flores = [], obstaculos = [];
let jogoAtivo = false, floresNecessarias = 10, florCount = 0;
let animFrame;
let teclas = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

function iniciarFase1Game() {
    if (gameState.fase1Complete) {
        mostrarFeedback("Você já completou esta fase! Avance.");
        return;
    }
    canvas = document.getElementById("beeCanvas");
    ctx = canvas.getContext("2d");
    beeX = canvas.width/2; beeY = canvas.height/2;
    gerarElementos();
    florCount = 0;
    document.getElementById("floresColetadas").innerText = florCount;
    jogoAtivo = true;
    function gameLoop() {
        if(!jogoAtivo) return;
        moverAbelha();
        detectarColisoes();
        desenhar();
        if(florCount >= floresNecessarias) {
            finalizarFase1Sucesso();
            return;
        }
        animFrame = requestAnimationFrame(gameLoop);
    }
    if(animFrame) cancelAnimationFrame(animFrame);
    gameLoop();
}

function gerarElementos() {
    flores = [];
    obstaculos = [];
    for(let i=0;i<10;i++) flores.push({x: 50+Math.random()*(canvas.width-100), y: 50+Math.random()*(canvas.height-100), r: 12});
    for(let i=0;i<6;i++) obstaculos.push({x: 60+Math.random()*(canvas.width-120), y: 60+Math.random()*(canvas.height-120), tipo: i%2===0 ? "fumaça" : "fogo"});
}

function moverAbelha() {
    let step = 6;
    if(teclas.ArrowUp && beeY>20) beeY -= step;
    if(teclas.ArrowDown && beeY<canvas.height-20) beeY += step;
    if(teclas.ArrowLeft && beeX>20) beeX -= step;
    if(teclas.ArrowRight && beeX<canvas.width-20) beeX += step;
}

function detectarColisoes() {
    for(let i=0;i<flores.length;i++) {
        const f = flores[i];
        const dx = beeX - f.x, dy = beeY - f.y;
        if(Math.hypot(dx,dy) < 25) {
            flores.splice(i,1);
            florCount++;
            document.getElementById("floresColetadas").innerText = florCount;
            gameState.pontos += 10;
            updateScoreUI();
            mostrarFeedback("+10 pontos! Flor polinizada!", "success");
            flores.push({x: 30+Math.random()*(canvas.width-60), y: 30+Math.random()*(canvas.height-60), r:12});
            break;
        }
    }
    for(let i=0;i<obstaculos.length;i++) {
        const obs = obstaculos[i];
        if(Math.hypot(beeX-obs.x, beeY-obs.y) < 25) {
            gameState.pontos = Math.max(0, gameState.pontos-5);
            updateScoreUI();
            mostrarFeedback("😵 Colidiu com "+obs.tipo+"! -5 pontos", "error");
            obstaculos[i] = {x: 30+Math.random()*(canvas.width-60), y: 30+Math.random()*(canvas.height-60), tipo: obs.tipo};
        }
    }
}

function desenhar() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#ffd966";
    ctx.beginPath(); ctx.arc(beeX, beeY, 18, 0, 2*Math.PI); ctx.fill();
    ctx.fillStyle = "black";
    ctx.fillText("🐝", beeX-12, beeY+6);
    flores.forEach(f=>{ ctx.fillStyle = "pink"; ctx.beginPath(); ctx.arc(f.x,f.y,10,0,2*Math.PI); ctx.fill(); ctx.fillStyle = "yellow"; ctx.fillText("🌸", f.x-5, f.y+4); });
    obstaculos.forEach(o=>{ ctx.fillStyle = o.tipo==="fumaça" ? "#aaa" : "orange"; ctx.beginPath(); ctx.arc(o.x,o.y,12,0,2*Math.PI); ctx.fill(); ctx.fillStyle="black"; ctx.fillText(o.tipo==="fumaça"?"💨":"🔥", o.x-7, o.y+4); });
}

function finalizarFase1Sucesso() {
    jogoAtivo = false;
    if(animFrame) cancelAnimationFrame(animFrame);
    gameState.fase1Complete = true;
    unlockConquista("polinizador", "Guardião das Abelhas");
    mostrarFeedback("✅ Fase 1 concluída! Você salvou os polinizadores!", "success");
    setFelipeDialog("fase1", "Muito bem! Você protegeu os polinizadores! As abelhas ajudam na produção de frutos. Vamos para a Compostagem!");
    document.getElementById("iniciarFase1Btn").disabled = true;
    // Avançar manual via botão ou automático após 2s? Adicionar botão próximo, porém o fluxo: botão de avançar pode ser integrado. Crio um botão para próxima fase.
    let nextBtn = document.createElement("button");
    nextBtn.innerText = "▶ Próxima Fase (Compostagem)";
    nextBtn.className = "btn-acao";
    nextBtn.onclick = () => { showScreen("fase2"); inicializarFase2(); nextBtn.remove(); };
    document.querySelector("#screenFase1 .minigame-container").appendChild(nextBtn);
    updateGlobalProgress();
}

// ---- FASE 2: COMPOSTAGEM DRAG & DROP ----
function inicializarFase2() {
    if(gameState.fase2Complete) return;
    setFelipeDialog("fase2", "Agora vamos separar os resíduos! Arraste os orgânicos para a composteira. Acerto +10, erro -5. Complete todos os itens!");
    const itensData = [
        { nome: "🍌 Casca de banana", tipo: "certo" }, { nome: "🍎 Casca de maçã", tipo: "certo" }, { nome: "🍂 Folhas secas", tipo: "certo" },
        { nome: "🥬 Restos de verduras", tipo: "certo" }, { nome: "🔋 Pilha", tipo: "errado" }, { nome: "🥫 Lata", tipo: "errado" }, { nome: "🥤 Plástico", tipo: "errado" }
    ];
    const container = document.getElementById("itensCompostagem");
    container.innerHTML = "";
    gameState.compostagemAcertos = 0; gameState.compostagemErros = 0; gameState.compostagemTotalArrastados = 0;
    document.getElementById("acertosComp").innerText = "0";
    document.getElementById("errosComp").innerText = "0";
    document.getElementById("finalizarFase2Btn").disabled = true;
    itensData.forEach((item, idx) => {
        const div = document.createElement("div");
        div.className = "item-compostagem";
        div.setAttribute("draggable", "true");
        div.setAttribute("data-tipo", item.tipo);
        div.innerText = item.nome;
        div.id = `dragItem${idx}`;
        div.addEventListener("dragstart", handleDragStart);
        container.appendChild(div);
        gameState.itensCompostagemList.push(div);
    });
}

let dragItemAtual = null;
function handleDragStart(e) {
    dragItemAtual = e.target;
    e.dataTransfer.setData("text/plain", "");
}
const composteira = document.getElementById("composteira");
composteira.addEventListener("dragover", (e) => e.preventDefault());
composteira.addEventListener("drop", (e) => {
    e.preventDefault();
    if(!dragItemAtual) return;
    const tipo = dragItemAtual.getAttribute("data-tipo");
    const isCerto = (tipo === "certo");
    if(isCerto) {
        gameState.compostagemAcertos++;
        gameState.pontos += 10;
        mostrarFeedback("✅ Ótimo! +10 pontos", "success");
    } else {
        gameState.compostagemErros++;
        gameState.pontos = Math.max(0, gameState.pontos-5);
        mostrarFeedback("❌ Isso não vai para compostagem! -5 pontos", "error");
    }
    updateScoreUI();
    document.getElementById("acertosComp").innerText = gameState.compostagemAcertos;
    document.getElementById("errosComp").innerText = gameState.compostagemErros;
    dragItemAtual.remove();
    gameState.compostagemTotalArrastados++;
    if(gameState.compostagemTotalArrastados >= 7) {
        gameState.fase2Complete = true;
        unlockConquista("compostagem", "Mestre da Compostagem");
        document.getElementById("finalizarFase2Btn").disabled = false;
        setFelipeDialog("fase2", "Excelente! Você produziu adubo natural. Fortaleceu o solo. Vamos plantar!");
    }
    dragItemAtual = null;
});

document.getElementById("finalizarFase2Btn").addEventListener("click", () => {
    if(gameState.fase2Complete){
        showScreen("fase3");
        inicializarFase3();
        updateGlobalProgress();
    }
});

// ---- FASE 3 PLANTIO ----
function inicializarFase3() {
    if(gameState.fase3Complete) return;
    setFelipeDialog("fase3", "Arraste cada muda para o canteiro correto, depois regue e veja crescer!");
    gameState.fase3MudasPlantadas = 0;
    document.getElementById("regarContainer").style.display = "none";
    document.getElementById("crescimentoAnimacao").innerHTML = "";
    document.getElementById("finalizarFase3Btn").disabled = true;
    const mudas = document.querySelectorAll(".muda");
    const canteiros = document.querySelectorAll(".canteiro");
    mudas.forEach(m => {
        m.addEventListener("dragstart", e => {
            e.dataTransfer.setData("planta", m.getAttribute("data-planta"));
        });
    });
    canteiros.forEach(c => {
        c.addEventListener("dragover", e => e.preventDefault());
        c.addEventListener("drop", e => {
            e.preventDefault();
            const planta = e.dataTransfer.getData("planta");
            const expected = c.getAttribute("data-expected");
            if(planta === expected && !c.classList.contains("plantado")) {
                c.classList.add("plantado");
                c.innerText = c.innerText + ` ✅ ${planta}`;
                gameState.fase3MudasPlantadas++;
                if(gameState.fase3MudasPlantadas === 3) {
                    document.getElementById("regarContainer").style.display = "block";
                }
                mostrarFeedback(`Muda de ${planta} plantada corretamente!`, "success");
            } else {
                mostrarFeedback("Canteiro incorreto ou já plantado!", "error");
            }
        });
    });
    document.getElementById("regarPlantasBtn").onclick = () => {
        if(gameState.fase3MudasPlantadas === 3 && !gameState.regado) {
            gameState.regado = true;
            let etapas = ["🌱", "🌿", "🍅 Tomate | 🥬 Alface | 🌽 Milho"];
            let i=0;
            const growthDiv = document.getElementById("crescimentoAnimacao");
            const interval = setInterval(() => {
                growthDiv.innerHTML = etapas[i] || "🌾 Colheita abundante!";
                i++;
                if(i>2) {
                    clearInterval(interval);
                    gameState.pontos += 50;
                    updateScoreUI();
                    gameState.fase3Complete = true;
                    unlockConquista("agricultor", "Agricultor Sustentável");
                    document.getElementById("finalizarFase3Btn").disabled = false;
                    setFelipeDialog("fase3", "Parabéns! Você cultivou alimentos de forma sustentável!");
                }
            }, 1000);
        }
    };
    document.getElementById("finalizarFase3Btn").onclick = () => {
        if(gameState.fase3Complete) { showScreen("quiz"); iniciarQuiz(); updateGlobalProgress();}
    };
}

// QUIZ
let quizIndex = 0, quizPerguntas = [
    { pergunta: "Qual é a função das abelhas?", opcoes: ["Produzir plástico", "Polinizar plantas", "Produzir fumaça"], correta: 1 },
    { pergunta: "O que pode ir para a composteira?", opcoes: ["Casca de banana", "Pilha", "Plástico"], correta: 0 },
    { pergunta: "O que ajuda uma agricultura sustentável?", opcoes: ["Queimadas", "Desmatamento", "Compostagem e preservação ambiental"], correta: 2 }
];
function iniciarQuiz() {
    quizIndex = 0; gameState.quizAcertos = 0;
    exibirPergunta();
}
function exibirPergunta() {
    if(quizIndex >= quizPerguntas.length) finalizarQuiz();
    else {
        const p = quizPerguntas[quizIndex];
        document.getElementById("quizPergunta").innerHTML = `<h3>${p.pergunta}</h3>`;
        const opDiv = document.getElementById("quizOpcoes");
        opDiv.innerHTML = "";
        p.opcoes.forEach((op, idx) => {
            let btn = document.createElement("button");
            btn.innerText = op;
            btn.onclick = () => {
                if(idx === p.correta) {
                    gameState.quizAcertos++; gameState.pontos += 10;
                    mostrarFeedback("Correto! +10 pontos", "success");
                } else mostrarFeedback("Errado!", "error");
                updateScoreUI();
                quizIndex++;
                exibirPergunta();
            };
            opDiv.appendChild(btn);
        });
    }
}
function finalizarQuiz() {
    if(gameState.quizAcertos >= 3) unlockConquista("heroi", "Herói do Agro Sustentável");
    showScreen("certificado");
    document.getElementById("certNome").innerText = gameState.nome;
    document.getElementById("dataCertificado").innerText = new Date().toLocaleDateString();
    updateGlobalProgress();
}
document.getElementById("baixarCertificadoBtn").addEventListener("click", () => window.print());
document.getElementById("avancarTelaFinalBtn").addEventListener("click", () => {
    showScreen("final");
    document.getElementById("finalMensagem").innerHTML = `${gameState.nome}, lembre-se: produzir alimentos e preservar a natureza devem caminhar juntos.<br>Você concluiu sua missão com sucesso! 🌎🚜`;
});
// Reiniciar e menu
function resetFullGame() {
    location.reload();
}
document.getElementById("resetGameBtn").onclick = resetFullGame;
document.getElementById("menuPrincipalBtn").onclick = () => resetFullGame();
document.getElementById("jogarNovamenteBtn").onclick = resetFullGame;
document.getElementById("menuFinalBtn").onclick = resetFullGame;

// Controles de interface (modo escuro, fonte, alto contraste)
document.getElementById("darkModeToggle").onclick = () => document.body.classList.toggle("dark-mode");
document.getElementById("highContrastToggle").onclick = () => document.body.classList.toggle("high-contrast");
document.getElementById("increaseFontBtn").onclick = () => {
    if(document.body.classList.contains("font-large")) document.body.classList.add("font-xlarge");
    else if(document.body.classList.contains("font-xlarge")) {}
    else document.body.classList.add("font-large");
};
document.getElementById("decreaseFontBtn").onclick = () => {
    if(document.body.classList.contains("font-xlarge")) document.body.classList.remove("font-xlarge");
    else if(document.body.classList.contains("font-large")) document.body.classList.remove("font-large");
};

// Fluxo inicial da apresentação
document.getElementById("confirmarNomeBtn").onclick = () => {
    let nome = document.getElementById("nomeJogador").value.trim();
    if(nome === "") nome = "AgroHerói";
    gameState.nome = nome;
    document.getElementById("nomeExibido").innerText = nome;
    document.getElementById("playerNameDisplay").innerText = nome;
    document.querySelector(".form-apresentacao").style.display = "none";
    document.getElementById("personagemChoice").style.display = "block";
};
document.getElementById("personagemMenino").onclick = () => { gameState.avatar = "👦"; finalizarIntro(); };
document.getElementById("personagemMenina").onclick = () => { gameState.avatar = "👧"; finalizarIntro(); };
function finalizarIntro() {
    document.getElementById("playerAvatarDisplay").innerHTML = gameState.avatar;
    showScreen("fase1");
    setFelipeDialog("fase1", `${gameState.nome}, você sabia que muitas plantas dependem das abelhas? Use as setas, colete 10 flores e desvie da fumaça/fogo.`);
    document.getElementById("iniciarFase1Btn").addEventListener("click", iniciarFase1Game);
}
window.addEventListener("keydown", (e) => { if(teclas.hasOwnProperty(e.key)) teclas[e.key]=true; });
window.addEventListener("keyup", (e) => { if(teclas.hasOwnProperty(e.key)) teclas[e.key]=false; });
updateScoreUI();
