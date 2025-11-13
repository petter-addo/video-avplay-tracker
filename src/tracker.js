import nrvideo from '@newrelic/video-core'
import { version } from '../package.json';

export default class AVPlayTracker extends nrvideo.VideoTracker {
  constructor(player, options) {
    super(player, options);
    nrvideo.Core.addTracker(this, options);

    this.options = options;
    
    // State monitoring variables
    this.stateMonitorInterval = null;
    this.previousState = null;
    this.isMonitoring = false;
    this.monitorInterval = options?.monitorInterval || 500; // Default 500ms

    this.originalSeekToSuccessCallback = null;
    this.originalJumpForwardSuccessCallback = null;
    this.originalJumpBackwardSuccessCallback = null;

    this.contentSrc = null;
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

  getDuration() {
    return this.player.getDuration();
  }

  getStreamInfo() {
    const currentState = this.player.getState();
    let streamInfo = {
      renditionHeight: null,
      renditionWidth: null,
      language: null,
    }
    if (currentState === "READY" || currentState === "PLAYING" || currentState === "PAUSED") {
      var infos = webapis.avplay.getCurrentStreamInfo();
        infos.forEach(function(info) {
          if (info.type === "VIDEO") {
            try {
              var json = JSON.parse(info.extra_info);
              streamInfo.renditionWidth = json.Width;
              streamInfo.renditionHeight = json.Height;
            } catch(e) {
              console.warn("Could not parse extra_info", info.extra_info);
            }
          } else if (info.type === "AUDIO") {
            try {
              const extra = JSON.parse(info.extra_info);
              streamInfo.language = extra.language;
            } catch (e) {
              console.warn("Could not parse extra_info", info.extra_info);
            }
          }
        });
    }
    return streamInfo;
  }
  getRenditionHeight() {
    const streamInfo = this.getStreamInfo();
    return streamInfo.renditionHeight;
  }

  getRenditionWidth() {
    const streamInfo = this.getStreamInfo();
    return streamInfo.renditionWidth;
  }

  getSrc() {
    return this.contentSrc;
  }

  getLanguage() {
    const streamInfo = this.getStreamInfo();
    return streamInfo.language;
  }

  getBitRate() {
    const currentState = this.player.getState();
    if (currentState === "READY" || currentState === "PLAYING" || currentState === "PAUSED") {
      return this.player.getStreamingProperty("CURRENT_BANDWIDTH");
    }
    return null;
  }

  registerListeners() {
    nrvideo.Log.debugCommonVideoEvents(this.player);
    this.onBufferingStart = this.onBufferingStart.bind(this);
    this.onBufferingComplete = this.onBufferingComplete.bind(this);
    this.onStreamCompleted = this.onStreamCompleted.bind(this);
    this.onError = this.onError.bind(this);
    this.onErrorMsg = this.onErrorMsg.bind(this);
    const listeners = {
      onbufferingstart: this.onBufferingStart,
      onbufferingcomplete: this.onBufferingComplete,
      onstreamcompleted: this.onStreamCompleted,
      onerror: this.onError,
      onerrormsg: this.onErrorMsg,
    }
    
    this.originalSeekTo = this.player.seekTo;
    this.player.seekTo = this.seekTo.bind(this);

    this.originalJumpForward = this.player.jumpForward;
    this.player.jumpForward = this.jumpForward.bind(this);

    this.originalJumpBackward = this.player.jumpBackward;
    this.player.jumpBackward = this.jumpBackward.bind(this);

    this.originalOpen = this.player.open;
    this.player.open = this.open.bind(this);

    this.player.setListener(listeners);
    
    // Start state monitoring since AVPlayer doesn't have proper callback events
    this.startStateMonitor();
  }

  unregisterListeners() {
    this.stopStateMonitor();
  }

  open(url) {
    this.contentSrc = url;
    this.originalOpen(url);
  }

  seekTo(milliseconds, successCallback = null, errorCallback = null) {
    const args = [milliseconds];

    const hasErrorCallback = typeof errorCallback === 'function';

    this.originalSeekToSuccessCallback = successCallback || null;
    args.push(this.seekToSuccessCallback.bind(this));

    if (hasErrorCallback) {
      args.push(errorCallback);
    }
    this.originalSeekTo(...args);
    this.sendSeekStart();
  }

  seekToSuccessCallback() {
    if (this.originalSeekToSuccessCallback) {
      this.originalSeekToSuccessCallback();
    }
    this.sendSeekEnd();
  }

  jumpForward(milliseconds, successCallback = null, errorCallback = null) {
    const args = [milliseconds];

    const hasErrorCallback = typeof errorCallback === 'function';

    this.originalJumpForwardSuccessCallback = successCallback || null;
    args.push(this.jumpForwardSuccessCallback.bind(this));

    if (hasErrorCallback) {
      args.push(errorCallback);
    }
    this.originalJumpForward(...args);
    this.sendSeekStart();
  }

  jumpForwardSuccessCallback() {
    if (this.originalJumpForwardSuccessCallback) {
      this.originalJumpForwardSuccessCallback();
    }
    this.sendSeekEnd();
  }

  jumpBackward(milliseconds, successCallback = null, errorCallback = null) {
    const args = [milliseconds];

    const hasErrorCallback = typeof errorCallback === 'function';

    this.originalJumpBackwardSuccessCallback = successCallback || null;
    args.push(this.jumpBackwardSuccessCallback.bind(this));

    if (hasErrorCallback) {
      args.push(errorCallback);
    }
    this.originalJumpBackward(...args);
    this.sendSeekStart();
  }

  jumpBackwardSuccessCallback() {
    if (this.originalJumpBackwardSuccessCallback) {
      this.originalJumpBackwardSuccessCallback();
    }
    this.sendSeekEnd();
  }
    
  onBufferingStart() {
    this.sendBufferStart();
  }
  onBufferingComplete() {
    this.sendDownload();
    this.sendRequest();
  }

  onStreamCompleted() {
    this.sendEnd();
  }

  onError(eventType) {
    this.sendError({ errorCode: eventType });
  }

  onErrorMsg(eventType, errorMessage) {
    this.sendError({ errorCode: eventType, errorMessage });
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
    }
  }

  /**
   * Handles state transitions and triggers appropriate tracker methods.
   * @param {string} previousState - The previous state of the player
   * @param {string} currentState - The current state of the player
   */
  handleStateChange(previousState, currentState) {
    // Handle state transitions
    console.log(`handleStateChange ${previousState} -> ${currentState}`);
    switch (currentState) {
      case 'IDLE':
        // Player is idle, ready to prepare
        if (previousState === null) {
          this.sendRequest();
        } else if (previousState && previousState !== 'IDLE' && previousState !== 'NONE') {
          // Player was in a different state and moved to idle
          this.sendEnd();
        }
        if (previousState === 'PLAYING') {
          this.sendEnd();
        }
        break;

      case 'PLAYING':
        // Player started playing
        if (previousState === 'PAUSED') {
          // Resuming from pause
          this.sendBufferEnd();
          this.sendResume();
        } else if (previousState === 'READY' || previousState === 'IDLE' || previousState === null) {
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

      case 'NONE':
        // Player is stopped/reset
        if (previousState && previousState !== 'NONE' && previousState !== 'IDLE') {
          this.sendEnd();
        }
        break;

      case 'READY':
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
