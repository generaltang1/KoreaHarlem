"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NaverMapInstance, NaverMarker } from "@/types/naver-maps";

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? "";

type LatLng = { lat: number; lng: number };

type NaverMapProps = {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
  /** Admin: 클릭/드래그로 좌표 변경 */
  interactive?: boolean;
  onChange?: (pos: LatLng) => void;
  heightClassName?: string;
};

function loadNaverReady(): Promise<NonNullable<Window["naver"]>> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("window unavailable"));
      return;
    }
    if (window.naver?.maps) {
      resolve(window.naver);
      return;
    }
    const started = Date.now();
    const tick = () => {
      if (window.naver?.maps) {
        resolve(window.naver);
        return;
      }
      if (Date.now() - started > 12000) {
        reject(new Error("Naver Maps timeout"));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

export function NaverMap({
  lat,
  lng,
  zoom = 16,
  className = "",
  interactive = false,
  onChange,
  heightClassName = "h-[280px] sm:h-[360px]",
}: NaverMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markerRef = useRef<NaverMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const syncMarker = useCallback(
    async (nextLat: number, nextLng: number) => {
      try {
        const naver = await loadNaverReady();
        const el = containerRef.current;
        if (!el) return;
        const center = new naver.maps.LatLng(nextLat, nextLng);
        if (!mapRef.current) {
          mapRef.current = new naver.maps.Map(el, {
            center,
            zoom,
            zoomControl: true,
            scaleControl: false,
            mapDataControl: false,
          });
          markerRef.current = new naver.maps.Marker({
            position: center,
            map: mapRef.current,
            draggable: interactive,
          });
          if (interactive) {
            naver.maps.Event.addListener(mapRef.current, "click", (e) => {
              const coord = e.coord ?? e.latlng;
              if (!coord) return;
              const p = { lat: coord.lat(), lng: coord.lng() };
              markerRef.current?.setPosition(new naver.maps.LatLng(p.lat, p.lng));
              onChangeRef.current?.(p);
            });
            if (markerRef.current) {
              naver.maps.Event.addListener(markerRef.current, "dragend", () => {
                const pos = markerRef.current?.getPosition();
                if (!pos) return;
                onChangeRef.current?.({ lat: pos.lat(), lng: pos.lng() });
              });
            }
          }
        } else {
          mapRef.current.setCenter(center);
          markerRef.current?.setPosition(center);
        }
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "지도 로드 실패");
      }
    },
    [interactive, zoom],
  );

  useEffect(() => {
    if (!CLIENT_ID) {
      setError("NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 미설정");
      return;
    }
    if (!scriptReady && !window.naver?.maps) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    void syncMarker(lat, lng);
  }, [lat, lng, scriptReady, syncMarker]);

  if (!CLIENT_ID) {
    return (
      <div
        className={`${heightClassName} flex items-center justify-center rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] text-center text-xs text-[#a8a49b] ${className}`}
      >
        지도 영역
        <br />
        <span className="mt-1 block text-[10px] text-[#6e6b65]">
          NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 를 설정하세요
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${CLIENT_ID}&submodules=geocoder`}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setError("네이버 지도 스크립트 로드 실패")}
      />
      <div
        ref={containerRef}
        className={`${heightClassName} w-full overflow-hidden rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[#151515]`}
      />
      {error ? (
        <p className="mt-2 text-[11px] text-rose-400">{error}</p>
      ) : null}
      {interactive ? (
        <p className="mt-2 text-[11px] text-[#6e6b65]">
          지도를 클릭하거나 마커를 드래그해 위치를 지정하세요.
        </p>
      ) : null}
    </div>
  );
}

export function hasNaverMapKey(): boolean {
  return Boolean(CLIENT_ID);
}
