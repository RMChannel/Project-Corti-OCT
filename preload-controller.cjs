const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('controllerApi', {
  getCortiVideos: () => ipcRenderer.invoke('videos:get-from-corti'),
  loadExcludedState: () => ipcRenderer.invoke('excluded:load-state'),
  saveExcludedState: (excludedItems) => ipcRenderer.invoke('excluded:save-state', excludedItems),
  showTextSlide: (payload) => ipcRenderer.send('controller:show-text', payload),
  blackout: () => ipcRenderer.send('controller:blackout'),
  loadVideo: (payload) => ipcRenderer.send('controller:load-video', payload),
  playVideo: () => ipcRenderer.send('controller:play-video'),
  pauseVideo: () => ipcRenderer.send('controller:pause-video'),
  onPresenterState: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('controller:presenter-state', listener);

    return () => {
      ipcRenderer.removeListener('controller:presenter-state', listener);
    };
  },
  onTimeUpdate: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('controller:timeupdate', listener);
    return () => {
      ipcRenderer.removeListener('controller:timeupdate', listener);
    };
  },
  seekVideo: (time) => ipcRenderer.send('controller:seek-video', time)
});
