"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import type {
  PrintSide,
  ShirtColorId,
  ShirtMockupView,
  Transform,
} from "./mockups";

/**
 * Превью футболки: реалистичный mockup + зона печати, в которой
 * перетаскивается и масштабируется загруженное изображение. Зона всегда видима,
 * чтобы пользователь сразу понимал, куда попадёт принт.
 * Изображение обрабатывается локально (object URL) — на сервер ничего не уходит.
 */
export function TshirtPreview({
  colorId,
  side,
  mockup,
  imageUrl,
  transform,
  onTransformChange,
  onSizeChange,
}: {
  colorId: ShirtColorId;
  side: PrintSide;
  mockup: ShirtMockupView;
  imageUrl: string | null;
  transform: Transform;
  onTransformChange: (t: Transform) => void;
  onSizeChange?: (size: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    px: number;
    py: number;
    ox: number;
    oy: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const darkShirt = colorId === "black";
  const printAreaLabel =
    side === "front" ? "зона печати спереди" : "зона печати на спине";

  useEffect(() => {
    const node = containerRef.current;
    if (!node || !onSizeChange) return;
    let mounted = true;
    let frameId = 0;
    const update = () => {
      if (!mounted) return;
      const width = node.getBoundingClientRect().width;
      frameId = window.requestAnimationFrame(() => {
        if (mounted) onSizeChange(width);
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      mounted = false;
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, [onSizeChange]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!imageUrl) return;
      e.currentTarget.setPointerCapture(e.pointerId);
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
      const limit = 70;
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
    <div ref={containerRef} className="relative mx-auto aspect-square w-full max-w-lg select-none">
      <Image
        src={mockup.image}
        alt={mockup.alt}
        fill
        priority
        sizes="(max-width: 1024px) 92vw, 520px"
        className="object-contain drop-shadow-[0_24px_48px_rgba(21,21,27,0.18)]"
      />

      {/* Зона печати (грудь) */}
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border-2 border-dashed ${
          darkShirt ? "border-white/65 bg-white/5" : "border-ink/35 bg-white/20"
        } ${imageUrl ? "cursor-grab" : ""} ${dragging ? "cursor-grabbing" : ""}`}
        style={{
          left: `${mockup.zone.left}%`,
          top: `${mockup.zone.top}%`,
          width: `${mockup.zone.width}%`,
          height: `${mockup.zone.height}%`,
          touchAction: "none",
        }}
        aria-label={printAreaLabel}
        data-cursor={imageUrl ? "drag" : undefined}
        data-cursor-label={imageUrl ? "Тащи" : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Ваш принт на футболке"
            fill
            unoptimized
            draggable={false}
            className="pointer-events-none object-contain"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transition: dragging ? "none" : "transform 0.12s ease-out",
            }}
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center px-2 text-center text-[11px] leading-tight font-semibold uppercase ${
              darkShirt ? "text-white/75" : "text-ink/50"
            }`}
          >
            зона
            <br />
            печати
          </div>
        )}
      </div>

      {imageUrl && (
        <span
          className={`shadow-soft absolute top-[calc(100%-1.75rem)] left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold ${
            darkShirt ? "bg-ink text-paper" : "text-ink bg-white"
          }`}
        >
          Перетащите принт внутри рамки
        </span>
      )}
    </div>
  );
}
