import { Check } from "lucide-react";

export const formCardClass =
  "border-line shadow-soft rounded-3xl border bg-white p-6 sm:p-8";
export const fieldLabelClass = "text-ink text-sm font-semibold";
export const inputClass =
  "border-line focus:border-accent bg-paper text-ink h-12 rounded-2xl border px-4 outline-none transition-colors";
export const textareaClass =
  "border-line focus:border-accent bg-paper text-ink resize-none rounded-2xl border px-4 py-3 outline-none transition-colors";

export function SubmissionSuccess({
  title,
  description,
  referenceLabel,
  reference,
  onDone,
}: {
  title: string;
  description: string;
  referenceLabel?: string;
  reference: string | null;
  onDone?: () => void;
}) {
  return (
    <div className={`${formCardClass} text-center`}>
      <span className="bg-accent mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white">
        <Check width={28} height={28} strokeWidth={3} />
      </span>
      <h3 className="font-display text-ink mt-4 text-xl font-bold">{title}</h3>
      <p className="text-muted mx-auto mt-2 max-w-sm text-sm">{description}</p>
      {reference && referenceLabel && (
        <p className="text-muted mt-3 text-sm">
          {referenceLabel}: <strong className="text-ink">{reference}</strong>
        </p>
      )}
      {onDone && (
        <button
          type="button"
          onClick={onDone}
          className="bg-accent mt-5 w-full rounded-2xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Готово
        </button>
      )}
    </div>
  );
}

export function ContactMethodTabs<T extends string>({
  label,
  options,
  value,
  onChange,
  columnsClass,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  columnsClass: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={fieldLabelClass}>{label}</span>
      <div className={`border-line grid gap-1 rounded-2xl border bg-white p-1 ${columnsClass}`}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-xl py-2 text-sm font-semibold transition-colors ${
              value === option.id ? "bg-ink text-paper" : "text-muted hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FormError({ error }: { error: string | null }) {
  if (!error) return null;

  return (
    <p className="text-accent text-sm" role="alert">
      {error}
    </p>
  );
}

export function SubmissionMeta({
  text,
  urgentText = "Если вопрос срочный, можно сразу написать нам в Telegram после отправки формы.",
}: {
  text: string;
  urgentText?: string;
}) {
  return (
    <div className="text-muted space-y-1 text-xs leading-relaxed">
      <p>{text}</p>
      <p>{urgentText}</p>
    </div>
  );
}
