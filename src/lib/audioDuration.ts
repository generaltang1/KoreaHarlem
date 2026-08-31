const CACHE_KEY = "kh-track-durations";

export function readDurationCache(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeCache(entries: Record<string, number>) {
  if (typeof window === "undefined" || Object.keys(entries).length === 0) return;
  try {
    const prev = readDurationCache();
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...prev, ...entries }));
  } catch {
    // ignore quota errors
  }
}

/** 오디오 URL에서 재생 시간(초)을 읽습니다. */
export function loadDurationFromUrl(url: string, timeoutMs = 12_000): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = new Audio();
    let settled = false;

    const finish = (value: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("error", onError);
      audio.src = "";
      resolve(value);
    };

    const onLoaded = () => {
      const sec = audio.duration;
      finish(sec && isFinite(sec) ? Math.round(sec) : null);
    };

    const onError = () => finish(null);

    const timer = setTimeout(() => finish(null), timeoutMs);

    audio.preload = "metadata";
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("error", onError);
    audio.src = url;
  });
}

/** 로컬 오디오 파일에서 재생 시간(초)을 읽습니다. */
export async function loadDurationFromFile(file: File): Promise<number | null> {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await loadDurationFromUrl(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** 여러 트랙 duration을 병렬로 읽고 sessionStorage에 캐시합니다. */
export async function loadTrackDurations(
  tracks: { id: string; audio_url: string }[],
): Promise<Record<string, number>> {
  const cache = readDurationCache();
  const result: Record<string, number> = {};
  const pending: { id: string; audio_url: string }[] = [];

  for (const track of tracks) {
    const cached = cache[track.id];
    if (cached) {
      result[track.id] = cached;
      continue;
    }
    pending.push(track);
  }

  if (pending.length > 0) {
    const loaded = await Promise.all(
      pending.map(async (track) => {
        const duration = await loadDurationFromUrl(track.audio_url);
        return [track.id, duration] as const;
      }),
    );

    const toCache: Record<string, number> = {};
    for (const [id, duration] of loaded) {
      if (duration) {
        result[id] = duration;
        toCache[id] = duration;
      }
    }
    writeCache(toCache);
  }

  return result;
}
