"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { DjSetTrack } from "@/lib/djSet";
import { notifyDjTakeover, onMusicTakeover } from "@/lib/playbackFocus";
import { usePlayer } from "@/context/PlayerContext";

type DjSetContextValue = {
  tracks: DjSetTrack[];
  current: DjSetTrack | null;
  index: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  ready: boolean;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  playNext: () => void;
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dj-set/tracks");
        if (!res.ok) {
          if (!cancelled) setReady(true);
          return;
        }
        const json = (await res.json()) as { tracks?: DjSetTrack[] };
        if (!cancelled) {
          const list = json.tracks ?? [];
          setTracks(list);
          tracksRef.current = list;
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
    });
  }, []);

  const loadIndex = useCallback((nextIndex: number, autoplay: boolean) => {
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
      pauseMusic();
      setIsPlaying(true);
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      setIsPlaying(false);
      audio.pause();
    }
  }, [pauseMusic]);

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
    if (tracks.length === 0) return;
    const audio = audioRef.current;
    const track = tracks[index];
    if (!audio || !track) return;
    if (audio.src !== track.audio_url) {
      audio.src = track.audio_url;
      audio.load();
    }
  }, [tracks, index]);

  const play = useCallback(() => {
    if (tracksRef.current.length === 0) return;
    notifyDjTakeover();
    pauseMusic();
    setIsPlaying(true);
    void audioRef.current?.play().catch(() => setIsPlaying(false));
  }, [pauseMusic]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const playNext = useCallback(() => {
    loadIndex(indexRef.current + 1, true);
  }, [loadIndex]);

  const current = tracks[index] ?? null;

  const value: DjSetContextValue = {
    tracks,
    current,
    index,
    isPlaying,
    currentTime,
    duration,
    ready,
    toggle,
    play,
    pause,
    playNext,
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
