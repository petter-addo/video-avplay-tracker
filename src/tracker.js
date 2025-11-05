import nrvideo from '@newrelic/video-core'
import { version } from '../package.json';

export default class AVPlayTracker extends nrvideo.VideoTracker {
  constructor(player, options) {
    super(player, options);
    nrvideo.Core.addTracker(this);

    if (this.versionString) {
      this.majorVersion = parseInt(this.versionString.split('.')[0]);
    } else {
      console.error('player.getVersion is not supported by avplay js');
    }
    this.options = options;
    
    // State monitoring variables
    this.stateMonitorInterval = null;
    this.previousState = null;
    this.isMonitoring = false;
    this.monitorInterval = options?.monitorInterval || 500; // Default 500ms
  }

  getTrackerName() {
    return 'avplay';
  }

  getTrackerVersion() {
    return version;
  }

  getPlayerName() {
    return 'Tizen AVPlay';
  }

  getInstrumentationName() {
    return this.getPlayerName();
  }

  getInstrumentationVersion() {
    return this.getPlayerVersion();
  }

  getInstrumentationProvider() {
    return 'New Relic';
  }

  getPlayerVersion() {
    return this.player.getVersion();
  }

  getPlayhead() {
    return this.player.getCurrentTime() * 1000; // in milliseconds
  }

  registerListeners() {
    nrvideo.Log.debugCommonVideoEvents(this.player);
    this.onBufferingStart = this.onBufferingStart.bind(this);
    this.onBufferingProgress = this.onBufferingProgress.bind(this);
    this.onBufferingComplete = this.onBufferingComplete.bind(this);
    this.onCurrentPlaytime = this.onCurrentPlaytime.bind(this);
    this.onStreamCompleted = this.onStreamCompleted.bind(this);
    this.onEvent = this.onEvent.bind(this);
    this.onError = this.onError.bind(this);
    this.onErrorMsg = this.onErrorMsg.bind(this);
    this.onDrmEvent = this.onDrmEvent.bind(this);
    this.onSubtitleChange = this.onSubtitleChange.bind(this);
    const listeners = {
      onbufferingstart: this.onBufferingStart,
      onbufferingprogress: this.onBufferingProgress,
      onbufferingcomplete: this.onBufferingComplete,
      oncurrentplaytime: this.onCurrentPlaytime,
      onstreamcompleted: this.onStreamCompleted,
      onevent: this.onEvent,
      onerror: this.onError,
      onerrormsg: this.onErrorMsg,
      ondrmevent: this.onDrmEvent,
      onsubtitlechange: this.onSubtitleChange,

    }
    this.player.setListener(listeners);
    
    // Start state monitoring since AVPlayer doesn't have proper callback events
    console.log('startStateMonitor');
    this.startStateMonitor();
  }

  unregisterListeners() {
    this.stopStateMonitor();
  }

  onBufferingStart() {
    this.sendDownload({ state: 'buffering started' });
  }

  onBufferingProgress(percent) {
    console.log('onBufferingProgress', percent);
    this.sendDownload({ state: 'buffering', percent });
  }

  onBufferingComplete() {
    this.sendDownload({ state: 'buffering complete' });
  }

  onStreamCompleted() {
    this.sendEnd();
  }

  onCurrentPlaytime(currentTime) {
    // this.sendDownload({ state: 'playing', currentTime });
  }

  onEvent(eventType, eventData) {
    // this.sendDownload({ state: 'event', eventType, eventData });
  }

  onError(eventType) {
    this.sendError({ error: eventType });
  }

  onErrorMsg(eventType, errorMessage) {
    this.sendError({ error: eventType, errorMessage });
  }

  onDrmEvent(type, data) {
    // this.sendDownload({ state: 'drm event', type, data });
  }

  onSubtitleChange() {
    // this.sendDownload({ state: 'subtitle change' });
  }

  /**
   * State monitor function to monitor player's state since AVPlayer doesn't have proper callback events.
   * This function polls the player state periodically and handles state transitions.
   */
  stateMonitor() {
    if (!this.player || !this.player.getState) {
      return;
    }

    try {
      const currentState = this.player.getState();
      
      // Only process if state has changed
      if (currentState !== this.previousState) {
        this.handleStateChange(this.previousState, currentState);
        this.previousState = currentState;
      }
    } catch (error) {
      console.error('Error monitoring player state:', error);
    }
  }

  /**
   * Handles state transitions and triggers appropriate tracker methods.
   * @param {string} previousState - The previous state of the player
   * @param {string} currentState - The current state of the player
   */
  handleStateChange(previousState, currentState) {
    // Handle state transitions
    switch (currentState) {
      case 'IDLE':
        // Player is idle, ready to prepare
        if (previousState && previousState !== 'IDLE' && previousState !== 'NONE') {
          // Player was in a different state and moved to idle
          this.sendEnd();
        }
        break;

      case 'READY':
        // Player is ready to play
        if (previousState === 'IDLE' || previousState === null) {
          // Transitioned from idle to ready
          this.sendRequest();
        }
        break;

      case 'PLAYING':
        // Player started playing
        if (previousState === 'PAUSED') {
          // Resuming from pause
          this.sendResume();
          this.sendBufferEnd();
          this.sendStart();
        } else if (previousState === 'BUFFERING') {
          // Buffering complete, resuming playback
          this.sendBufferEnd();
          this.sendStart();
        } else if (previousState === 'READY' || previousState === null) {
          // Starting from ready or initial state
          this.sendStart();
        } else if (previousState !== 'PLAYING') {
          // Started playing from any other state
          this.sendStart();
        }
        break;

      case 'PAUSED':
        // Player is paused
        if (previousState === 'PLAYING') {
          this.sendPause();
        }
        break;

      case 'BUFFERING':
        // Player is buffering
        if (previousState === 'PLAYING') {
          this.sendBufferStart();
        }
        break;

      case 'NONE':
        // Player is stopped/reset
        if (previousState && previousState !== 'NONE' && previousState !== 'IDLE') {
          this.sendEnd();
        }
        break;

      default:
        // Unknown state, log it
        console.log(`Unknown player state: ${currentState}`);
    }
  }

  /**
   * Starts the state monitor interval.
   */
  startStateMonitor() {
    if (this.isMonitoring) {
      return; // Already monitoring
    }

    if (!this.player || !this.player.getState) {
      console.warn('Player does not support getState(), cannot start state monitor');
      return;
    }

    this.isMonitoring = true;
    this.previousState = this.player.getState();
    
    // Start monitoring interval
    this.stateMonitorInterval = setInterval(() => {
      this.stateMonitor();
    }, this.monitorInterval);

    // Initial state check
    this.stateMonitor();
  }

  /**
   * Stops the state monitor interval.
   */
  stopStateMonitor() {
    if (this.stateMonitorInterval) {
      clearInterval(this.stateMonitorInterval);
      this.stateMonitorInterval = null;
    }
    this.isMonitoring = false;
    this.previousState = null;
  }
}
