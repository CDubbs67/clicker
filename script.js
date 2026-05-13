// State Management
const state = {
    currentScreen: 'menu-screen',
    speedrun: {
        status: 'idle', // idle, running, stopped
        startTime: 0,
        elapsedTime: 0,
        bestTime: localStorage.getItem('speedrun_best') || null,
        animationId: null
    },
    clicker: {
        count: parseInt(localStorage.getItem('clicker_count')) || 0,
        multiplier: parseInt(localStorage.getItem('clicker_multiplier')) || 1,
        usedCodes: JSON.parse(localStorage.getItem('used_codes')) || []
    }
};

// Gift Code Data
const GIFT_CODES = {
    "12345": 5000,
    "SPEED": 1000,
    "RICH": 50000,
    "ARCADE": 10000,
    "ANTIGRAVITY": 100000,
    "INFINITY": 1000000,
    "JACKPOT": 777777,
    "MILLION": 1000000,
    "HIDDEN": 250000,
    "DANIEL": 10000000000
};

// DOM Elements
const screens = {
    menu: document.getElementById('menu-screen'),
    speedrun: document.getElementById('speedrun-screen'),
    clicker: document.getElementById('clicker-screen')
};

const timerDisplay = document.getElementById('timer-display');
const pbDisplay = document.getElementById('pb-display');
const bestTimeDisplay = document.getElementById('best-time-display');
const clickCountDisplay = document.getElementById('click-count');
const totalClicksDisplay = document.getElementById('total-clicks-display');
const multDisplay = document.getElementById('mult-display');

// Modal Elements
const codesModal = document.getElementById('codes-modal');
const codesList = document.getElementById('codes-list');
const viewCodesBtn = document.getElementById('view-codes-btn');
const closeModalBtn = document.querySelector('.close-modal');

// Initialize Displays
function initDisplays() {
    let storedBest = localStorage.getItem('speedrun_best');
    if (storedBest && parseFloat(storedBest) <= 0) {
        localStorage.removeItem('speedrun_best');
        storedBest = null;
    }
    
    state.speedrun.bestTime = storedBest;

    if (state.speedrun.bestTime) {
        const timeStr = parseFloat(state.speedrun.bestTime).toFixed(3);
        pbDisplay.textContent = timeStr;
        bestTimeDisplay.textContent = timeStr;
    } else {
        pbDisplay.textContent = "--.---";
        bestTimeDisplay.textContent = "--.---";
    }
    
    totalClicksDisplay.textContent = state.clicker.count.toLocaleString();
    clickCountDisplay.textContent = `🪙 ${state.clicker.count.toLocaleString()}`;
    if (multDisplay) multDisplay.textContent = state.clicker.multiplier;
    updateShop();
}

// Navigation
function showScreen(screenId) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenId.split('-')[0]].classList.add('active');
    state.currentScreen = screenId;

    if (screenId !== 'speedrun-screen') {
        stopTimer(false);
        state.speedrun.status = 'idle';
        state.speedrun.elapsedTime = 0;
        updateTimerDisplay(0);
    }
    
    updateShop();
}

// Speedrun Logic
function startTimer() {
    state.speedrun.status = 'running';
    state.speedrun.startTime = performance.now();
    
    function update() {
        if (state.speedrun.status !== 'running') return;
        const now = performance.now();
        state.speedrun.elapsedTime = now - state.speedrun.startTime;
        updateTimerDisplay(state.speedrun.elapsedTime);
        state.speedrun.animationId = requestAnimationFrame(update);
    }
    
    state.speedrun.animationId = requestAnimationFrame(update);
}

function stopTimer(shouldSave = true) {
    const wasRunning = state.speedrun.status === 'running';
    state.speedrun.status = 'stopped';
    cancelAnimationFrame(state.speedrun.animationId);
    
    const finalTime = state.speedrun.elapsedTime / 1000;
    
    if (shouldSave && wasRunning && state.speedrun.elapsedTime > 0) {
        updateTimerDisplay(state.speedrun.elapsedTime);
        
        if (!state.speedrun.bestTime || finalTime < parseFloat(state.speedrun.bestTime)) {
            state.speedrun.bestTime = finalTime.toString();
            localStorage.setItem('speedrun_best', state.speedrun.bestTime);
            initDisplays();
        }
    }
}

function updateTimerDisplay(ms) {
    if (timerDisplay) timerDisplay.textContent = (ms / 1000).toFixed(3);
}

// Shop Logic
function updateShop() {
    const clickerItems = document.querySelectorAll('#clicker-screen .upgrade-item');
    clickerItems.forEach(item => {
        const cost = parseInt(item.dataset.cost);
        const multValue = parseInt(item.dataset.mult);
        if (state.clicker.multiplier >= multValue) item.style.display = 'none';
        else {
            item.style.display = 'flex';
            if (state.clicker.count >= cost) item.classList.remove('disabled');
            else item.classList.add('disabled');
        }
    });
}

function buyClickerUpgrade(cost, newValue) {
    if (state.clicker.count >= cost) {
        state.clicker.count -= cost;
        state.clicker.multiplier = newValue;
        localStorage.setItem('clicker_count', state.clicker.count);
        localStorage.setItem('clicker_multiplier', state.clicker.multiplier);
        initDisplays();
    }
}

// Clicker Logic
function incrementClicker() {
    state.clicker.count += state.clicker.multiplier;
    clickCountDisplay.textContent = `🪙 ${state.clicker.count.toLocaleString()}`;
    totalClicksDisplay.textContent = state.clicker.count.toLocaleString();
    localStorage.setItem('clicker_count', state.clicker.count);
    updateShop();

    clickCountDisplay.style.transform = 'scale(1.1)';
    setTimeout(() => {
        clickCountDisplay.style.transform = 'scale(1)';
    }, 50);
}

// Gift Code Logic
function redeemCode() {
    const input = document.getElementById('gift-input');
    const code = input.value.trim();
    if (!code) return;
    if (state.clicker.usedCodes.includes(code)) {
        alert("This code has already been used!");
        return;
    }
    if (GIFT_CODES[code]) {
        const reward = GIFT_CODES[code];
        state.clicker.count += reward;
        state.clicker.usedCodes.push(code);
        localStorage.setItem('clicker_count', state.clicker.count);
        localStorage.setItem('used_codes', JSON.stringify(state.clicker.usedCodes));
        initDisplays();
        alert(`Successfully redeemed! You got 🪙 ${reward.toLocaleString()} coins.`);
        input.value = "";
    } else {
        alert("Invalid gift code!");
    }
}

// Modal Logic
function openModal() {
    codesList.innerHTML = '';
    Object.entries(GIFT_CODES).forEach(([name, reward]) => {
        const badge = document.createElement('div');
        badge.className = 'code-badge';
        badge.innerHTML = `
            <span class="code-name">${name}</span>
            <span class="code-reward">Reward: 🪙 ${reward.toLocaleString()}</span>
        `;
        codesList.appendChild(badge);
    });
    codesModal.classList.add('active');
}

function closeModal() {
    codesModal.classList.remove('active');
}

// Event Listeners
document.getElementById('btn-speedrun').addEventListener('click', () => showScreen('speedrun-screen'));
document.getElementById('btn-clicker').addEventListener('click', () => showScreen('clicker-screen'));

document.querySelectorAll('#clicker-screen .upgrade-item').forEach(item => {
    item.addEventListener('click', () => {
        const cost = parseInt(item.dataset.cost);
        const newValue = parseInt(item.dataset.mult);
        buyClickerUpgrade(cost, newValue);
    });
});

document.getElementById('redeem-btn').addEventListener('click', redeemCode);
document.getElementById('gift-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') redeemCode();
});

viewCodesBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
codesModal.addEventListener('click', (e) => {
    if (e.target === codesModal) closeModal();
});

document.getElementById('reset-all-btn').addEventListener('click', () => {
    if (confirm("Are you sure you want to reset all progress?")) {
        localStorage.clear();
        state.speedrun.bestTime = null;
        state.speedrun.elapsedTime = 0;
        state.clicker.count = 0;
        state.clicker.multiplier = 1;
        state.clicker.usedCodes = [];
        initDisplays();
        updateTimerDisplay(0);
    }
});

document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => showScreen('menu-screen'));
});

function handleAction() {
    if (state.currentScreen === 'speedrun-screen') {
        if (state.speedrun.status === 'idle' || state.speedrun.status === 'stopped') startTimer();
        else if (state.speedrun.status === 'running') stopTimer();
    } else if (state.currentScreen === 'clicker-screen') {
        incrementClicker();
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (document.activeElement.id === 'gift-input') return;
        
        // Prevent auto-clicking when holding the key
        if (e.repeat) return;

        e.preventDefault();
        handleAction();
    }
});

window.addEventListener('mousedown', (e) => {
    // Ignore if clicking a button or input or within a modal
    if (e.target.tagName === 'INPUT' || 
        e.target.closest('button') ||
        e.target.closest('.modal-content')) return;

    if (state.currentScreen === 'speedrun-screen') {
        handleAction();
    } else if (state.currentScreen === 'clicker-screen') {
        // Only trigger if clicking the miner section
        if (e.target.closest('.miner-section')) {
            handleAction();
        }
    }
});


initDisplays();
