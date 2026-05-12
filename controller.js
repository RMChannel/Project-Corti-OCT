const PRESENTATION_PRESETS = [
  { team: 'Alessandro e gli ingiocabili', title: 'Alla ricerca di me' },
  { team: 'BRIGHT-S', title: 'World War Word' },
  { team: 'CESARE SOLA', title: 'La guerra delle palle' },
  { team: 'CS RICREDE', title: 'La Frequenza Del Potere' },
  { team: 'DE PAOLIS', title: 'Aprirsi' },
  { team: 'Elite', title: "Le due facce dell'élite" },
  { team: 'FAST AND CURIOUS', title: 'FUORI TEMPO' },
  { team: 'FULLGAS', title: 'FRENESIA' },
  { team: 'Gli Apostoli', title: 'A day in the Life' },
  { team: 'Gli Argonauti Ribelli', title: 'Tutto andrà bene' },
  { team: 'I BATUSSI', title: 'HIC ET NUNC (Qui e ora)' },
  { team: 'I CERVELLONI', title: "Boys don't cry" },
  { team: 'I MALATICCI', title: 'Vengo dalla Luna' },
  { team: 'I MATEMATICI', title: 'THE LOOP' },
  { team: 'I Patrizi', title: 'JEREMY' },
  { team: 'I PensAtleti', title: 'Io so’ Io' },
  { team: 'I RAMI DEL PORCOSPINO', title: 'Ma… era un tutto un sogno' },
  { team: 'I TALENTI DEL BRAMBILLA', title: 'Distrattore di masse' },
  { team: 'Ingegni in Movimento', title: 'Il gorilla' },
  { team: 'INNOMINATI', title: 'Mille papaveri rossi' },
  { team: 'INVICTI CAPECE', title: 'Ἐλευθέρια' },
  { team: 'Le armate di Cavagnero', title: 'Il pescatore' },
  { team: 'Lumina', title: "All'improvviso" },
  { team: 'Mindscape', title: 'musica a colori, silenzio in bianco e nero' },
  { team: 'Minerva', title: 'Musica, Parole per l’anima' },
  { team: 'MONTALBANO', title: 'Poter Scegliere' },
  { team: 'NODO LOGICO', title: 'ANCORA QUI, MA DIVERSI.' },
  { team: 'PC3', title: '9:00AM' },
  { team: 'Ponny BoyZ', title: 'Lo zar del Vercelli' },
  { team: 'SCAPIGLIATI', title: 'L’amicizia è silenzio che capisce' },
  { team: 'SEI PERSONAGGI IN CERCA', title: 'LA LIBERTÀ È SCEGLIERE DI ESSERCI' },
  { team: 'SIUM', title: 'Ladri di cassette' },
  { team: 'V B INT', title: 'Notte prima degli esami' }
];

const ALL_PRESETS = PRESENTATION_PRESETS.map((preset, id) => ({ ...preset, id }));

const titleInput = document.getElementById('titleInput');
const descriptionInput = document.getElementById('descriptionInput');
const presetSelect = document.getElementById('presetSelect');
const showTextBtn = document.getElementById('showTextBtn');
const refreshVideosBtn = document.getElementById('refreshVideosBtn');
const folderLabel = document.getElementById('folderLabel');
const videoSelect = document.getElementById('videoSelect');
const loadVideoBtn = document.getElementById('loadVideoBtn');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const videoTimeline = document.getElementById('videoTimeline');
const currentTimeDisplay = document.getElementById('currentTimeDisplay');
const durationDisplay = document.getElementById('durationDisplay');
const blackoutBtn = document.getElementById('blackoutBtn');
const presenterStatus = document.getElementById('presenterStatus');
const restoreExcludedBtn = document.getElementById('restoreExcludedBtn');
const excludedCount = document.getElementById('excludedCount');
const excludedList = document.getElementById('excludedList');
const excludedJson = document.getElementById('excludedJson');

const previewStage = document.getElementById('previewStage');
const previewTextSlide = document.getElementById('previewTextSlide');
const previewTitle = document.getElementById('previewTitle');
const previewDescription = document.getElementById('previewDescription');
const previewVideoEl = document.getElementById('previewVideoEl');

let allVideos = [];
let availableVideos = [];
let availablePresets = [...ALL_PRESETS];
let excludedItems = [];
let excludedStatePath = '';
let isScrubbing = false;
let lastVideoSrc = null;

function updatePreview(state) {
  previewStage.className = `preview-stage mode-${state?.mode || 'idle'}`;
  
  if (state?.mode === 'text') {
    previewTextSlide.classList.remove('hidden');
    previewVideoEl.classList.add('hidden');
    previewVideoEl.pause();
    
    previewTitle.textContent = state.title || '';
    previewDescription.textContent = state.description || '';
  } else if (state?.mode === 'video-paused' || state?.mode === 'video-playing') {
    previewTextSlide.classList.add('hidden');
    previewVideoEl.classList.remove('hidden');
    
    if (state.src && state.src !== lastVideoSrc) {
      previewVideoEl.src = state.src;
      lastVideoSrc = state.src;
    }
    
    if (state?.mode === 'video-paused') {
      previewVideoEl.pause();
    } else if (state?.mode === 'video-playing') {
      previewVideoEl.play().catch(() => console.log('Autoplay prevented on preview'));
    }
  } else {
    previewTextSlide.classList.add('hidden');
    previewVideoEl.classList.add('hidden');
    previewVideoEl.pause();
  }
}

function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function normalizeText(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return [];
  }

  return normalized.split(' ').filter(Boolean);
}

function getSelectedPreset() {
  if (presetSelect.value === '') {
    return null;
  }

  const index = Number.parseInt(presetSelect.value, 10);
  if (Number.isNaN(index) || !availablePresets[index]) {
    return null;
  }

  return availablePresets[index];
}

function getSelectedVideo() {
  if (videoSelect.value === '') {
    return null;
  }

  const index = Number.parseInt(videoSelect.value, 10);
  if (Number.isNaN(index) || !availableVideos[index]) {
    return null;
  }

  return availableVideos[index];
}

function applyPreset(preset) {
  if (!preset) {
    return;
  }

  titleInput.value = preset.title;
  descriptionInput.value = preset.team;
}

function scoreVideoAgainstPreset(video, preset) {
  const videoText = normalizeText(`${video.name || ''} ${video.relativePath || ''}`);
  const titleText = normalizeText(preset.title);
  const teamText = normalizeText(preset.team);

  let score = 0;

  if (videoText.includes(titleText)) {
    score += 1000;
  }

  if (videoText.includes(teamText)) {
    score += 700;
  }

  const videoTokens = new Set(tokenize(videoText));

  for (const token of tokenize(titleText)) {
    if (videoTokens.has(token)) {
      score += 50;
    }
  }

  for (const token of tokenize(teamText)) {
    if (videoTokens.has(token)) {
      score += 35;
    }
  }

  return score;
}

function selectBestVideoByPreset(preset) {
  if (!preset || availableVideos.length === 0) {
    return false;
  }

  let bestIndex = -1;
  let bestScore = -1;

  availableVideos.forEach((video, index) => {
    const score = scoreVideoAgainstPreset(video, preset);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  if (bestIndex >= 0 && bestScore > 0) {
    videoSelect.value = String(bestIndex);
    return true;
  }
  
  videoSelect.value = '';
  return false;
}

function selectPresetByVideo(video) {
  if (!video || availablePresets.length === 0) {
    return;
  }

  const videoName = normalizeText(video.name || video.relativePath);

  let matchedIndex = availablePresets.findIndex((preset) => {
    const normalizedTitle = normalizeText(preset.title);
    const normalizedTeam = normalizeText(preset.team);
    return videoName.includes(normalizedTitle) || videoName.includes(normalizedTeam);
  });

  if (matchedIndex === -1) {
    let bestIndex = -1;
    let bestScore = -1;

    availablePresets.forEach((preset, index) => {
      const score = scoreVideoAgainstPreset(video, preset);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    if (bestScore > 0) {
      matchedIndex = bestIndex;
    }
  }

  if (matchedIndex === -1) {
    return;
  }

  presetSelect.value = String(matchedIndex);
  applyPreset(availablePresets[matchedIndex]);
}

function renderPresetSelect() {
  presetSelect.innerHTML = '';

  const manualOption = document.createElement('option');
  manualOption.value = '';
  manualOption.textContent = 'Selezione manuale';
  presetSelect.append(manualOption);

  availablePresets.forEach((preset, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${preset.team} -> ${preset.title}`;
    presetSelect.append(option);
  });
}

function renderVideoSelect() {
  videoSelect.innerHTML = '';

  if (availableVideos.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Nessun video disponibile';
    videoSelect.append(option);
    return;
  }

  availableVideos.forEach((video, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = video.relativePath;
    videoSelect.append(option);
  });
}

function renderExcludedArea() {
  excludedList.innerHTML = '';

  if (excludedItems.length === 0) {
    excludedCount.textContent = excludedStatePath
      ? `Nessun elemento escluso (file: ${excludedStatePath})`
      : 'Nessun elemento escluso';
    excludedJson.textContent = '[]';
    restoreExcludedBtn.disabled = true;
    return;
  }

  excludedCount.textContent = excludedStatePath
    ? `${excludedItems.length} elementi esclusi (file: ${excludedStatePath})`
    : `${excludedItems.length} elementi esclusi`;
  restoreExcludedBtn.disabled = false;

  excludedItems.forEach((item, index) => {
    const row = document.createElement('li');
    row.className = 'excluded-item';

    const text = document.createElement('span');
    text.className = 'excluded-text';
    text.textContent = `${item.team} -> ${item.title} [${item.videoName}]`;

    const restoreBtn = document.createElement('button');
    restoreBtn.type = 'button';
    restoreBtn.className = 'btn btn-small';
    restoreBtn.dataset.excludedIndex = String(index);
    restoreBtn.textContent = 'Ripristina';

    row.append(text, restoreBtn);
    excludedList.append(row);
  });

  excludedJson.textContent = JSON.stringify(excludedItems, null, 2);
}

async function persistExcludedState() {
  const result = await window.controllerApi.saveExcludedState(excludedItems);
  if (result?.filePath) {
    excludedStatePath = result.filePath;
    renderExcludedArea();
  }
}

function refreshButtons() {
  loadVideoBtn.disabled = availableVideos.length === 0;

  if (availableVideos.length === 0) {
    playBtn.disabled = true;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    videoTimeline.disabled = true;
  }
}

function applyExclusions() {
  const excludedPresetIds = new Set(excludedItems.map((item) => item.presetId));
  const excludedVideoPaths = new Set(excludedItems.map((item) => item.videoPath));

  availablePresets = ALL_PRESETS.filter((preset) => !excludedPresetIds.has(preset.id));
  availableVideos = allVideos.filter((video) => !excludedVideoPaths.has(video.absolutePath));

  renderPresetSelect();
  renderVideoSelect();
  refreshButtons();

  if (availableVideos.length > 0) {
    videoSelect.value = '0';
    selectPresetByVideo(availableVideos[0]);
  }
}

function excludeLoadedPair(preset, video) {
  if (!preset || !video) {
    return;
  }

  const duplicate = excludedItems.some(
    (item) => item.presetId === preset.id || item.videoPath === video.absolutePath
  );

  if (duplicate) {
    return;
  }

  excludedItems.push({
    presetId: preset.id,
    team: preset.team,
    title: preset.title,
    videoName: video.name,
    videoPath: video.absolutePath,
    excludedAt: new Date().toISOString()
  });

  renderExcludedArea();
  applyExclusions();
  persistExcludedState();
}

function restoreSingleExcluded(index) {
  if (Number.isNaN(index) || index < 0 || index >= excludedItems.length) {
    return;
  }

  excludedItems.splice(index, 1);
  renderExcludedArea();
  applyExclusions();
  persistExcludedState();
}

function sanitizeExcludedItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      presetId: Number.isInteger(item.presetId) ? item.presetId : -1,
      team: typeof item.team === 'string' ? item.team : '',
      title: typeof item.title === 'string' ? item.title : '',
      videoName: typeof item.videoName === 'string' ? item.videoName : '',
      videoPath: typeof item.videoPath === 'string' ? item.videoPath : '',
      excludedAt: typeof item.excludedAt === 'string' ? item.excludedAt : ''
    }))
    .filter((item) => item.presetId >= 0 && item.videoPath);
}

async function loadExcludedState() {
  const result = await window.controllerApi.loadExcludedState();

  if (!result?.ok) {
    excludedItems = [];
    excludedStatePath = result?.filePath || '';
    renderExcludedArea();
    return;
  }

  excludedItems = sanitizeExcludedItems(result.excludedItems);
  excludedStatePath = result.filePath || '';
  renderExcludedArea();
}

async function loadCortiVideos() {
  const result = await window.controllerApi.getCortiVideos();

  if (!result || !result.ok) {
    allVideos = [];
    availableVideos = [];
    folderLabel.textContent = result?.message || 'Errore lettura cartella Corti';
    renderVideoSelect();
    refreshButtons();
    return;
  }

  allVideos = result.videos || [];
  folderLabel.textContent = result.folderPath;
  applyExclusions();
}

function setPresenterStatus(state) {
  presenterStatus.className = 'status';

  switch (state?.mode) {
    case 'text':
      presenterStatus.classList.add('status-text');
      presenterStatus.textContent = 'Presenter: Slide testo';
      break;
    case 'video-paused':
      presenterStatus.classList.add('status-video-paused');
      presenterStatus.textContent = 'Presenter: Video in pausa';
      break;
    case 'video-playing':
      presenterStatus.classList.add('status-video-playing');
      presenterStatus.textContent = 'Presenter: Video in riproduzione';
      break;
    case 'blackout':
      presenterStatus.classList.add('status-blackout');
      presenterStatus.textContent = 'Presenter: Slide vuota';
      break;
    default:
      presenterStatus.classList.add('status-idle');
      presenterStatus.textContent = 'Presenter: in attesa';
  }
}

showTextBtn.addEventListener('click', () => {
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  window.controllerApi.showTextSlide({ title, description });
});

presetSelect.addEventListener('change', () => {
  const preset = getSelectedPreset();
  if (!preset) {
    return;
  }

  applyPreset(preset);
  const found = selectBestVideoByPreset(preset);
  if (!found) {
    alert('Nessun video corrispondente trovato.\nPer favore seleziona il video manualmente.');
  }
});

videoSelect.addEventListener('change', () => {
  const video = getSelectedVideo();
  selectPresetByVideo(video);
});

refreshVideosBtn.addEventListener('click', loadCortiVideos);

loadVideoBtn.addEventListener('click', () => {
  let preset = getSelectedPreset();
  const video = getSelectedVideo();

  if (!video) {
    return;
  }

  if (!preset) {
    selectPresetByVideo(video);
    preset = getSelectedPreset();
  }

  if (preset) {
    applyPreset(preset);
  }

  window.controllerApi.loadVideo(video);
  playBtn.disabled = false;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;
  videoTimeline.disabled = false;
  videoTimeline.value = 0;
  currentTimeDisplay.textContent = '00:00';
  durationDisplay.textContent = '00:00';

  excludeLoadedPair(preset, video);
});

playBtn.addEventListener('click', () => {
  window.controllerApi.playVideo();
});

pauseBtn.addEventListener('click', () => {
  window.controllerApi.pauseVideo();
});

resetBtn.addEventListener('click', () => {
  window.controllerApi.seekVideo(0);
});

videoTimeline.addEventListener('input', () => {
  isScrubbing = true;
  currentTimeDisplay.textContent = formatTime(videoTimeline.value);
  if (!previewVideoEl.paused) {
    // If we want smooth scrub, maybe we just set time if it's paused. Let's just set it.
    // Setting currentTime during play might cause stutter, but it's fine for preview.
  }
  previewVideoEl.currentTime = Number(videoTimeline.value);
});

videoTimeline.addEventListener('change', () => {
  isScrubbing = false;
  window.controllerApi.seekVideo(Number(videoTimeline.value));
});

blackoutBtn.addEventListener('click', () => {
  window.controllerApi.blackout();
});

restoreExcludedBtn.addEventListener('click', () => {
  excludedItems = [];
  renderExcludedArea();
  applyExclusions();
  persistExcludedState();
});

excludedList.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const indexValue = target.dataset.excludedIndex;
  if (typeof indexValue !== 'string') {
    return;
  }

  const index = Number.parseInt(indexValue, 10);
  restoreSingleExcluded(index);
});

window.controllerApi.onPresenterState((state) => {
  setPresenterStatus(state);
  updatePreview(state);
});

window.controllerApi.onTimeUpdate((data) => {
  if (!data || isNaN(data.duration)) return;

  durationDisplay.textContent = formatTime(data.duration);
  videoTimeline.max = data.duration;

  if (!isScrubbing && !isNaN(data.currentTime)) {
    videoTimeline.value = data.currentTime;
    currentTimeDisplay.textContent = formatTime(data.currentTime);
    if (previewVideoEl.paused) {
      previewVideoEl.currentTime = data.currentTime;
    }
  }
});

setPresenterStatus({ mode: 'idle' });
updatePreview({ mode: 'idle' });
renderPresetSelect();
renderVideoSelect();
renderExcludedArea();
refreshButtons();

async function initializeController() {
  await loadExcludedState();
  await loadCortiVideos();
}

initializeController();
