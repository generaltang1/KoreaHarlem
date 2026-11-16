export type NaverLatLng = {
  lat: () => number;
  lng: () => number;
};

export type NaverMapInstance = {
  setCenter: (latlng: NaverLatLng) => void;
  setZoom: (zoom: number) => void;
  getCenter: () => NaverLatLng;
};

export type NaverMarker = {
  setPosition: (latlng: NaverLatLng) => void;
  getPosition: () => NaverLatLng;
  setMap: (map: NaverMapInstance | null) => void;
};

declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new (
          el: HTMLElement | string,
          options?: {
            center?: unknown;
            zoom?: number;
            zoomControl?: boolean;
            scaleControl?: boolean;
            mapDataControl?: boolean;
          },
        ) => NaverMapInstance;
        LatLng: new (lat: number, lng: number) => NaverLatLng;
        Marker: new (options: {
          position: NaverLatLng;
          map: NaverMapInstance;
          draggable?: boolean;
        }) => NaverMarker;
        Event: {
          addListener: (
            target: unknown,
            eventName: string,
            handler: (e: { coord?: NaverLatLng; latlng?: NaverLatLng }) => void,
          ) => void;
        };
        Service?: {
          geocode: (
            options: { query: string },
            callback: (
              status: string,
              response: {
                v2?: {
                  addresses?: {
                    x: string;
                    y: string;
                    roadAddress?: string;
                    jibunAddress?: string;
                  }[];
                };
              },
            ) => void,
          ) => void;
          Status?: { OK: string };
        };
      };
    };
    navermap_authFailure?: () => void;
  }
}

export {};
