"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, MapPin } from "lucide-react";
import { getMapsBrowserEnv } from "@/lib/supabase/env";

type Coordinates = {
  lat: number;
  lon: number;
};

type YMapInstance = {
  destroy: () => void;
  setLocation: (location: { center: [number, number]; zoom: number; duration?: number }) => void;
  addChild: (child: unknown) => void;
};

type YMaps3 = {
  ready: Promise<void>;
  YMap: new (
    element: HTMLElement,
    props: {
      location: {
        center: [number, number];
        zoom: number;
      };
    }
  ) => YMapInstance;
  YMapDefaultSchemeLayer: new () => unknown;
  YMapDefaultFeaturesLayer: new () => unknown;
};

declare global {
  interface Window {
    ymaps3?: YMaps3;
  }
}

function loadYandexMapsV3(apiKey: string) {
  return new Promise<YMaps3>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("window_unavailable"));
      return;
    }

    if (window.ymaps3) {
      resolve(window.ymaps3);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-yandex-maps-v3="true"]');

    if (existing) {
      existing.addEventListener("load", () => {
        if (window.ymaps3) {
          resolve(window.ymaps3);
        } else {
          reject(new Error("yandex_not_available"));
        }
      });
      existing.addEventListener("error", () => reject(new Error("yandex_script_failed")));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    script.dataset.yandexMapsV3 = "true";
    script.onload = () => {
      if (window.ymaps3) {
        resolve(window.ymaps3);
      } else {
        reject(new Error("yandex_not_available"));
      }
    };
    script.onerror = () => reject(new Error("yandex_script_failed"));
    document.head.appendChild(script);
  });
}

export function LocationMapPreview({ query }: { query: string }) {
  const yandexMapsApiKey = getMapsBrowserEnv().yandexMapsApiKey;
  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = React.useRef<YMapInstance | null>(null);
  const [provider, setProvider] = React.useState<"yandex" | "osm">(yandexMapsApiKey ? "yandex" : "osm");
  const [coordinates, setCoordinates] = React.useState<Coordinates | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [yandexStatus, setYandexStatus] = React.useState<"idle" | "loading" | "ready" | "failed">("idle");

  React.useEffect(() => {
    const normalized = query.trim();

    if (normalized.length < 2) {
      setCoordinates(null);
      setFailed(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setFailed(false);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=ru&q=${encodeURIComponent(normalized)}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json"
            }
          }
        );

        if (!response.ok) {
          throw new Error("geocode_failed");
        }

        const results = (await response.json()) as Array<{ lat: string; lon: string }>;
        const match = results[0];

        if (!match) {
          setCoordinates(null);
          setFailed(true);
          return;
        }

        setCoordinates({
          lat: Number(match.lat),
          lon: Number(match.lon)
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setCoordinates(null);
          setFailed(true);
        }
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  React.useEffect(() => {
    if (provider !== "yandex" || !yandexMapsApiKey || !coordinates || !mapRef.current) {
      return;
    }

    let active = true;
    const container = mapRef.current;
    setYandexStatus("loading");

    void loadYandexMapsV3(yandexMapsApiKey)
      .then(async (ymaps3) => {
        await ymaps3.ready;

        if (!active) {
          return;
        }

        const center: [number, number] = [coordinates.lon, coordinates.lat];

        if (!mapInstanceRef.current) {
          const map = new ymaps3.YMap(container, {
            location: {
              center,
              zoom: 12
            }
          });

          map.addChild(new ymaps3.YMapDefaultSchemeLayer());
          mapInstanceRef.current = map;
          setYandexStatus("ready");
          return;
        }

        mapInstanceRef.current.setLocation({
          center,
          zoom: 12,
          duration: 250
        });
        setYandexStatus("ready");
      })
      .catch(() => {
        setFailed(true);
        setYandexStatus("failed");
      });

    return () => {
      active = false;
    };
  }, [coordinates, provider, yandexMapsApiKey]);

  React.useEffect(() => {
    if (!yandexMapsApiKey && provider === "yandex") {
      setProvider("osm");
    }
  }, [provider, yandexMapsApiKey]);

  React.useEffect(() => {
    return () => {
      mapInstanceRef.current?.destroy();
      mapInstanceRef.current = null;
    };
  }, []);

  if (loading && !coordinates) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border bg-background text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Ищу место на карте
      </div>
    );
  }

  const canUseYandex = Boolean(yandexMapsApiKey);

  if (provider === "yandex" && canUseYandex && query.trim().length >= 2) {
    const yandexExternalSrc = `https://yandex.ru/maps/?text=${encodeURIComponent(query)}`;

    return (
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setProvider("yandex")}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            Яндекс Карты
          </button>
          <button
            type="button"
            onClick={() => setProvider("osm")}
            className="rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground"
          >
            OpenStreetMap
          </button>
        </div>
        <div className="overflow-hidden rounded-lg border bg-background">
          <div ref={mapRef} className="h-56 w-full bg-muted" />
          <div className="flex items-center justify-between gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
            <span>
              Карта: Яндекс Карты
              {yandexStatus === "loading" ? " · загружается" : null}
              {yandexStatus === "ready" ? " · готово" : null}
              {yandexStatus === "failed" ? " · не удалось загрузить" : null}
            </span>
            <Link href={yandexExternalSrc} target="_blank" rel="noreferrer" className="font-medium text-primary">
              Открыть на карте
            </Link>
          </div>
        </div>
        {yandexStatus === "failed" ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900 dark:border-yellow-500/40 dark:bg-yellow-500/15 dark:text-yellow-100">
            Яндекс.Карты не загрузились. Проверь, что ключ активировался, прошло хотя бы 15 минут после выпуска и для ключа разрешен HTTP Referer для `localhost`.
          </div>
        ) : null}
      </div>
    );
  }

  if (!coordinates) {
    return (
      <div className="surface-grid flex h-56 items-center justify-center rounded-lg border bg-background p-6 text-center">
        <div className="grid gap-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <p className="font-semibold">{query.trim() || "Укажите город или адрес"}</p>
          <p className="text-sm text-muted-foreground">
            {failed ? "Не удалось точно найти точку. Попробуйте указать город, улицу или район." : "Карта появится после ввода локации."}
          </p>
        </div>
      </div>
    );
  }

  const delta = 0.035;
  const bbox = [
    coordinates.lon - delta,
    coordinates.lat - delta,
    coordinates.lon + delta,
    coordinates.lat + delta
  ].join("%2C");
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lon}`;
  const externalSrc = `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lon}#map=13/${coordinates.lat}/${coordinates.lon}`;

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {canUseYandex ? (
          <button
            type="button"
            onClick={() => setProvider("yandex")}
            className="rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground"
          >
            Яндекс Карты
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setProvider("osm")}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          OpenStreetMap
        </button>
      </div>
      <div className="overflow-hidden rounded-lg border bg-background">
        <iframe
          title={`Карта для ${query}`}
          src={embedSrc}
          className="h-56 w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="flex items-center justify-between gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
          <span>Карта: OpenStreetMap</span>
          <Link href={externalSrc} target="_blank" rel="noreferrer" className="font-medium text-primary">
            Открыть на карте
          </Link>
        </div>
      </div>
    </div>
  );
}
