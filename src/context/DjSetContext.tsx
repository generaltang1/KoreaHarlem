"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { DjSetLiveSettings, DjSetTrack } from "@/lib/djSet";
import { extractYoutubeVideoId } from "@/lib/djSet";
import { notifyCollectionPause, notifyDjTakeover, onMusicTakeover } from "@/lib/playbackFocus";
import { usePlayer } from "@/context/PlayerContext";

type DjSetContextValue = {
  tracks: DjSetTrack[];
  current: DjSetTrack | null;
  index: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  ready: boolean;
  liveEnabled: boolean;
  liveUrl: string | null;
  liveVideoId: string | null;
  liveMode: boolean;
  livePlaying: boolean;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  playNext: () => void;
  playAt: (nextIndex: number) => void;
  setVolume: (value: number) => void;
  enterLive: () => void;
  exitLive: () => void;
  toggleLivePlay: () => void;
};

const DjSetContext = createContext<DjSetContextValue | null>(null);

export function DjSetProvider({ children }: { children: React.ReactNode }) {
  const { pause: pauseMusic } = usePlayer();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const indexRef = useRef(0);
  const tracksRef = useRef<DjSetTrack[]>([]);

  const [tracks, setTracks] = useState<DjSetTrack[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [ready, setReady] = useState(false);
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const [livePlaying, setLivePlaying] = useState(false);

  const liveVideoId = extractYoutubeVideoId(liveUrl);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tracksRes, settingsRes] = await Promise.all([
          fetch("/api/dj-set/tracks"),
          fetch("/api/dj-set/settings"),
        ]);
        if (!cancelled) {
          if (tracksRes.ok) {
            const json = (await tracksRes.json()) as { tracks?: DjSetTrack[] };
            const list = json.tracks ?? [];
            setTracks(list);
            tracksRef.current = list;
          }
          if (settingsRes.ok) {
            const json = (await settingsRes.json()) as { settings?: DjSetLiveSettings };
            const s = json.settings;
            setLiveEnabled(Boolean(s?.live_enabled && s?.live_url));
            setLiveUrl(s?.live_url ?? null);
          }
          setReady(true);
        }
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    return onMusicTakeover(() => {
      setIsPlaying(false);
      audioRef.current?.pause();
      setLivePlaying(false);
    });
  }, []);

  const loadIndex = useCallback(
    (nextIndex: number, autoplay: boolean) => {
      const list = tracksRef.current;
      if (list.length === 0) return;
      const i = ((nextIndex % list.length) + list.length) % list.length;
      const track = list[i];
      setIndex(i);
      indexRef.current = i;
      setCurrentTime(0);
      const audio = audioRef.current;
      if (!audio || !track) return;
      if (audio.src !== track.audio_url) {
        audio.src = track.audio_url;
        audio.load();
      }
      if (autoplay) {
        notifyDjTakeover();
        notifyCollectionPause();
        pauseMusic();
        setIsPlaying(true);
        void audio.play().catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(false);
        audio.pause();
      }
    },
    [pauseMusic],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      const next = indexRef.current + 1;
      if (tracksRef.current.length === 0) return;
      loadIndex(next % tracksRef.current.length, true);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
    };
  }, [loadIndex]);

  useEffect(() => {
    if (tracks.length === 0 || liveMode) return;
    const audio = audioRef.current;
    const track = tracks[index];
    if (!audio || !track) return;
    if (audio.src !== track.audio_url) {
      audio.src = track.audio_url;
      audio.load();
    }
  }, [tracks, index, liveMode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, volume));
  }, [volume]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    audioRef.current?.pause();
  }, []);

  const play = useCallback(() => {
    if (tracksRef.current.length === 0) return;
    setLiveMode(false);
    setLivePlaying(false);
    notifyDjTakeover();
    notifyCollectionPause();
    pauseMusic();
    setIsPlaying(true);
    void audioRef.current?.play().catch(() => setIsPlaying(false));
  }, [pauseMusic]);

  const toggle = useCallback(() => {
    if (liveMode) {
      setLivePlaying((v) => !v);
      return;
    }
    if (isPlaying) pause();
    else play();
  }, [isPlaying, liveMode, pause, play]);

  const playNext = useCallback(() => {
    if (liveMode) return;
    loadIndex(indexRef.current + 1, true);
  }, [loadIndex, liveMode]);

  const playAt = useCallback(
    (nextIndex: number) => {
      setLiveMode(false);
      setLivePlaying(false);
      loadIndex(nextIndex, true);
    },
    [loadIndex],
  );

  const setVolume = useCallback((value: number) => {
    setVolumeState(Math.max(0, Math.min(1, value)));
  }, []);

  const enterLive = useCallback(() => {
    if (!liveEnabled || !liveVideoId) return;
    pause();
    notifyDjTakeover();
    notifyCollectionPause();
    pauseMusic();
    setLiveMode(true);
    setLivePlaying(true);
  }, [liveEnabled, liveVideoId, pause, pauseMusic]);

  const exitLive = useCallback(() => {
    setLiveMode(false);
    setLivePlaying(false);
  }, []);

  const toggleLivePlay = useCallback(() => {
    if (!liveMode) {
      enterLive();
      return;
    }
    setLivePlaying((v) => !v);
  }, [enterLive, liveMode]);

  const current = tracks[index] ?? null;

  const value: DjSetContextValue = {
    tracks,
    current,
    index,
    isPlaying: liveMode ? livePlaying : isPlaying,
    currentTime,
    duration,
    volume,
    ready,
    liveEnabled,
    liveUrl,
    liveVideoId,
    liveMode,
    livePlaying,
    toggle,
    play,
    pause,
    playNext,
    playAt,
    setVolume,
    enterLive,
    exitLive,
    toggleLivePlay,
  };

  return (
    <DjSetContext.Provider value={value}>
      <audio ref={audioRef} preload="metadata" className="hidden" />
      {children}
    </DjSetContext.Provider>
  );
}

export function useDjSet() {
  const ctx = useContext(DjSetContext);
  if (!ctx) throw new Error("useDjSet must be used within DjSetProvider");
  return ctx;
}
