import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  audioUrl: string;
  isCurrentUser: boolean;
  colors?: any;
  isDark?: boolean;
}

export const VoiceNotePlayer: React.FC<Props> = ({
  audioUrl,
  isCurrentUser,
  isDark = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [trackWidth, setTrackWidth] = useState(0);

  const webAudioRef = useRef<any>(null);
  const nativePlayerRef = useRef<any>(null);

  useEffect(() => {
    if (!audioUrl) return;

    if (Platform.OS === 'web') {
      try {
        const audio = new (window as any).Audio(audioUrl);
        webAudioRef.current = audio;

        const onLoaded = () => {
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            setDuration(audio.duration);
          }
        };

        const onTime = () => {
          if (!isPlaying) {
            setCurrentTime(audio.currentTime);
          }
          if (!duration && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            setDuration(audio.duration);
          }
        };

        const onEnd = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };

        audio.addEventListener('loadedmetadata', onLoaded);
        audio.addEventListener('timeupdate', onTime);
        audio.addEventListener('ended', onEnd);

        return () => {
          audio.pause();
          audio.removeEventListener('loadedmetadata', onLoaded);
          audio.removeEventListener('timeupdate', onTime);
          audio.removeEventListener('ended', onEnd);
          webAudioRef.current = null;
        };
      } catch (err) {
        console.warn('Error al inicializar web audio:', err);
      }
    } else {
      let isMounted = true;
      (async () => {
        try {
          const { createAudioPlayer } = require('expo-audio');
          if (createAudioPlayer) {
            const player = createAudioPlayer({ uri: audioUrl });
            nativePlayerRef.current = player;
            player.addListener('playbackStatusUpdate', (status: any) => {
              if (!isMounted) return;
              if (status.duration) {
                setDuration(status.duration / 1000);
              }
              if (status.currentTime && !isPlaying) {
                setCurrentTime(status.currentTime / 1000);
              }
              if (status.playbackState === 'playing') {
                setIsPlaying(true);
              } else {
                setIsPlaying(false);
              }
            });
          }
        } catch (err) {
          console.warn('expo-audio nativo no disponible o error:', err);
        }
      })();

      return () => {
        isMounted = false;
        try {
          nativePlayerRef.current?.pause();
          nativePlayerRef.current?.release();
        } catch (_) { }
      };
    }
  }, [audioUrl]);

  useEffect(() => {
    let animId: any;

    if (isPlaying) {
      if (Platform.OS === 'web') {
        const tick = () => {
          if (webAudioRef.current && !webAudioRef.current.paused) {
            setCurrentTime(webAudioRef.current.currentTime);
            if (
              webAudioRef.current.duration &&
              !isNaN(webAudioRef.current.duration) &&
              isFinite(webAudioRef.current.duration)
            ) {
              setDuration(webAudioRef.current.duration);
            }
            animId = requestAnimationFrame(tick);
          }
        };
        animId = requestAnimationFrame(tick);
      } else {
        animId = setInterval(() => {
          if (nativePlayerRef.current?.currentTime) {
            setCurrentTime(nativePlayerRef.current.currentTime / 1000);
          }
        }, 50);
      }
    }

    return () => {
      if (Platform.OS === 'web') {
        if (animId) cancelAnimationFrame(animId);
      } else {
        if (animId) clearInterval(animId);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (Platform.OS === 'web') {
      const audio = webAudioRef.current;
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.playbackRate = playbackRate;
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch((e: any) => console.warn('Error al reproducir audio web:', e));
      }
    } else {
      const player = nativePlayerRef.current;
      if (!player) return;
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.playbackRate = playbackRate;
        player.play();
        setIsPlaying(true);
      }
    }
  };

  const seekToFraction = (fraction: number) => {
    if (duration <= 0) return;
    const clamped = Math.max(0, Math.min(1, fraction));
    const targetTime = clamped * duration;
    setCurrentTime(targetTime);

    if (Platform.OS === 'web' && webAudioRef.current) {
      webAudioRef.current.currentTime = targetTime;
    } else if (nativePlayerRef.current?.seekTo) {
      nativePlayerRef.current.seekTo(targetTime * 1000);
    }
  };

  const handleTrackTouch = (e: any) => {
    if (!trackWidth || duration <= 0) return;
    const locationX = e.nativeEvent.locationX;
    const fraction = locationX / trackWidth;
    seekToFraction(fraction);
  };

  const toggleSpeed = () => {
    const nextRate: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (Platform.OS === 'web' && webAudioRef.current) {
      webAudioRef.current.playbackRate = nextRate;
    } else if (nativePlayerRef.current) {
      nativePlayerRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.playButton,
          isCurrentUser ? styles.playButtonUser : styles.playButtonOther,
        ]}
        onPress={togglePlay}
        activeOpacity={0.8}
        accessibilityLabel={isPlaying ? 'Pausar nota de voz' : 'Reproducir nota de voz'}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={16}
          color={isCurrentUser ? '#FF8C00' : '#FFFFFF'}
          style={!isPlaying ? { marginLeft: 2 } : undefined}
        />
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        <View
          style={styles.trackTouchable}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onResponderGrant={handleTrackTouch}
          onResponderMove={handleTrackTouch}
        >
          <View
            style={[
              styles.progressBarBg,
              {
                backgroundColor: isCurrentUser
                  ? 'rgba(255, 255, 255, 0.35)'
                  : isDark
                    ? '#374151'
                    : '#E2E8F0',
              },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: isCurrentUser ? '#FFFFFF' : '#FF8C00',
                },
              ]}
            />
          </View>

          <View
            style={[
              styles.progressThumb,
              isCurrentUser ? styles.progressThumbUser : styles.progressThumbOther,
              {
                left: `${progressPercent}%`,
              },
            ]}
          />
        </View>

        <View style={styles.timeRow}>
          <Text
            style={[
              styles.timeText,
              { color: isCurrentUser ? 'rgba(255, 255, 255, 0.85)' : isDark ? '#9CA3AF' : '#64748B' },
            ]}
          >
            {formatTime(currentTime)}
          </Text>
          <Text
            style={[
              styles.timeText,
              { color: isCurrentUser ? 'rgba(255, 255, 255, 0.85)' : isDark ? '#9CA3AF' : '#64748B' },
            ]}
          >
            {duration > 0 ? formatTime(duration) : 'Audio'}
          </Text>
        </View>
      </View>

      {/* Velocidad 1x / 1.5x / 2x */}
      <TouchableOpacity
        style={[
          styles.speedButton,
          {
            backgroundColor: isCurrentUser
              ? 'rgba(255, 255, 255, 0.2)'
              : isDark
                ? '#374151'
                : '#F1F5F9',
          },
        ]}
        onPress={toggleSpeed}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.speedText,
            { color: isCurrentUser ? '#FFFFFF' : isDark ? '#E5E7EB' : '#475569' },
          ]}
        >
          {playbackRate}x
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
    minWidth: 210,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2.5,
    elevation: 2,
  },
  playButtonUser: {
    backgroundColor: '#FFFFFF',
  },
  playButtonOther: {
    backgroundColor: '#FF8C00',
  },
  waveformContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  trackTouchable: {
    height: 20,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 3,
  },
  progressThumbUser: {
    backgroundColor: '#FFFFFF',
  },
  progressThumbOther: {
    backgroundColor: '#FF8C00',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  speedButton: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  speedText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
