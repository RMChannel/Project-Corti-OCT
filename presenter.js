const stage = document.getElementById('stage');
const textSlide = document.getElementById('textSlide');
const slideTitle = document.getElementById('slideTitle');
const slideDescription = document.getElementById('slideDescription');
const videoEl = document.getElementById('videoEl');

function setMode(mode) {
  stage.className = `stage mode-${mode}`;
}

function hideAll() {
  textSlide.classList.add('hidden');
  videoEl.classList.add('hidden');
}

function publishState(mode, meta = {}) {
  window.presenterApi.sendState({ mode, ...meta });
}

function showBlackout() {
  videoEl.pause();
  hideAll();
  setMode('blackout');
  publishState('blackout');
}

function showText({ title = '', description = '' }) {
  videoEl.pause();
  hideAll();

  slideTitle.textContent = title || ' '; 
  slideDescription.textContent = description || ' ';

  textSlide.classList.remove('hidden');
  setMode('text');
  publishState('text', { title, description });
}

function loadVideo({ videoUrl }) {
  if (!videoUrl) {
    return;
  }

  videoEl.pause();
  videoEl.src = videoUrl;
  videoEl.load();

  hideAll();
  videoEl.classList.remove('hidden');
  setMode('video-paused');
  publishState('video-paused', { src: videoUrl });
}

async function playVideo() {
  try {
    await videoEl.play();
    setMode('video-playing');
    publishState('video-playing');
  } catch (error) {
    publishState('video-paused', { error: String(error) });
  }
}

function pauseVideo() {
  videoEl.pause();
  setMode('video-paused');
  publishState('video-paused');
}

window.presenterApi.onBlackout(showBlackout);
window.presenterApi.onShowText(showText);
window.presenterApi.onLoadVideo(loadVideo);
window.presenterApi.onPlayVideo(playVideo);
window.presenterApi.onPauseVideo(pauseVideo);
window.presenterApi.onSeekVideo((time) => {
  if (videoEl && !isNaN(time)) {
    videoEl.currentTime = time;
  }
});

videoEl.addEventListener('ended', () => {
  pauseVideo();
});

function sendTimeUpdate() {
  window.presenterApi.sendTimeUpdate({
    currentTime: videoEl.currentTime,
    duration: videoEl.duration
  });
}

videoEl.addEventListener('timeupdate', sendTimeUpdate);
videoEl.addEventListener('durationchange', sendTimeUpdate);
videoEl.addEventListener('loadedmetadata', sendTimeUpdate);

showBlackout();
