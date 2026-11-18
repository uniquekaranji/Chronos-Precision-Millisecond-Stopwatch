/**
 * Chronos — Precision Millisecond Stopwatch
 * Project 2 (Ignite Club Week 9)
 * High-resolution timing with performance.now() & requestAnimationFrame
 */

const MAIN_CIRCUMFERENCE = 2 * Math.PI * 122; // 766.55
const LAP_CIRCUMFERENCE = 2 * Math.PI * 108;  // 678.58

const state = {
  running: false,
  startTime: 0,
  accumulatedMs: 0,
  lastLapTotalMs: 0,
  laps: [], // [{ id, splitMs, totalMs }]
  rafId: null,
  audioEnabled: true,
  darkMode: true,
};

let audioCtx = null;

// Tactile Synthesized Web Audio Clicks
function playClickTone(freq = 880, durationMs = 28) {
  if (!state.audioEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + durationMs / 1000);
  } catch (e) {
    // Ignore audio errors on restricted devices
  }
}

function showToast(msg) {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(6px)';
    setTimeout(() => t.remove(), 250);
  }, 2400);
}

// Time Formatting Helpers (Millisecond Precision)
function splitTimeParts(ms) {
  const clamped = Math.max(0, ms);
  const totalMs = Math.floor(clamped);
  const millis = totalMs % 1000;
  const totalSeconds = Math.floor(totalMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const pad2 = (n) => String(n).padStart(2, '0');
  const pad3 = (n) => String(n).padStart(3, '0');

  const main = hours > 0
    ? `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`
    : `${pad2(minutes)}:${pad2(seconds)}`;
  const msPart = `.${pad3(millis)}`;
  return { main, msPart, full: `${main}${msPart}` };
}

function formatDeltaMs(deltaMs) {
  const sign = deltaMs >= 0 ? '+' : '-';
  const abs = Math.abs(Math.round(deltaMs));
  const secs = (abs / 1000).toFixed(3);
  return `${sign}${secs}s`;
}

function getElapsedMs() {
  return state.running
    ? state.accumulatedMs + (performance.now() - state.startTime)
    : state.accumulatedMs;
}

// Update Dial & Readout
function renderDial() {
  const elapsed = getElapsedMs();
  const currentSplit = Math.max(0, elapsed - state.lastLapTotalMs);

  const mainFormatted = splitTimeParts(elapsed);
  const splitFormatted = splitTimeParts(currentSplit);

  document.getElementById('mainTimeMain').textContent = mainFormatted.main;
  document.getElementById('mainTimeMs').textContent = mainFormatted.msPart;
  document.getElementById('currentSplitTime').textContent = splitFormatted.full;
  document.getElementById('lapBadgeNumber').textContent = `LAP ${String(state.laps.length + 1).padStart(2, '0')}`;

  // Update 60-second SVG progress rings
  const mainProgress = (elapsed % 60000) / 60000;
  const splitProgress = (currentSplit % 60000) / 60000;

  document.getElementById('mainRing').style.strokeDashoffset = (MAIN_CIRCUMFERENCE * (1 - mainProgress)).toFixed(2);
  document.getElementById('lapRing').style.strokeDashoffset = (LAP_CIRCUMFERENCE * (1 - splitProgress)).toFixed(2);
}

function animationLoop() {
  if (!state.running) return;
  renderDial();
  state.rafId = requestAnimationFrame(animationLoop);
}

// Update Control Buttons & Status Pill
function renderControls() {
  const hasHistory = state.accumulatedMs > 0 || state.running;
  const startPauseBtn = document.getElementById('startPauseBtn');
  const startPauseLabel = document.getElementById('startPauseLabel');
  const playSvg = document.getElementById('playSvg');
  const pauseSvg = document.getElementById('pauseSvg');
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');

  startPauseBtn.classList.remove('running-state', 'paused-state');

  if (state.running) {
    startPauseBtn.classList.add('running-state');
    startPauseLabel.textContent = 'Pause';
    playSvg.classList.add('hidden');
    pauseSvg.classList.remove('hidden');
    statusBadge.className = 'status-badge running';
    statusText.textContent = 'Running';
  } else if (hasHistory) {
    startPauseBtn.classList.add('paused-state');
    startPauseLabel.textContent = 'Resume';
    playSvg.classList.remove('hidden');
    pauseSvg.classList.add('hidden');
    statusBadge.className = 'status-badge paused';
    statusText.textContent = 'Paused';
  } else {
    startPauseLabel.textContent = 'Start';
    playSvg.classList.remove('hidden');
    pauseSvg.classList.add('hidden');
    statusBadge.className = 'status-badge ready';
    statusText.textContent = 'Standby';
  }

  document.getElementById('lapBtn').disabled = !state.running;
  document.getElementById('resetBtn').disabled = !hasHistory && state.laps.length === 0;
  document.getElementById('copyLapsBtn').disabled = state.laps.length === 0;
  document.getElementById('exportCsvBtn').disabled = state.laps.length === 0;
}

// Render Lap Splits & Analytics
function renderLaps() {
  const laps = state.laps;
  const body = document.getElementById('lapListBody');
  const totalEl = document.getElementById('statTotalLaps');
  const fastestEl = document.getElementById('statFastestLap');
  const slowestEl = document.getElementById('statSlowestLap');
  const avgEl = document.getElementById('statAverageLap');
  const subtitle = document.getElementById('lapSubtitle');

  totalEl.textContent = String(laps.length);

  if (laps.length === 0) {
    fastestEl.textContent = '--:--.---';
    slowestEl.textContent = '--:--.---';
    avgEl.textContent = '--:--.---';
    subtitle.textContent = 'Record laps to analyze split consistency';
    body.innerHTML = `
      <div class="empty-laps">
        <div class="empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M10 2h4" />
          </svg>
        </div>
        <p class="empty-title">No Lap Splits Recorded</p>
        <p class="empty-desc">Start the stopwatch and press <strong>Lap</strong> (or hit <kbd>L</kbd>) to log millisecond splits.</p>
      </div>
    `;
    return;
  }

  const splits = laps.map((l) => l.splitMs);
  const minSplit = Math.min(...splits);
  const maxSplit = Math.max(...splits);
  const avgSplit = splits.reduce((sum, v) => sum + v, 0) / splits.length;

  fastestEl.textContent = splitTimeParts(minSplit).full;
  slowestEl.textContent = splitTimeParts(maxSplit).full;
  avgEl.textContent = splitTimeParts(avgSplit).full;
  subtitle.textContent = `${laps.length} ${laps.length === 1 ? 'split' : 'splits'} logged · Spread: ${((maxSplit - minSplit) / 1000).toFixed(3)}s`;

  body.innerHTML = '';
  laps.forEach((lap) => {
    const isBest = laps.length >= 2 && lap.splitMs === minSplit;
    const isWorst = laps.length >= 2 && lap.splitMs === maxSplit && maxSplit !== minSplit;
    const delta = lap.splitMs - avgSplit;

    let badgeHtml = '';
    if (isBest) badgeHtml = '<span class="lap-tag best">Fastest</span>';
    else if (isWorst) badgeHtml = '<span class="lap-tag worst">Slowest</span>';

    const deltaClass = Math.abs(delta) < 5 ? 'delta-neutral' : delta < 0 ? 'delta-neg' : 'delta-pos';

    const row = document.createElement('div');
    row.className = 'lap-row';
    row.innerHTML = `
      <div class="lap-id-cell">
        <span>#${String(lap.id).padStart(2, '0')}</span>
        ${badgeHtml}
      </div>
      <span>${splitTimeParts(lap.splitMs).full}</span>
      <span class="${deltaClass}">${formatDeltaMs(delta)}</span>
      <span class="text-right">${splitTimeParts(lap.totalMs).full}</span>
    `;
    body.appendChild(row);
  });
}

// Actions
function handleStartPause() {
  if (state.running) {
    state.accumulatedMs += performance.now() - state.startTime;
    state.running = false;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    playClickTone(520, 35);
  } else {
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.startTime = performance.now();
    state.running = true;
    state.rafId = requestAnimationFrame(animationLoop);
    playClickTone(920, 35);
  }
  renderDial();
  renderControls();
}

function handleLap() {
  if (!state.running) return;
  const totalMs = getElapsedMs();
  const splitMs = Math.max(0, totalMs - state.lastLapTotalMs);
  state.lastLapTotalMs = totalMs;

  state.laps.unshift({
    id: state.laps.length + 1,
    splitMs,
    totalMs,
  });

  playClickTone(1180, 25);
  renderLaps();
  renderDial();
  renderControls();
}

function handleReset() {
  state.running = false;
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }
  state.startTime = 0;
  state.accumulatedMs = 0;
  state.lastLapTotalMs = 0;
  state.laps = [];

  playClickTone(380, 45);
  renderLaps();
  renderDial();
  renderControls();
}

function handleCopyLaps() {
  if (state.laps.length === 0) return;
  const ordered = [...state.laps].reverse();
  const lines = [
    'Lap\tSplit Time\tTotal Elapsed',
    ...ordered.map((l) => `Lap ${l.id}\t${splitTimeParts(l.splitMs).full}\t${splitTimeParts(l.totalMs).full}`),
  ];
  const text = lines.join('\n');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => showToast('Lap telemetry copied to clipboard!'),
      () => fallbackCopy(text)
    );
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('Lap telemetry copied to clipboard!');
  } catch (e) {
    showToast('Could not copy to clipboard.');
  }
  ta.remove();
}

function handleExportCsv() {
  if (state.laps.length === 0) return;
  const ordered = [...state.laps].reverse();
  const csvRows = [
    'Lap Number,Split Time,Split (ms),Total Elapsed,Total (ms)',
    ...ordered.map((l) => `${l.id},${splitTimeParts(l.splitMs).full},${Math.round(l.splitMs)},${splitTimeParts(l.totalMs).full},${Math.round(l.totalMs)}`),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chronos-laps-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Exported lap splits as CSV.');
}

function toggleSound() {
  state.audioEnabled = !state.audioEnabled;
  const btn = document.getElementById('soundToggleBtn');
  btn.setAttribute('aria-pressed', String(state.audioEnabled));
  document.getElementById('soundOnIcon').classList.toggle('hidden', !state.audioEnabled);
  document.getElementById('soundOffIcon').classList.toggle('hidden', state.audioEnabled);
  document.getElementById('soundLabel').textContent = state.audioEnabled ? 'Audio On' : 'Muted';
  if (state.audioEnabled) playClickTone(880, 25);
}

function toggleTheme() {
  state.darkMode = !state.darkMode;
  document.body.classList.toggle('light-mode', !state.darkMode);
  document.getElementById('themeLabel').textContent = state.darkMode ? 'Light Mode' : 'Dark Mode';
}

// Event Listeners
document.getElementById('startPauseBtn').addEventListener('click', handleStartPause);
document.getElementById('lapBtn').addEventListener('click', handleLap);
document.getElementById('resetBtn').addEventListener('click', handleReset);
document.getElementById('copyLapsBtn').addEventListener('click', handleCopyLaps);
document.getElementById('exportCsvBtn').addEventListener('click', handleExportCsv);
document.getElementById('soundToggleBtn').addEventListener('click', toggleSound);
document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

document.addEventListener('keydown', (e) => {
  const tag = document.activeElement ? document.activeElement.tagName : '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  if (e.code === 'Space') {
    e.preventDefault();
    handleStartPause();
  } else if (e.key === 'l' || e.key === 'L') {
    e.preventDefault();
    handleLap();
  } else if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    handleReset();
  } else if (e.key === 'm' || e.key === 'M') {
    e.preventDefault();
    toggleSound();
  }
});

// Initialize
renderDial();
renderControls();
renderLaps();
