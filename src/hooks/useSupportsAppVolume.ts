"use client";

import { useEffect, useState } from "react";

const DESKTOP_VOLUME_QUERY = "(pointer: fine) and (hover: hover)";

/** Windows·macOS 등 마우스 PC에서만 true — 모바일·태블릿(터치)에서는 false */
export function useSupportsAppVolume() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_VOLUME_QUERY);
    const update = () => setSupported(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return supported;
}
