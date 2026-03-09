import "./style.css";
import confetti from "canvas-confetti";

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
const SPIN_DURATION = 3500; // ms - duración del giro
const BACKOFF = 3; // Múltiplo de rotaciones antes de frenar para efecto suave

/**
 * Game State
 */
const gameState = {
  spinning: false,
  nextWinForced: false,
  winCount: 0,
  reels: [null, null, null], // Posiciones finales de cada reel (0-24)
};

/**
 * DOM Elements
 */
const reels = Array.from(document.querySelectorAll(".reel"));
const spinButton = document.getElementById("spinButton");
const magicButton = document.getElementById("secretWinButton");
const acumuladoDiv = document.getElementById("acumulado");

/**
 * Audio Elements
 */
const spinSound = new Audio("/slot-machine.mp3");
const winSound = new Audio("/confetti-gun.mp3");
spinSound.preload = "auto";
winSound.preload = "auto";

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
 */
function updateReelPositions() {
  reels.forEach((reel, index) => {
    const logoIndex = gameState.reels[index];
    const yOffset = -(logoIndex * LOGO_HEIGHT);
    reel.style.backgroundPosition = `0 ${yOffset}px`;
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

  // Si está habilitado el botón mágico, forzar victoria con mismo logo aleatorio
  if (gameState.nextWinForced) {
    const winningLogo = Math.floor(Math.random() * ICON_MAP.length);
    finalPositions = [winningLogo, winningLogo, winningLogo];
    gameState.nextWinForced = false;
    // Actualizar visual del botón mágico
    updateMagicButtonState();
  }

  // Animar cada reel con rotaciones múltiples + suavizado
  const animations = reels.map((reel, index) => {
    return animateReel(reel, finalPositions[index]);
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
function animateReel(reel, finalLogoIndex) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const startPosition = parseFloat(reel.style.backgroundPosition) || 0;

    // Calcular rotaciones totales: múltiples vueltas + posición final
    const rotations = BACKOFF * ICON_MAP.length + finalLogoIndex;
    const totalDistance = rotations * LOGO_HEIGHT;

    // Usar CSS animation con easing suave (cubic-bezier para aceleración-desaceleración)
    reel.style.transition = `background-position ${SPIN_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    reel.style.backgroundPosition = `0 ${-(finalLogoIndex * LOGO_HEIGHT)}px`;

    // Resolver cuando termine la animación
    setTimeout(() => {
      resolve();
    }, SPIN_DURATION);
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
 * Update Magic Button State
 */
function updateMagicButtonState() {
  if (gameState.nextWinForced) {
    magicButton.classList.add("active");
  } else {
    magicButton.classList.remove("active");
  }
}

/**
 * Event Listeners
 */
spinButton.addEventListener("click", spinReels);

magicButton.addEventListener("click", () => {
  if (!gameState.spinning) {
    gameState.nextWinForced = true;
    updateMagicButtonState();
  }
});

/**
 * Initialize
 */
initializeReels();
updateCounterDisplay();
