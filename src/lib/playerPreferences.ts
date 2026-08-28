const VOLUME_KEY = "korea-harlem-player-volume";
const MUTED_KEY = "korea-harlem-player-muted";
const SHUFFLE_KEY = "korea-harlem-player-shuffle";
const REPEAT_MODE_KEY = "korea-harlem-player-repeat-mode";

export type RepeatMode = "off" | "all" | "one";

export type PlayerPreferences = {
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
};

const DEFAULTS: PlayerPreferences = {
  volume: 0.7,
  isMuted: false,
  isShuffle: false,
  repeatMode: "off",
};

function readNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
  } catch {
    return fallback;
  }
}

function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return raw === "1" || raw === "true";
  } catch {
    return fallback;
  }
}

function readRepeatMode(): RepeatMode {
  if (typeof window === "undefined") return DEFAULTS.repeatMode;
  try {
    const raw = localStorage.getItem(REPEAT_MODE_KEY);
    if (raw === "all" || raw === "one" || raw === "off") return raw;
    return DEFAULTS.repeatMode;
  } catch {
    return DEFAULTS.repeatMode;
  }
}

export function loadPlayerPreferences(): PlayerPreferences {
  return {
    volume: readNumber(VOLUME_KEY, DEFAULTS.volume),
    isMuted: readBool(MUTED_KEY, DEFAULTS.isMuted),
    isShuffle: readBool(SHUFFLE_KEY, DEFAULTS.isShuffle),
    repeatMode: readRepeatMode(),
  };
}

export function savePlayerPreferences(patch: Partial<PlayerPreferences>) {
  if (typeof window === "undefined") return;
  try {
    if (patch.volume != null) localStorage.setItem(VOLUME_KEY, String(patch.volume));
    if (patch.isMuted != null) localStorage.setItem(MUTED_KEY, patch.isMuted ? "1" : "0");
    if (patch.isShuffle != null) localStorage.setItem(SHUFFLE_KEY, patch.isShuffle ? "1" : "0");
    if (patch.repeatMode != null) localStorage.setItem(REPEAT_MODE_KEY, patch.repeatMode);
  } catch {
    /* ignore quota / private mode */
  }
}

export function cycleRepeatMode(current: RepeatMode): RepeatMode {
  if (current === "off") return "all";
  if (current === "all") return "one";
  return "off";
}
