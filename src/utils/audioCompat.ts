import { PermissionsAndroid, Platform } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

export async function requestRecordingPermissionsAsync(): Promise<{
  granted: boolean;
}> {
  if (Platform.OS === 'web') return { granted: true };
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    return { granted: granted === PermissionsAndroid.RESULTS.GRANTED };
  }
  return { granted: true };
}

export function createAudioPlayer(source: { uri: string }) {
  const player = AudioRecorderPlayer as any;
  let statusListener: ((status: any) => void) | null = null;
  let playing = false;
  let currentPlaybackRate = 1.0;

  const wrapper = {
    loop: false,
    volume: 1.0,
    get playbackRate() {
      return currentPlaybackRate;
    },
    set playbackRate(rate: number) {
      currentPlaybackRate = rate;
      if (playing && typeof player.setPlaybackSpeed === 'function') {
        player.setPlaybackSpeed(rate).catch(() => { });
      }
    },
    addListener: (event: string, cb: (status: any) => void) => {
      if (event === 'playbackStatusUpdate') {
        statusListener = cb;
      }
      return {
        remove: () => {
          statusListener = null;
        },
      };
    },
    play: async () => {
      try {
        playing = true;
        await player.startPlayer(source.uri);
        if (currentPlaybackRate !== 1.0 && typeof player.setPlaybackSpeed === 'function') {
          await player.setPlaybackSpeed(currentPlaybackRate).catch(() => { });
        }
        player.addPlayBackListener((e: any) => {
          statusListener?.({
            duration: e.duration,
            currentTime: e.currentPosition,
            playbackState:
              e.currentPosition >= e.duration && e.duration > 0
                ? 'stopped'
                : 'playing',
          });
          if (e.currentPosition >= e.duration && e.duration > 0) {
            if (wrapper.loop) {
              player.seekToPlayer(0).catch(() => { });
            } else {
              playing = false;
            }
          }
        });
      } catch (err) {
        playing = false;
        console.warn('[audioCompat] Error reproduciendo audio:', err);
      }
    },
    pause: async () => {
      if (!playing) return;
      playing = false;
      try {
        await player.pausePlayer();
      } catch { }
    },
    release: async () => {
      playing = false;
      try {
        await player.stopPlayer();
        player.removePlayBackListener();
      } catch { }
    },
  };

  return wrapper;
}

export class NativeAudioRecorder {
  private recorder = AudioRecorderPlayer as any;
  public uri: string | null = null;

  async prepareToRecordAsync() { }

  async record() {
    this.uri = await this.recorder.startRecorder();
  }

  async stop() {
    const result = await this.recorder.stopRecorder();
    this.recorder.removeRecordBackListener();
    if (result) {
      this.uri = result;
    }
    return this.uri;
  }
}
