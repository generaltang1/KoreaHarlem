"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  cycleRepeatMode,
  loadPlayerPreferences,
  savePlayerPreferences,
  type RepeatMode,
} from "@/lib/playerPreferences";
import { shuffleQueueFromIndex, shuffleRemainingQueue } from "@/lib/playerShuffle";

export interface Track {
  id: string;
  albumId?: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url?: string | null;
  duration?: number | null;
  description?: string | null;
}

interface PlayerContextValue {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  setTrack: (track: Track) => void;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  playNext: () => void;
  playPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  close: () => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

async function fetchRandomAlbumQueue(excludeAlbumId?: string): Promise<Track[]> {
  const params = new URLSearchParams();
  if (excludeAlbumId) params.set("excludeAlbumId", excludeAlbumId);
  const res = await fetch(`/api/music/random-queue?${params.toString()}`);
  if (!res.ok) return [];
  const json = (await res.json()) as { tracks?: Track[] };
  return json.tracks ?? [];
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef(0);
  const isShuffleRef = useRef(false);
  const repeatModeRef = useRef<RepeatMode>("off");
  const volumeBeforeMuteRef = useRef(0.7);
  const randomFetchRef = useRef(false);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    const prefs = loadPlayerPreferences();
    setVolumeState(prefs.volume);
    volumeBeforeMuteRef.current = prefs.volume > 0 ? prefs.volume : 0.7;
    setIsMuted(prefs.isMuted);
    setIsShuffle(prefs.isShuffle);
    setRepeatMode(prefs.repeatMode);
    isShuffleRef.current = prefs.isShuffle;
    repeatModeRef.current = prefs.repeatMode;
    setPrefsLoaded(true);
  }, []);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    if (!prefsLoaded || !audioRef.current) return;
    const audio = audioRef.current;
    const level = Math.max(0, Math.min(1, volume));
    audio.volume = level;
    audio.muted = isMuted || level <= 0;
  }, [volume, isMuted, prefsLoaded, currentTrack]);

  const loadTrackAtIndex = useCallback((tracks: Track[], index: number, autoplay = true) => {
    const track = tracks[index];
    if (!track) return;
    queueRef.current = tracks;
    queueIndexRef.current = index;
    setQueue(tracks);
    setQueueIndex(index);
    setCurrentTrack(track);
    setCurrentTime(0);
    setIsPlaying(autoplay);
  }, []);

  const setVolume = useCallback((value: number) => {
    const next = Math.max(0, Math.min(1, value));
    if (next > 0) volumeBeforeMuteRef.current = next;
    setVolumeState(next);
    if (next > 0) setIsMuted(false);
    else setIsMuted(true);
    savePlayerPreferences({ volume: next, isMuted: next <= 0 });
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (prev || volume <= 0) {
        const restored =
          volumeBeforeMuteRef.current > 0 ? volumeBeforeMuteRef.current : 0.7;
        setVolumeState(restored);
        savePlayerPreferences({ isMuted: false, volume: restored });
        return false;
      }
      volumeBeforeMuteRef.current = volume > 0 ? volume : volumeBeforeMuteRef.current;
      savePlayerPreferences({ isMuted: true });
      return true;
    });
  }, [volume]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const next = !prev;
      if (next && queueRef.current.length > 1) {
        const reshuffled = shuffleRemainingQueue(queueRef.current, queueIndexRef.current);
        queueRef.current = reshuffled;
        setQueue(reshuffled);
      }
      savePlayerPreferences({ isShuffle: next });
      return next;
    });
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      const next = cycleRepeatMode(prev);
      savePlayerPreferences({ repeatMode: next });
      return next;
    });
  }, []);

  const setTrack = useCallback(
    (track: Track) => {
      if (currentTrack?.id === track.id) {
        setIsPlaying((playing) => !playing);
        return;
      }
      const ordered = isShuffleRef.current ? shuffleQueueFromIndex([track], 0) : [track];
      loadTrackAtIndex(ordered, 0);
    },
    [currentTrack?.id, loadTrackAtIndex],
  );

  const playQueue = useCallback(
    (tracks: Track[], startIndex = 0) => {
      if (tracks.length === 0) return;
      const index = Math.min(Math.max(startIndex, 0), tracks.length - 1);
      const ordered = isShuffleRef.current ? shuffleQueueFromIndex(tracks, index) : tracks;
      loadTrackAtIndex(ordered, isShuffleRef.current ? 0 : index);
    },
    [loadTrackAtIndex],
  );

  const continueWithRandomAlbum = useCallback(async () => {
    if (randomFetchRef.current) return;
    randomFetchRef.current = true;
    try {
      const current = queueRef.current[queueIndexRef.current];
      const tracks = await fetchRandomAlbumQueue(current?.albumId);
      if (tracks.length === 0) {
        setIsPlaying(false);
        return;
      }
      const ordered = isShuffleRef.current ? shuffleQueueFromIndex(tracks, 0) : tracks;
      loadTrackAtIndex(ordered, 0);
    } finally {
      randomFetchRef.current = false;
    }
  }, [loadTrackAtIndex]);

  const playNext = useCallback(() => {
    const mode = repeatModeRef.current;
    const nextIndex = queueIndexRef.current + 1;

    if (nextIndex < queueRef.current.length) {
      loadTrackAtIndex(queueRef.current, nextIndex);
      return;
    }

    if (mode === "all") {
      loadTrackAtIndex(queueRef.current, 0);
      return;
    }

    if (mode === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        void audioRef.current.play();
      }
      return;
    }

    void continueWithRandomAlbum();
  }, [loadTrackAtIndex, continueWithRandomAlbum]);

  const handleTrackEnded = useCallback(() => {
    if (repeatModeRef.current === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        void audioRef.current.play();
      }
      return;
    }
    playNext();
  }, [playNext]);

  const playPrev = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const prevIndex = queueIndexRef.current - 1;
    if (prevIndex >= 0) {
      loadTrackAtIndex(queueRef.current, prevIndex);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  }, [loadTrackAtIndex]);

  const play = useCallback(() => {
    audioRef.current?.play();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const close = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    queueRef.current = [];
    queueIndexRef.current = 0;
    setCurrentTrack(null);
    setQueue([]);
    setQueueIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const hasNext =
    repeatMode === "one" ||
    repeatMode === "all" ||
    queueIndex < queue.length - 1 ||
    queue.length > 0;
  const hasPrev = queueIndex > 0;

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        queueIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        setTrack,
        playQueue,
        playNext,
        playPrev,
        hasNext,
        hasPrev,
        play,
        pause,
        toggle,
        seek,
        close,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        audioRef,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={handleTrackEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
