"use client";

import { useEffect, useRef, useState } from "react";

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

/** Data local em YYYY-MM-DD (toISOString usaria UTC e erraria o dia perto da meia-noite). */
export function toIso(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function fromIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "12 fev" */
function shortDate(iso: string) {
  const d = fromIso(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** Dias do mês com espaços vazios no início para alinhar ao dia da semana. */
function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) cells.push(toIso(new Date(year, month, d)));
  return cells;
}

type Props = {
  roundTrip: boolean;
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
};

export default function DateRangePicker({ roundTrip, start, end, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState("");
  const base = start ? fromIso(start) : new Date();
  const [view, setView] = useState({ y: base.getFullYear(), m: base.getMonth() });
  const ref = useRef<HTMLDivElement>(null);
  const today = toIso(new Date());

  // Fecha ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (!open && start) {
      const d = fromIso(start);
      setView({ y: d.getFullYear(), m: d.getMonth() });
    }
    setOpen((v) => !v);
  }

  // Ida e volta: 1º clique marca a ida, 2º a volta. Só ida: um clique e fecha.
  function pick(iso: string) {
    if (!roundTrip) {
      onChange(iso, "");
      setOpen(false);
    } else if (!start || end || iso < start) {
      onChange(iso, "");
    } else {
      onChange(start, iso);
      setOpen(false);
    }
  }

  function shift(delta: number) {
    setView(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  // Volta "provisória" enquanto o mouse passa pelos dias, para mostrar o intervalo.
  const rangeEnd = end || (roundTrip && start && hover > start ? hover : "");
  const choosingReturn = roundTrip && start && !end;

  let label = "Quando?";
  if (start) label = roundTrip ? `${shortDate(start)} – ${end ? shortDate(end) : "volta?"}` : shortDate(start);

  const canGoBack = view.y > new Date().getFullYear() || view.m > new Date().getMonth();

  function renderMonth(offset: number) {
    const d = new Date(view.y, view.m + offset, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    return (
      <div className={offset ? "hidden sm:block" : ""}>
        <div className="mb-2 text-center text-sm font-semibold capitalize text-slate-800">
          {MONTHS[m]} {y}
        </div>
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400">
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="py-1">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7" onMouseLeave={() => setHover("")}>
          {monthCells(y, m).map((iso, i) => {
            if (!iso) return <div key={i} />;
            const past = iso < today;
            const isEdge = iso === start || iso === rangeEnd;
            const inRange = !!(start && rangeEnd && iso > start && iso < rangeEnd);
            return (
              <div
                key={iso}
                className={`flex justify-center py-0.5 ${inRange ? "bg-sky-50" : ""} ${
                  isEdge && start && rangeEnd && iso === start ? "bg-gradient-to-r from-transparent from-50% to-sky-50 to-50%" : ""
                } ${isEdge && start && rangeEnd && iso === rangeEnd && iso !== start ? "bg-gradient-to-l from-transparent from-50% to-sky-50 to-50%" : ""}`}
              >
                <button
                  type="button"
                  disabled={past}
                  onClick={() => pick(iso)}
                  onMouseEnter={() => setHover(iso)}
                  aria-label={iso.split("-").reverse().join("/")}
                  aria-pressed={isEdge}
                  className={`h-9 w-9 rounded-full text-sm tabular-nums transition ${
                    isEdge
                      ? "bg-sky-600 font-semibold text-white"
                      : past
                        ? "text-slate-300"
                        : `text-slate-700 hover:bg-sky-100 ${iso === today ? "font-bold text-sky-700" : ""}`
                  }`}
                >
                  {Number(iso.slice(8))}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="dates-panel"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 pt-2 pb-1.5 text-left transition hover:border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none"
      >
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {roundTrip ? "Ida e volta" : "Data da ida"}
        </span>
        <span className="flex items-center gap-2 py-1">
          <span aria-hidden className="text-slate-400">📅</span>
          <span className={`truncate text-base ${start ? "font-medium text-slate-900" : "text-slate-400"}`}>{label}</span>
        </span>
      </button>

      {open && (
        <div
          id="dates-panel"
          className="absolute left-0 z-30 lg:right-0 lg:left-auto mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-900/10 sm:w-[38rem]"
        >
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => shift(-1)} disabled={!canGoBack} aria-label="Mês anterior" className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-30">‹</button>
            <span className="text-sm text-slate-500">
              {roundTrip ? (choosingReturn ? "Agora escolha a volta" : "Escolha a ida") : "Escolha a data"}
            </span>
            <button type="button" onClick={() => shift(1)} aria-label="Próximo mês" className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100">›</button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {renderMonth(0)}
            {renderMonth(1)}
          </div>
          {start && (
            <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
              <button type="button" onClick={() => onChange("", "")} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Limpar datas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
