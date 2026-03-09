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
// const ICON_WIDTH = 200;
const ICON_HEIGHT = 200;
const NUM_ICONS = 25;
const TIME_PER_ICON = 50;
const REEL_OFFSET_DELAY = 150;
const ANIMATION_BASE_ROUNDS = 8;
const SLOT_MACHINE_VOLUME = 0.1;
const CONFETTI_SOUND_VOLUME = 0.6;
const WIN_CLASS_DURATION = 3000;
const WIN_MESSAGE_DURATION = 5000;

/**
 * State
 */
const indexes = [0, 0, 0];
let spinCount = 0;
let winModeActive = false;

/**
 * DOM Elements
 */
const $acumulado = document.getElementById("acumulado");
const spinButton = document.getElementById("spinButton");
const secretWinButton = document.getElementById("secretWinButton");

/**
 * Audio
 */
const slotMachineSound = new Audio("/apps/ms/slot-machine/slot-machine.mp3");
slotMachineSound.volume = SLOT_MACHINE_VOLUME;

/**
 * Calculate random delta for reel animation
 */
const calculateReelDelta = (offset, targetIndex = null) => {
  if (winModeActive && targetIndex !== null) {
    // En modo ganador, calcular delta para llegar al índice ganador
    const currentIndex = indexes[offset];
    const delta = (targetIndex - currentIndex + NUM_ICONS) % NUM_ICONS;
    return (offset + 2) * NUM_ICONS + delta;
  }
  return (offset + 2) * NUM_ICONS + Math.round(Math.random() * NUM_ICONS);
};

/**
 * Calculate animation duration
 */
const calculateAnimationDuration = (delta) => {
  return (ANIMATION_BASE_ROUNDS + 1 * delta) * TIME_PER_ICON;
};

/**
 * Get current background position from reel
 */
const getBackgroundPositionY = (reel) => {
  const style = getComputedStyle(reel);
  return parseFloat(style["background-position-y"]);
};

/**
 * Animate reel to target position
 */
const animateReel = (reel, delta, currentPosition, offset) => {
  // Cambiar dirección: restar en lugar de sumar para contar desde arriba
  const targetPosition = currentPosition - delta * ICON_HEIGHT;
  const animationDuration = calculateAnimationDuration(delta);

  setTimeout(() => {
    reel.style.transition = `background-position-y ${animationDuration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    reel.style.backgroundPositionY = `${targetPosition}px`;
  }, offset * REEL_OFFSET_DELAY);

  return { targetPosition, animationDuration };
};

/**
 * Reset reel position after animation
 */
const resetReelPosition = (reel, targetPosition) => {
  const totalHeight = NUM_ICONS * ICON_HEIGHT;
  const normalizedPosition = -((Math.abs(targetPosition) % totalHeight) || 0);
  reel.style.transition = "none";
  reel.style.backgroundPositionY = `${normalizedPosition}px`;
};

/**
 * Roll one reel
 */
const roll = (reel, offset = 0, targetIndex = null) => {
  const delta = calculateReelDelta(offset, targetIndex);
  const currentPosition = getBackgroundPositionY(reel);

  return new Promise((resolve) => {
    const { targetPosition, animationDuration } = animateReel(
      reel,
      delta,
      currentPosition,
      offset
    );

    setTimeout(() => {
      resetReelPosition(reel, targetPosition);
      resolve(delta % NUM_ICONS);
    }, animationDuration + offset * REEL_OFFSET_DELAY);
  });
};

/**
 * Play sound effect
 */
const playSound = (audioPath, volume) => {
  const audio = new Audio(audioPath);
  audio.volume = volume;
  audio.play();
  return audio;
};

/**
 * Play slot machine sound
 */
const playSlotMachineSound = () => {
  slotMachineSound.currentTime = 0;
  slotMachineSound.volume = SLOT_MACHINE_VOLUME;
  slotMachineSound.play();
};

/**
 * Stop slot machine sound
 */
const stopSlotMachineSound = () => {
  slotMachineSound.pause();
};

/**
 * Launch confetti animation
 */
const launchConfetti = (config) => {
  playSound("/apps/ms/slot-machine/confetti-gun.mp3", CONFETTI_SOUND_VOLUME);
  confetti(config);
};

/**
 * Trigger all confetti animations
 */
const triggerConfettiCelebration = () => {
  launchConfetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });

  setTimeout(() => {
    launchConfetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
    });
  }, 250);

  setTimeout(() => {
    launchConfetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
    });
  }, 400);
};

/**
 * Add win class to slots
 */
const addWinClass = () => {
  const slotsElement = document.querySelector(".slots");
  slotsElement.classList.add("win2");
  setTimeout(() => {
    slotsElement.classList.remove("win2");
  }, WIN_CLASS_DURATION);
};

/**
 * Update attempt counter display
 */
const updateAttemptCounter = (count) => {
  $acumulado.textContent = `Intentos: ${count}`;
};

/**
 * Show victory message
 */
const showVictoryMessage = (attempts) => {
  $acumulado.textContent = `🎉 ¡GANASTE en ${attempts} intentos! 🎉`;

  setTimeout(() => {
    updateAttemptCounter(0);
  }, WIN_MESSAGE_DURATION);
};

/**
 * Check if all reels match target icon
 */
const checkWinCondition = () => {
  const winningIcon = ICON_MAP[0];
  return indexes.every((i) => ICON_MAP[i] === winningIcon);
};

/**
 * Reset all reels to initial position
 */
const resetReels = () => {
  const reelsList = document.querySelectorAll(".slots > .reel");
  reelsList.forEach((reel) => {
    reel.style.transition = "none";
    reel.style.backgroundPositionY = "0px";
  });
  indexes.fill(0);
};

/**
 * Handle win scenario
 */
const handleWin = () => {
  addWinClass();
  triggerConfettiCelebration();
  showVictoryMessage(spinCount);
  spinCount = 0;
  resetReels();
};

/**
 * Handle loss scenario
 */
const handleLoss = () => {
  updateAttemptCounter(spinCount);
};

/**
 * Update reel indexes after spin
 */
const updateIndexes = (deltas) => {
  deltas.forEach((delta, i) => {
    indexes[i] = (indexes[i] + delta) % NUM_ICONS;
  });
};

/**
 * Toggle spin button state
 */
const toggleSpinButton = (disabled) => {
  spinButton.disabled = disabled;
  if (secretWinButton) {
    secretWinButton.disabled = disabled;
  }
};

/**
 * Find winning index based on the first icon in the strip
 */
const findWinningIndex = () => {
  const winningIcon = ICON_MAP[0];
  return ICON_MAP.findIndex((icon) => icon === winningIcon);
};

/**
 * Roll all reels
 */
function rollAll() {
  toggleSpinButton(true);
  playSlotMachineSound();

  const reelsList = document.querySelectorAll(".slots > .reel");
  const winningIndex = winModeActive ? findWinningIndex() : null;

  Promise.all([...reelsList].map((reel, i) => roll(reel, i, winningIndex))).then((deltas) => {
    updateIndexes(deltas);
    spinCount++;
    stopSlotMachineSound();

    if (checkWinCondition()) {
      handleWin();
      winModeActive = false; // Desactivar modo ganador después de ganar
    } else {
      handleLoss();
    }

    toggleSpinButton(false);
  });
}

// Configurar eventos al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  
  // Mantener funcionalidad original del botón
  spinButton.addEventListener("click", () => {
    if (spinCount === 0) {
      updateAttemptCounter(spinCount);
    }
    rollAll();
  });

  // Botón invisible para giro ganador inmediato
  if (secretWinButton) {
    secretWinButton.addEventListener("click", () => {
      if (spinButton.disabled) {
        return;
      }
      winModeActive = true;
      if (spinCount === 0) {
        updateAttemptCounter(spinCount);
      }
      rollAll();
    });
  }
});
