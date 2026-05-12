const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('presenterApi', {
  onShowText: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('presenter:show-text', listener);
    return () => ipcRenderer.removeListener('presenter:show-text', listener);
  },
  onBlackout: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('presenter:blackout', listener);
    return () => ipcRenderer.removeListener('presenter:blackout', listener);
  },
  onLoadVideo: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('presenter:load-video', listener);
    return () => ipcRenderer.removeListener('presenter:load-video', listener);
  },
  onPlayVideo: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('presenter:play-video', listener);
    return () => ipcRenderer.removeListener('presenter:play-video', listener);
  },
  onPauseVideo: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('presenter:pause-video', listener);
    return () => ipcRenderer.removeListener('presenter:pause-video', listener);
  },
  onSeekVideo: (callback) => {
    const listener = (_event, time) => callback(time);
    ipcRenderer.on('presenter:seek-video', listener);
    return () => ipcRenderer.removeListener('presenter:seek-video', listener);
  },
  sendTimeUpdate: (payload) => ipcRenderer.send('presenter:timeupdate', payload),
  sendState: (payload) => ipcRenderer.send('presenter:state', payload)
});
