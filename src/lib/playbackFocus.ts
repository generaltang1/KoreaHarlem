/** DJ SET ↔ MUSIC 하단 플레이어 상호 배타 재생용 가벼운 이벤트 버스 */

type Listener = () => void;

const musicTakeoverListeners = new Set<Listener>();
const djTakeoverListeners = new Set<Listener>();

export function onMusicTakeover(listener: Listener): () => void {
  musicTakeoverListeners.add(listener);
  return () => musicTakeoverListeners.delete(listener);
}

export function notifyMusicTakeover() {
  musicTakeoverListeners.forEach((fn) => fn());
}

export function onDjTakeover(listener: Listener): () => void {
  djTakeoverListeners.add(listener);
  return () => djTakeoverListeners.delete(listener);
}

export function notifyDjTakeover() {
  djTakeoverListeners.forEach((fn) => fn());
}
