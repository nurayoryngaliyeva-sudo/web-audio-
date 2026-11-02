
// Initialize Lucide Icons
lucide.createIcons();

/* ==========================================================================
    1. CANVAS BACKGROUND PARTICLE SYSTEM
    ========================================================================== */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
let particleColor = '#00f3ff';
let isMatrixMode = false;
let matrixChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ010101';
let matrixColumns = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initMatrix();
}

function initMatrix() {
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    matrixColumns = Array(columns).fill(0);
}

class Particle {
    constructor() {
    this.reset();
    }

    reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.8;
    this.vy = (Math.random() - 0.5) * 0.8;
    this.radius = Math.random() * 2 + 1;
    this.alpha = Math.random() * 0.5 + 0.2;
    }

    update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }

    draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = particleColor;
    ctx.globalAlpha = this.alpha;
    ctx.fill();
    }
}

function createParticleSystem() {
    particles = [];
    const count = Math.min(Math.floor(window.innerWidth / 12), 120);
    for (let i = 0; i < count; i++) {
    particles.push(new Particle());
    }
    document.getElementById('particle-count-text').innerText = `${count} UNITS`;
}

function animateCanvas() {
    if (isMatrixMode) {
    // Draw Matrix Digital Rain Effect
    ctx.fillStyle = 'rgba(8, 9, 13, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = particleColor;
    ctx.font = '14px monospace';

    matrixColumns.forEach((y, index) => {
        const char = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
        const x = index * 14;
        ctx.fillText(char, x, y);

        if (y > canvas.height + Math.random() * 10000) {
        matrixColumns[index] = 0;
        } else {
        matrixColumns[index] = y + 14;
        }
    });
    } else {
    // Draw Interactive Particle Constellation Grid
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = particleColor;
            ctx.globalAlpha = (1 - dist / 110) * 0.25;
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }
        }
    }
    }
    requestAnimationFrame(animateCanvas);
}

window.addEventListener('resize', () => {
    resizeCanvas();
    createParticleSystem();
});

resizeCanvas();
createParticleSystem();
animateCanvas();


/* ==========================================================================
    2. WEB AUDIO API SYNTHESIZER & VISUALIZER ENGINE
    ========================================================================== */
let audioCtx = null;
let masterGain = null;
let filterNode = null;
let delayNode = null;
let delayGain = null;
let analyser = null;

const audioStatusText = document.getElementById('audio-status-text');
const waveSelect = document.getElementById('wave-select');
const cutoffSlider = document.getElementById('cutoff-slider');
const cutoffVal = document.getElementById('cutoff-val');
const delaySlider = document.getElementById('delay-slider');
const delayVal = document.getElementById('delay-val');
const visCanvas = document.getElementById('visualizer-canvas');
const visCtx = visCanvas.getContext('2d');
const visPlaceholder = document.getElementById('vis-placeholder');

function initAudio() {
    if (audioCtx) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();

    // Master Gain
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;

    // Filter Node
    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = parseFloat(cutoffSlider.value);

    // Delay Node Effect
    delayNode = audioCtx.createDelay();
    delayNode.delayTime.value = 0.25;

    delayGain = audioCtx.createGain();
    delayGain.gain.value = parseFloat(delaySlider.value) / 100;

    // Analyser Node for Visualizer
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    // Audio Routing Graph: Synth -> Filter -> Master -> Delay Feedback -> Destination & Analyser
    filterNode.connect(masterGain);

    masterGain.connect(audioCtx.destination);
    masterGain.connect(analyser);

    // Connect Delay loop
    masterGain.connect(delayNode);
    delayNode.connect(delayGain);
    delayGain.connect(audioCtx.destination);
    delayGain.connect(delayNode);

    audioStatusText.innerText = "AUDIO: ONLINE";
    audioStatusText.classList.add('text-glow');
    showToast('Web Audio Engine online!');

    drawVisualizer();
}

// Toggle Audio on Button Click
document.getElementById('audio-toggle-btn').addEventListener('click', () => {
    if (!audioCtx) {
    initAudio();
    } else if (audioCtx.state === 'suspended') {
    audioCtx.resume();
    audioStatusText.innerText = "AUDIO: ONLINE";
    showToast('Audio Context resumed');
    } else {
    audioCtx.suspend();
    audioStatusText.innerText = "AUDIO: PAUSED";
    showToast('Audio Context paused');
    }
});

// Control Sliders
cutoffSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    cutoffVal.innerText = `${val}Hz`;
    if (filterNode) filterNode.frequency.value = val;
});

delaySlider.addEventListener('input', (e) => {
    const val = e.target.value;
    delayVal.innerText = `${val}%`;
    if (delayGain) delayGain.gain.value = val / 100;
});

// Play Synth Note Function
function playNote(freq, duration = 0.4) {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const noteGain = audioCtx.createGain();

    osc.type = waveSelect.value;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Envelope ADSR
    const now = audioCtx.currentTime;
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(0.4, now + 0.03);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(noteGain);
    noteGain.connect(filterNode);

    osc.start(now);
    osc.stop(now + duration);

    // Diagnostics UI readout update
    document.getElementById('freq-readout').innerText = `${freq.toFixed(2)} Hz`;
    document.getElementById('freq-bar').style.width = `${Math.min((freq / 800) * 100, 100)}%`;

    if (visPlaceholder) visPlaceholder.style.display = 'none';
}

// Interactive Key Bindings and Click Triggers
const noteFrequencies = {
    'C3': 130.81, 'E3': 164.81, 'G3': 196.00, 'B3': 246.94
};

// Pad Buttons Event Setup
document.querySelectorAll('.synth-pad').forEach(pad => {
    const note = pad.getAttribute('data-note');
    pad.addEventListener('mousedown', () => {
    playNote(noteFrequencies[note], 0.6);
    pad.classList.add('border-glow');
    setTimeout(() => pad.classList.remove('border-glow'), 200);
    });
});

// Keyboard Buttons Event Setup
document.querySelectorAll('.key-btn').forEach(btn => {
    const freq = parseFloat(btn.getAttribute('data-freq'));
    btn.addEventListener('mousedown', () => {
    playNote(freq, 0.4);
    btn.classList.add('border-glow');
    setTimeout(() => btn.classList.remove('border-glow'), 200);
    });
});

// Keyboard Hotkeys listener (1-7 and Q,W,E,R)
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return; // Ignore if typing in CLI prompt
    
    const key = e.key.toUpperCase();

    // Synth Keys
    const keyBtn = document.querySelector(`.key-btn[data-key="${key}"]`);
    if (keyBtn) {
    const freq = parseFloat(keyBtn.getAttribute('data-freq'));
    playNote(freq, 0.4);
    keyBtn.classList.add('border-glow');
    setTimeout(() => keyBtn.classList.remove('border-glow'), 200);
    }

    // Synth Pads
    const padBtn = document.querySelector(`.synth-pad[data-key="${key}"]`);
    if (padBtn) {
    const note = padBtn.getAttribute('data-note');
    playNote(noteFrequencies[note], 0.6);
    padBtn.classList.add('border-glow');
    setTimeout(() => padBtn.classList.remove('border-glow'), 200);
    }
});

// Real-Time Waveform Oscilloscope Drawing
function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    visCanvas.width = visCanvas.offsetWidth;
    visCanvas.height = visCanvas.offsetHeight;

    visCtx.clearRect(0, 0, visCanvas.width, visCanvas.height);
    visCtx.lineWidth = 2;
    visCtx.strokeStyle = particleColor;
    visCtx.beginPath();

    const sliceWidth = visCanvas.width * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = v * (visCanvas.height / 2);

    if (i === 0) {
        visCtx.moveTo(x, y);
    } else {
        visCtx.lineTo(x, y);
    }

    x += sliceWidth;
    }

    visCtx.lineTo(visCanvas.width, visCanvas.height / 2);
    visCtx.stroke();
}


/* ==========================================================================
    3. INTERACTIVE TERMINAL EMULATOR (CLI)
    ========================================================================== */
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');

const commands = {
    'help': 'Available commands: [help, status, matrix, clear, color, audio, ping]',
    'status': 'System: ONLINE | Node: CYBER-LAB-V2 | Memory: OPTIMAL | Theme: Dynamic',
    'matrix': 'Toggle Digital Rain Matrix mode on canvas.',
    'clear': 'Clear terminal buffer log.',
    'color': 'Change neon color palette: color [cyan|magenta|yellow|emerald]',
    'audio': 'Trigger audio context initialization test sound.',
    'ping': 'PONG! Latency: 12ms'
};

function appendTerminalLog(text, isInput = false, isError = false) {
    const line = document.createElement('div');
    if (isInput) {
    line.className = 'text-white font-bold';
    line.innerText = `> ${text}`;
    } else if (isError) {
    line.className = 'text-red-400 font-mono';
    line.innerText = text;
    } else {
    line.className = 'text-slate-300 font-mono';
    line.innerText = text;
    }
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
    const rawInput = terminalInput.value.trim();
    if (!rawInput) return;

    appendTerminalLog(rawInput, true);
    terminalInput.value = '';

    const parts = rawInput.toLowerCase().split(' ');
    const cmd = parts[0];
    const arg = parts[1];

    switch (cmd) {
        case 'help':
        appendTerminalLog(commands['help']);
        break;
        case 'status':
        appendTerminalLog(commands['status']);
        break;
        case 'matrix':
        isMatrixMode = !isMatrixMode;
        appendTerminalLog(`Matrix Rain Mode: ${isMatrixMode ? 'ENABLED' : 'DISABLED'}`);
        showToast(`Matrix mode ${isMatrixMode ? 'ON' : 'OFF'}`);
        break;
        case 'clear':
        terminalOutput.innerHTML = '';
        break;
        case 'color':
        if (['cyan', 'magenta', 'yellow', 'emerald'].includes(arg)) {
            setTheme(arg);
            appendTerminalLog(`Theme preset switched to [${arg.toUpperCase()}]`);
        } else {
            appendTerminalLog('Invalid color option. Use: color cyan | magenta | yellow | emerald', false, true);
        }
        break;
        case 'audio':
        playNote(440, 0.5);
        appendTerminalLog('Playing 440Hz test sine tone...');
        break;
        case 'ping':
        appendTerminalLog('PONG! Response time < 1ms');
        break;
        default:
        appendTerminalLog(`Command not recognized: '${cmd}'. Type 'help' for available commands.`, false, true);
    }
    }
});


/* ==========================================================================
    4. THEME CUSTOMIZATION & UI UTILITIES
    ========================================================================== */
function setTheme(themeName) {
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${themeName}`);

    const colorMap = {
    cyan: '#00f3ff',
    magenta: '#ff0055',
    yellow: '#ffe600',
    emerald: '#00ff9d'
    };

    particleColor = colorMap[themeName] || '#00f3ff';
    showToast(`Neon palette updated: ${themeName.toUpperCase()}`);
}

// Helper Toast Notification
function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'glass-panel px-4 py-2.5 rounded-lg border border-slate-700 text-xs font-mono text-white flex items-center gap-2 shadow-xl animate-bounce';
    toast.innerHTML = `<i data-lucide="info" class="w-4 h-4 text-glow"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
    }, 2500);
}
