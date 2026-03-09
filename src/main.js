import "./style.css";
import confetti from "canvas-confetti";
import spinSoundUrl from "../public/slot-machine.mp3";
import winSoundUrl from "../public/confetti-gun.mp3";

/**
 * Constants
 */
const ICON_MAP = [
  "abbott",
  "bellanew",
  "vagicort",
  "bellaface",
  "gynets",
  "sinoimplant",
  "Durax",
  "biogaia",
  "gigi12",
  "rifax",
  "izinova",
  "influvac",
  "genfilgras",
  "abxeda",
  "bisintex",
  "nedox",
  "klaricid",
  "synthroid",
  "samexid",
  "valcote",
  "luvox",
  "ericox",
  "doxu",
  "trilipix",
  "doliren",
];

const LOGO_HEIGHT = 512; // px - altura de cada logo en la tira (12797px / 25 logos)
const SPIN_DURATION = 2500; // ms - duración del giro (más rápido)
const BACKOFF = 3; // Múltiplo de rotaciones antes de frenar para efecto suave
const REEL_WIDTH = 200; // px - ancho visual del reel
const REEL_HEIGHT = 600; // px - altura visual del reel (3 logos de 200px cada uno)
const LOGO_HEIGHT_VISUAL = REEL_HEIGHT / 3; // altura visual de cada logo

/**
 * Game State
 */
const gameState = {
  spinning: false,
  winCount: 0,
  reels: [null, null, null], // Posiciones finales de cada reel (0-24)
  winProbability: 0, // 0 = normal, 10, 20, 40 = probabilidad mejorada
};

/**
 * DOM Elements
 */
const reels = Array.from(document.querySelectorAll(".reel"));
const spinButton = document.getElementById("spinButton");
const magicButton = document.getElementById("secretWinButton");
const acumuladoDiv = document.getElementById("acumulado");

// Botones de probabilidad
const prob10Button = document.getElementById("prob10");
const prob20Button = document.getElementById("prob20");
const prob40Button = document.getElementById("prob40");

/**
 * Audio Elements
 */
const spinSound = new Audio(spinSoundUrl);
const winSound = new Audio(winSoundUrl);

/**
 * Initialize Reels - Mostrar logos aleatorios iniciales
 */
function initializeReels() {
  gameState.reels = [
    Math.floor(Math.random() * ICON_MAP.length),
    Math.floor(Math.random() * ICON_MAP.length),
    Math.floor(Math.random() * ICON_MAP.length),
  ];
  updateReelPositions();
}

/**
 * Update Reel Positions - Actualizar background-position de los reels
 * El logo ganador está en la posición del MEDIO (posición 1 de 0-1-2)
 */
function updateReelPositions() {
  reels.forEach((reel, index) => {
    const logoIndex = gameState.reels[index];
    const yOffset = -(logoIndex - 1) * LOGO_HEIGHT_VISUAL;
    reel.style.backgroundPosition = `0px ${yOffset}px`;
  });
}

/**
 * Spin Reels - Simulación de giro suave
 */
async function spinReels() {
  if (gameState.spinning) return;

  gameState.spinning = true;
  spinButton.disabled = true;
  magicButton.disabled = true;

  // Reproducir sonido de giro
  spinSound.currentTime = 0;
  spinSound.play().catch((e) => console.log("Audio play error:", e));

  // Determinar posiciones finales
  let finalPositions = [
    Math.floor(Math.random() * ICON_MAP.length),
    Math.floor(Math.random() * ICON_MAP.length),
    Math.floor(Math.random() * ICON_MAP.length),
  ];

  // Verificar si se debe aplicar probabilidad mejorada
  if (gameState.winProbability > 0) {
    const randomValue = Math.random() * 100;
    if (randomValue < gameState.winProbability) {
      // Forzar victoria con el porcentaje configurado
      const winningLogo = Math.floor(Math.random() * ICON_MAP.length);
      finalPositions = [winningLogo, winningLogo, winningLogo];
    }
  }

  // Animar cada reel con retraso secuencial (efecto cascada)
  const REEL_START_DELAY = 200; // ms delay entre inicio de cada reel
  const REEL_STOP_DELAY = 300; // ms delay adicional para que paren en secuencia
  
  const animations = reels.map((reel, index) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        animateReel(reel, finalPositions[index], index * REEL_STOP_DELAY).then(resolve);
      }, index * REEL_START_DELAY);
    });
  });

  // Esperar a que todas las animaciones terminen
  await Promise.all(animations);

  // Actualizar estado
  gameState.reels = finalPositions;

  // Detener sonido de giro
  spinSound.pause();

  // Verificar ganador
  if (checkWinner()) {
    handleWin();
  } else {
    endSpin();
  }
}

/**
 * Animate Single Reel - Rotación fluida con easing
 */
function animateReel(reel, finalLogoIndex, stopDelay = 0) {
  return new Promise((resolve) => {
    // Remover transición anterior para resetear
    reel.style.transition = "none";
    
    // Calcular posición inicial con múltiples rotaciones
    const rotations = BACKOFF * ICON_MAP.length + finalLogoIndex;
    const startPosition = -(rotations * LOGO_HEIGHT_VISUAL);
    reel.style.backgroundPosition = `0px ${startPosition}px`;
    
    // Forzar reflow para asegurar que se aplique la posición inicial
    void reel.offsetHeight;
    
    // Aplicar transición y nueva posición (con duración ajustada)
    const adjustedDuration = SPIN_DURATION + stopDelay;
    reel.style.transition = `background-position ${adjustedDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    const finalPosition = -(finalLogoIndex - 1) * LOGO_HEIGHT_VISUAL;
    reel.style.backgroundPosition = `0px ${finalPosition}px`;

    // Resolver cuando termine la animación
    setTimeout(() => {
      reel.style.transition = "none";
      resolve();
    }, adjustedDuration);
  });
}

/**
 * Check Winner - Detectar si los 3 logos son iguales
 */
function checkWinner() {
  const [first, second, third] = gameState.reels;
  return first === second && second === third;
}

/**
 * Handle Win - Reproducir efectos de victoria
 */
function handleWin() {
  gameState.winCount += 1;
  updateCounterDisplay();

  // Reproducir sonido de confetti
  winSound.currentTime = 0;
  winSound.play().catch((e) => console.log("Audio play error:", e));

  // Animar slots con efecto visual
  const slotsContainer = document.querySelector(".slots");
  slotsContainer.classList.add("win");

  // Disparar confetti
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });

  // Remover clase win después de animación
  setTimeout(() => {
    slotsContainer.classList.remove("win");
    endSpin();
  }, 2000);
}

/**
 * End Spin - Resetear estado de giro
 */
function endSpin() {
  gameState.spinning = false;
  spinButton.disabled = false;
  magicButton.disabled = false;
}

/**
 * Update Counter Display
 */
function updateCounterDisplay() {
  acumuladoDiv.textContent = `Victorias: ${gameState.winCount}`;
}

/**
 * Toggle Probability Mode
 */
function toggleProbability(probability) {
  if (gameState.spinning) return;
  
  // Si ya está activo, desactivarlo; si no, activarlo
  if (gameState.winProbability === probability) {
    gameState.winProbability = 0;
  } else {
    gameState.winProbability = probability;
  }
  
  // Actualizar estilos de botones
  updateProbabilityButtons();
}

/**
 * Update Probability Buttons Style
 */
function updateProbabilityButtons() {
  [prob10Button, prob20Button, prob40Button].forEach(button => {
    const prob = parseInt(button.dataset.probability);
    if (prob === gameState.winProbability) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

/**
 * Event Listeners
 */
spinButton.addEventListener("click", spinReels);

// Ocultar botón mágico original
if (magicButton) {
  magicButton.style.display = "none";
}

// Event listeners para botones de probabilidad
prob10Button.addEventListener("click", () => toggleProbability(10));
prob20Button.addEventListener("click", () => toggleProbability(20));
prob40Button.addEventListener("click", () => toggleProbability(40));

/**
 * Initialize
 */
initializeReels();
updateCounterDisplay();
updateProbabilityButtons();
