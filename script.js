// ========== AGRO FORTE - JOGO COMPLETO CORRIGIDO ==========

// DADOS DO JOGADOR
let playerName = "";
let selectedChar = "boy";

// ========== FASE 1 - JOGO DA ABELHA ==========
let beeGame = {
    canvas: null,
    ctx: null,
    beeY: 200,
    flowers: [],
    obstacles: [],
    score: 0,
    collisions: 0,
    gameRunning: true,
    animationId: null,
    keys: { ArrowUp: false, ArrowDown: false }
};

// ========== FASE 2 - COMPOSTAGEM ==========
let compostGame = {
    acertos: 0,
    erros: 0,
    items: [
        { name: "🍌 Casca de Banana", type: "organico", emoji: "🍌" },
        { name: "🍃 Folhas Secas", type: "organico", emoji: "🍃" },
        { name: "🍎 Casca de Maçã", type: "organico", emoji: "🍎" },
        { name: "🥬 Restos de Verduras", type: "organico", emoji: "🥬" },
        { name: "🥫 Lata", type: "rejeito", emoji: "🥫" },
        { name: "🧴 Plástico", type: "rejeito", emoji: "🧴" },
        { name: "🔋 Pilha", type: "rejeito", emoji: "🔋" },
        { name: "☕ Borra de Café", type: "organico", emoji: "☕" }
    ],
    currentItems: []
};

// ========== FASE 3 - PLANTANDO O FUTURO ==========
let farmGame = {
    spots: [
        { planted: false, grown: false, type: null, name: null, emoji: null },
        { planted: false, grown: false, type: null, name: null, emoji: null },
        { planted: false, grown: false, type: null, name: null, emoji: null },
        { planted: false, grown: false, type: null, name: null, emoji: null },
        { planted: false, grown: false, type: null, name: null, emoji: null },
        { planted: false, grown: false, type: null, name: null, emoji: null }
    ],
    mudasCount: 0,
    regadas: 0
};

let selectedSeedType = null;
let selectedSeedName = null;

// DOM Elements
let introScreen, charSelectScreen, fase1Screen, fase2Screen, fase3Screen, finalScreen;

// ========== FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO ==========
function init() {
    console.log("Inicializando jogo...");
    
    // Capturar telas
    introScreen = document.getElementById("introScreen");
    charSelectScreen = document.getElementById("charSelectScreen");
    fase1Screen = document.getElementById("fase1Screen");
    fase2Screen = document.getElementById("fase2Screen");
    fase3Screen = document.getElementById("fase3Screen");
    finalScreen = document.getElementById("finalScreen");
    
    // Verificar se as telas existem
    if (!introScreen) console.error("introScreen não encontrada");
    if (!charSelectScreen) console.error("charSelectScreen não encontrada");
    
    // ========== FASE 0: Botão CONTINUAR ==========
    const confirmBtn = document.getElementById("confirmNameBtn");
    if (confirmBtn) {
        confirmBtn.addEventListener("click", function() {
            console.log("Botão CONTINUAR clicado!");
            const nomeInput = document.getElementById("playerNameIntro");
            const nome = nomeInput.value.trim();
            
            if (nome === "") {
                alert("🌱 Digite seu nome para começar!");
                return;
            }
            
            playerName = nome;
            console.log("Nome do jogador:", playerName);
            
            // Atualizar nome em todos os lugares
            const displayNameSpan = document.getElementById("displayName");
            if (displayNameSpan) displayNameSpan.textContent = playerName;
            
            const finalPlayerNameSpan = document.getElementById("finalPlayerName");
            if (finalPlayerNameSpan) finalPlayerNameSpan.textContent = playerName;
            
            // Trocar tela
            introScreen.classList.remove("active");
            charSelectScreen.classList.add("active");
            console.log("Trocou para tela de seleção de personagem");
        });
    } else {
        console.error("Botão confirmNameBtn não encontrado!");
    }
    
    // ========== SELEÇÃO DE PERSONAGEM ==========
    const charCards = document.querySelectorAll(".char-card");
    charCards.forEach(card => {
        card.addEventListener("click", () => {
            charCards.forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            selectedChar = card.getAttribute("data-char");
            console.log("Personagem selecionado:", selectedChar);
        });
    });
    
    // Botão para iniciar Fase 1
    const startFase1Btn = document.getElementById("startFase1Btn");
    if (startFase1Btn) {
        startFase1Btn.addEventListener("click", () => {
            console.log("Iniciando Fase 1...");
            charSelectScreen.classList.remove("active");
            startFase1();
        });
    }
    
    // Botões de próxima fase
    const nextToFase2Btn = document.getElementById("nextToFase2Btn");
    if (nextToFase2Btn) {
        nextToFase2Btn.addEventListener("click", () => {
            console.log("Indo para Fase 2...");
            stopBeeGame();
            fase1Screen.classList.remove("active");
            startFase2();
        });
    }
    
    const nextToFase3Btn = document.getElementById("nextToFase3Btn");
    if (nextToFase3Btn) {
        nextToFase3Btn.addEventListener("click", () => {
            console.log("Indo para Fase 3...");
            fase2Screen.classList.remove("active");
            startFase3();
        });
    }
    
    const nextToFinalBtn = document.getElementById("nextToFinalBtn");
    if (nextToFinalBtn) {
        nextToFinalBtn.addEventListener("click", () => {
            console.log("Indo para tela final...");
            fase3Screen.classList.remove("active");
            showFinal();
        });
    }
    
    const playAgainBtn = document.getElementById("playAgainBtn");
    if (playAgainBtn) {
        playAgainBtn.addEventListener("click", () => {
            console.log("Reiniciando jogo...");
            finalScreen.classList.remove("active");
            introScreen.classList.add("active");
            document.getElementById("playerNameIntro").value = "";
            resetGame();
        });
    }
    
    // Selecionar personagem padrão (Menino)
    const defaultCard = document.querySelector('.char-card[data-char="boy"]');
    if (defaultCard) defaultCard.classList.add("selected");
}

// ========== FASE 1: JOGO DA ABELHA ==========
function startFase1() {
    console.log("startFase1 chamado");
    
    const dialogText = document.getElementById("fase1DialogText");
    if (dialogText) {
        dialogText.innerHTML = `${playerName}, você sabia que muitas plantas precisam das abelhas para produzir frutas? Sem os polinizadores, a produção de alimentos seria muito menor. Ajude esta abelha a chegar até as flores! Use as setas ↑ e ↓ para desviar da fumaça e do fogo.`;
    }
    
    fase1Screen.classList.add("active");
    initBeeGame();
}

function initBeeGame() {
    beeGame.canvas = document.getElementById("beeGameCanvas");
    if (!beeGame.canvas) return;
    
    beeGame.ctx = beeGame.canvas.getContext("2d");
    beeGame.beeY = 200;
    beeGame.score = 0;
    beeGame.collisions = 0;
    beeGame.gameRunning = true;
    beeGame.flowers = [];
    beeGame.obstacles = [];
    
    beeGame.canvas.width = 800;
    beeGame.canvas.height = 400;
    
    // Criar flores
    for (let i = 0; i < 10; i++) {
        beeGame.flowers.push({
            x: 100 + Math.random() * 600,
            y: 30 + Math.random() * 340,
            collected: false
        });
    }
    
    // Criar obstáculos
    for (let i = 0; i < 8; i++) {
        beeGame.obstacles.push({
            x: 80 + Math.random() * 650,
            y: 30 + Math.random() * 340,
            type: Math.random() > 0.5 ? "💨" : "🔥"
        });
    }
    
    // Controles do teclado
    const keyHandler = (e) => {
        if (e.key === "ArrowUp") beeGame.keys.ArrowUp = true;
        if (e.key === "ArrowDown") beeGame.keys.ArrowDown = true;
        e.preventDefault();
    };
    
    const keyUpHandler = (e) => {
        if (e.key === "ArrowUp") beeGame.keys.ArrowUp = false;
        if (e.key === "ArrowDown") beeGame.keys.ArrowDown = false;
    };
    
    window.removeEventListener("keydown", keyHandler);
    window.removeEventListener("keyup", keyUpHandler);
    window.addEventListener("keydown", keyHandler);
    window.addEventListener("keyup", keyUpHandler);
    
    beeGame.keyHandler = keyHandler;
    beeGame.keyUpHandler = keyUpHandler;
    
    updateBeeGame();
}

function updateBeeGame() {
    if (!beeGame.gameRunning) return;
    
    // Movimento
    if (beeGame.keys.ArrowUp && beeGame.beeY > 20) beeGame.beeY -= 3;
    if (beeGame.keys.ArrowDown && beeGame.beeY < 380) beeGame.beeY += 3;
    
    const ctx = beeGame.ctx;
    ctx.clearRect(0, 0, 800, 400);
    
    // Chão
    ctx.fillStyle = "#6b8c5c";
    ctx.fillRect(0, 300, 800, 100);
    
    // Flores
    beeGame.flowers.forEach(flower => {
        if (!flower.collected) {
            ctx.font = "25px Arial";
            ctx.fillStyle = "#ff69b4";
            ctx.fillText("🌸", flower.x, flower.y);
            
            if (Math.abs(flower.x - 50) < 30 && Math.abs(flower.y - beeGame.beeY) < 25) {
                flower.collected = true;
                beeGame.score++;
                document.getElementById("floresColetadas").textContent = beeGame.score;
            }
        }
    });
    
    // Obstáculos
    beeGame.obstacles.forEach(obs => {
        ctx.font = "25px Arial";
        ctx.fillStyle = obs.type === "💨" ? "#9e9e9e" : "#ff5722";
        ctx.fillText(obs.type, obs.x, obs.y);
        
        if (Math.abs(obs.x - 50) < 30 && Math.abs(obs.y - beeGame.beeY) < 25) {
            beeGame.collisions++;
            document.getElementById("colisoesCount").textContent = beeGame.collisions;
            obs.x = 700 + Math.random() * 100;
            obs.y = 30 + Math.random() * 340;
        }
    });
    
    // Abelha
    ctx.font = "30px Arial";
    ctx.fillStyle = "#ffc107";
    ctx.fillText(selectedChar === "boy" ? "🐝👦" : "🐝👧", 50, beeGame.beeY);
    
    // Movimento
    beeGame.flowers.forEach(flower => { if (!flower.collected) flower.x -= 2; });
    beeGame.obstacles.forEach(obs => { obs.x -= 2.5; });
    
    // Reciclar
    beeGame.flowers = beeGame.flowers.filter(f => f.x > -50);
    beeGame.obstacles = beeGame.obstacles.filter(o => o.x > -50);
    
    if (beeGame.flowers.length < 8 && Math.random() < 0.02) {
        beeGame.flowers.push({ x: 800, y: 30 + Math.random() * 340, collected: false });
    }
    if (beeGame.obstacles.length < 6 && Math.random() < 0.015) {
        beeGame.obstacles.push({ x: 800, y: 30 + Math.random() * 340, type: Math.random() > 0.5 ? "💨" : "🔥" });
    }
    
    // Vitória
    if (beeGame.score >= 10) {
        beeGame.gameRunning = false;
        document.getElementById("nextToFase2Btn").style.display = "block";
        const dialog = document.getElementById("fase1DialogText");
        if (dialog) {
            dialog.innerHTML = `Muito bem, ${playerName}! Você ajudou a proteger os polinizadores e contribuiu para uma agricultura mais sustentável.`;
        }
        return;
    }
    
    beeGame.animationId = requestAnimationFrame(updateBeeGame);
}

function stopBeeGame() {
    if (beeGame.animationId) cancelAnimationFrame(beeGame.animationId);
    if (beeGame.keyHandler) window.removeEventListener("keydown", beeGame.keyHandler);
    if (beeGame.keyUpHandler) window.removeEventListener("keyup", beeGame.keyUpHandler);
}

// ========== FASE 2: COMPOSTAGEM ==========
function startFase2() {
    console.log("startFase2 chamado");
    
    const dialog = document.getElementById("fase2DialogText");
    if (dialog) {
        dialog.innerHTML = `${playerName}, agora vamos aprender sobre compostagem. Restos de frutas, verduras e folhas podem virar adubo natural. Clique nos itens certos para colocar na composteira!`;
    }
    
    compostGame.acertos = 0;
    compostGame.erros = 0;
    document.getElementById("acertosComp").textContent = "0";
    document.getElementById("errosComp").textContent = "0";
    
    compostGame.currentItems = [...compostGame.items];
    for (let i = compostGame.currentItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [compostGame.currentItems[i], compostGame.currentItems[j]] = [compostGame.currentItems[j], compostGame.currentItems[i]];
    }
    
    renderCompostItems();
    
    document.getElementById("nextToFase3Btn").style.display = "none";
    document.getElementById("compostMessage").innerHTML = "";
    
    // Configurar lixeira
    const lixeira = document.getElementById("lixeira");
    if (lixeira) {
        lixeira.onclick = () => handleWrongItem();
    }
    
    fase2Screen.classList.add("active");
}

function renderCompostItems() {
    const area = document.getElementById("itemsArea");
    if (!area) return;
    area.innerHTML = "";
    
    compostGame.currentItems.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "compost-item";
        div.innerHTML = `<span style="font-size:2rem">${item.emoji}</span><br>${item.name}`;
        div.onclick = () => handleCompostClick(index, item);
        area.appendChild(div);
    });
}

function handleCompostClick(index, item) {
    const isCorrect = item.type === "organico";
    
    if (isCorrect) {
        compostGame.acertos++;
        document.getElementById("acertosComp").textContent = compostGame.acertos;
        document.getElementById("compostMessage").innerHTML = "✅ Correto! Este item pode ir para a composteira! ✅";
        document.getElementById("compostMessage").style.background = "#c8e6c9";
        
        compostGame.currentItems.splice(index, 1);
        renderCompostItems();
    } else {
        // Itens errados vão para a lixeira
        handleWrongItem();
    }
    
    if (compostGame.currentItems.length === 0 || compostGame.acertos >= 5) {
        document.getElementById("compostMessage").innerHTML = `🎉 Excelente trabalho, ${playerName}! Você transformou resíduos orgânicos em adubo natural! 🎉`;
        document.getElementById("nextToFase3Btn").style.display = "block";
    }
}

function handleWrongItem() {
    compostGame.erros++;
    document.getElementById("errosComp").textContent = compostGame.erros;
    document.getElementById("compostMessage").innerHTML = "❌ Errado! Este item NÃO pode ir para a composteira. Coloque no lixo rejeitado. ❌";
    document.getElementById("compostMessage").style.background = "#ffcdd2";
    
    // Remover um item orgânico aleatório para equilibrar
    const organicIndex = compostGame.currentItems.findIndex(i => i.type === "organico");
    if (organicIndex !== -1) {
        compostGame.currentItems.splice(organicIndex, 1);
        renderCompostItems();
    }
}

// ========== FASE 3: PLANTANDO O FUTURO ==========
function startFase3() {
    console.log("startFase3 chamado");
    
    const dialog = document.getElementById("fase3DialogText");
    if (dialog) {
        dialog.innerHTML = `${playerName}, graças às abelhas e à compostagem, agora podemos produzir alimentos de forma sustentável. Vamos plantar mudas e ajudar o campo a crescer!`;
    }
    
    // Reset
    farmGame.spots = [
        { planted: false, grown: false, type: null, name: null, emoji: null },
        { planted: false, grown: false, type: null, name: null, emoji: null },
        { planted: false, grown: false, type: null, name: null, emoji: null },
        { planted: false, grown: false, type: null, name: null, emoji: null },
        { planted: false, grown: false, type: null, name: null, emoji: null },
        { planted: false, grown: false, type: null, name: null, emoji: null }
    ];
    farmGame.mudasCount = 0;
    farmGame.regadas = 0;
    selectedSeedType = null;
    selectedSeedName = null;
    
    document.getElementById("mudasPlantadas").textContent = "0";
    document.getElementById("regadasCount").textContent = "0";
    document.getElementById("nextToFinalBtn").style.display = "none";
    document.getElementById("plantMessage").innerHTML = "";
    
    renderPlantSpots();
    enableSeedlings();
    
    document.getElementById("waterBtn").onclick = waterPlants;
    
    fase3Screen.classList.add("active");
}

function renderPlantSpots() {
    const container = document.getElementById("plantSpots");
    if (!container) return;
    container.innerHTML = "";
    
    farmGame.spots.forEach((spot, index) => {
        const div = document.createElement("div");
        div.className = `plant-spot ${spot.planted ? "planted" : "empty"} ${spot.grown ? "grown" : ""}`;
        
        if (spot.planted) {
            div.innerHTML = `<div class="plant-emoji">${spot.emoji}</div>
                            <div class="plant-name">${spot.name}</div>
                            ${spot.grown ? '<span style="font-size:0.7rem">🌱 CRESCIDO! 🌱</span>' : '<span style="font-size:0.7rem">💧 Precisa regar</span>'}`;
        } else {
            div.innerHTML = `<div class="plant-emoji">⬜</div>
                            <div class="plant-name">Vazio</div>
                            <span style="font-size:0.7rem">Clique para plantar</span>`;
        }
        
        div.onclick = () => plantSeed(index);
        container.appendChild(div);
    });
}

function enableSeedlings() {
    const seedlings = document.querySelectorAll(".seedling");
    seedlings.forEach(seedling => {
        seedling.onclick = () => {
            const type = seedling.getAttribute("data-type");
            const name = seedling.textContent;
            selectedSeedType = type;
            selectedSeedName = name;
            document.getElementById("plantMessage").innerHTML = `🌱 Muda de ${name} selecionada! Clique em um espaço vazio para plantar. 🌱`;
            document.getElementById("plantMessage").style.background = "#c8e6c9";
        };
    });
}

function plantSeed(index) {
    if (!selectedSeedType) {
        document.getElementById("plantMessage").innerHTML = "⚠️ Primeiro selecione uma muda! ⚠️";
        document.getElementById("plantMessage").style.background = "#fff3e0";
        return;
    }
    
    if (farmGame.spots[index].planted) {
        document.getElementById("plantMessage").innerHTML = "❌ Este espaço já está plantado! ❌";
        return;
    }
    
    const emojis = { tomate: "🍅", alface: "🥬", milho: "🌽" };
    farmGame.spots[index] = {
        planted: true,
        grown: false,
        type: selectedSeedType,
        name: selectedSeedName,
        emoji: emojis[selectedSeedType]
    };
    
    farmGame.mudasCount++;
    document.getElementById("mudasPlantadas").textContent = farmGame.mudasCount;
    
    selectedSeedType = null;
    selectedSeedName = null;
    
    renderPlantSpots();
    document.getElementById("plantMessage").innerHTML = "✅ Muda plantada! Não esqueça de regar para crescer! ✅";
}

function waterPlants() {
    let wateredCount = 0;
    
    farmGame.spots.forEach(spot => {
        if (spot.planted && !spot.grown) {
            spot.grown = true;
            wateredCount++;
        }
    });
    
    farmGame.regadas += wateredCount;
    document.getElementById("regadasCount").textContent = farmGame.regadas;
    renderPlantSpots();
    
    if (wateredCount > 0) {
        document.getElementById("plantMessage").innerHTML = `💧 ${wateredCount} planta(s) regada(s)! Agora estão crescendo forte! 💧`;
    } else {
        document.getElementById("plantMessage").innerHTML = "⚠️ Não há plantas para regar! Plante primeiro! ⚠️";
    }
    
    const allPlanted = farmGame.spots.every(spot => spot.planted);
    const allGrown = farmGame.spots.every(spot => spot.grown);
    
    if (allPlanted && allGrown) {
        document.getElementById("nextToFinalBtn").style.display = "block";
        document.getElementById("plantMessage").innerHTML = `🎉 Parabéns, ${playerName}! Sua fazenda está produzindo! 🎉`;
    }
}

// ========== TELA FINAL ==========
function showFinal() {
    console.log("showFinal chamado");
    finalScreen.classList.add("active");
}

function resetGame() {
    if (beeGame.animationId) cancelAnimationFrame(beeGame.animationId);
    beeGame.gameRunning = false;
    
    document.getElementById("nextToFase2Btn").style.display = "none";
    document.getElementById("nextToFase3Btn").style.display = "none";
    document.getElementById("nextToFinalBtn").style.display = "none";
}

// Iniciar tudo
window.addEventListener("DOMContentLoaded", init);
