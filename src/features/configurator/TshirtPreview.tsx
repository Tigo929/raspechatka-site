"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";

interface Transform {
  x: number;
  y: number;
  scale: number;
}

/**
 * Превью футболки: SVG-силуэт нужного цвета + зона печати, в которой
 * перетаскивается и масштабируется загруженное изображение.
 * Изображение обрабатывается локально (object URL) — на сервер ничего не уходит.
 */
export function TshirtPreview({
  color,
  imageUrl,
  transform,
  onTransformChange,
}: {
  color: string;
  imageUrl: string | null;
  transform: Transform;
  onTransformChange: (t: Transform) => void;
}) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);

  // Светлым принтам — тёмный текст подсказки, и наоборот.
  const isLight = isLightColor(color);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!imageUrl) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      drag.current = {
        px: e.clientX,
        py: e.clientY,
        ox: transform.x,
        oy: transform.y,
      };
      setDragging(true);
    },
    [imageUrl, transform.x, transform.y],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current) return;
      const dx = e.clientX - drag.current.px;
      const dy = e.clientY - drag.current.py;
      // Ограничиваем перемещение в пределах зоны печати.
      const limit = 60;
      const clamp = (v: number) => Math.max(-limit, Math.min(limit, v));
      onTransformChange({
        ...transform,
        x: clamp(drag.current.ox + dx),
        y: clamp(drag.current.oy + dy),
      });
    },
    [onTransformChange, transform],
  );

  const endDrag = useCallback(() => {
    drag.current = null;
    setDragging(false);
  }, []);

  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md select-none">
      <svg
        viewBox="0 0 400 500"
        className="h-full w-full drop-shadow-[0_24px_48px_rgba(21,21,27,0.18)]"
        aria-label="Превью футболки"
      >
        <defs>
          <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {/* Силуэт футболки */}
        <path
          d="M150 40 L110 60 L40 110 L70 170 L110 150 L110 460 L290 460 L290 150 L330 170 L360 110 L290 60 L250 40 C235 70 165 70 150 40 Z"
          fill={color}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="2"
          style={{ transition: "fill 0.35s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <path
          d="M150 40 L110 60 L40 110 L70 170 L110 150 L110 460 L290 460 L290 150 L330 170 L360 110 L290 60 L250 40 C235 70 165 70 150 40 Z"
          fill="url(#shade)"
        />
        {/* Воротник */}
        <path
          d="M150 40 C165 70 235 70 250 40"
          fill="none"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="3"
        />
      </svg>

      {/* Зона печати (грудь) */}
      <div
        ref={zoneRef}
        className="absolute left-1/2 top-[34%] aspect-[3/4] w-[40%] -translate-x-1/2 overflow-hidden rounded-md"
        style={{ touchAction: "none" }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Ваш принт на футболке"
            fill
            unoptimized
            draggable={false}
            data-cursor="drag"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={`object-contain ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transition: dragging ? "none" : "transform 0.12s ease-out",
            }}
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center rounded-md border border-dashed text-center text-[11px] leading-tight ${
              isLight
                ? "border-black/20 text-black/40"
                : "border-white/30 text-white/50"
            }`}
          >
            зона
            <br />
            печати
          </div>
        )}
      </div>
    </div>
  );
}

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // Относительная яркость
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}
