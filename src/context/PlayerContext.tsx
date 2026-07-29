"use client";

import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";

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
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef(0);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

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

  const setTrack = useCallback((track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying((prev) => !prev);
      return;
    }
    loadTrackAtIndex([track], 0);
  }, [currentTrack?.id, loadTrackAtIndex]);

  const playQueue = useCallback((tracks: Track[], startIndex = 0) => {
    if (tracks.length === 0) return;
    const index = Math.min(Math.max(startIndex, 0), tracks.length - 1);
    loadTrackAtIndex(tracks, index);
  }, [loadTrackAtIndex]);

  const playNext = useCallback(() => {
    const nextIndex = queueIndexRef.current + 1;
    if (nextIndex < queueRef.current.length) {
      loadTrackAtIndex(queueRef.current, nextIndex);
    } else {
      setIsPlaying(false);
    }
  }, [loadTrackAtIndex]);

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
  }, [loadTrackAtIndex, audioRef]);

  const play = useCallback(() => {
    audioRef.current?.play();
    setIsPlaying(true);
  }, [audioRef]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, [audioRef]);

  const toggle = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [audioRef]);

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
  }, [audioRef]);

  const hasNext = queueIndex < queue.length - 1;
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
        audioRef,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => playNext()}
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
