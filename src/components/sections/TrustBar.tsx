import { Check } from "lucide-react";
import { getTrustBar } from "@/lib/content-repository";

export async function TrustBar() {
  const items = await getTrustBar();
  return (
    <div className="border-line border-y bg-white/50 py-4">
      <div className="mask-fade-x overflow-hidden">
        <div className="flex w-max animate-[marquee_32s_linear_infinite] gap-8 pr-8">
          {[...items, ...items].map((item, i) => (
            <span
              key={i}
              className="text-ink-soft flex shrink-0 items-center gap-2 text-sm font-medium"
            >
              <Check width={16} height={16} className="text-accent" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
