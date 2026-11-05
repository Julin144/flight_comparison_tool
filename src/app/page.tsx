"use client";

import { useEffect, useRef, useState } from "react";
import { PLACES, parsePlace, placeLabel } from "@/lib/airports";
import { PROVIDERS, type FlightSearch } from "@/lib/providers";
import DateRangePicker from "@/components/DateRangePicker";

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function paxSummary(adults: number, children: number, infants: number) {
  const parts = [plural(adults, "adulto", "adultos")];
  if (children) parts.push(plural(children, "criança", "crianças"));
  if (infants) parts.push(plural(infants, "bebê", "bebês"));
  return parts.join(", ");
}

/** Caixa com o rótulo pequeno em cima e o campo embaixo, no estilo de sites de viagem. */
function Field({ label, htmlFor, icon, children }: { label: string; htmlFor?: string; icon?: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-xl border border-slate-200 bg-white px-3 pt-2 pb-1.5 transition focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 hover:border-slate-300">
      <label htmlFor={htmlFor} className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <div className="flex items-center gap-2">
        {icon && <span aria-hidden className="text-slate-400">{icon}</span>}
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const [roundTrip, setRoundTrip] = useState(true);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [paxOpen, setPaxOpen] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState<FlightSearch | null>(null);
  const [blocked, setBlocked] = useState<string[]>([]);
  const resultsRef = useRef<HTMLElement>(null);
  const paxRef = useRef<HTMLDivElement>(null);

  // Rola até os resultados depois de buscar (no celular eles ficam abaixo da dobra).
  useEffect(() => {
    if (search) resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [search]);

  // Fecha o painel de passageiros ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!paxOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!paxRef.current?.contains(e.target as Node)) setPaxOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPaxOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [paxOpen]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBlocked([]);
    setPaxOpen(false);
    const o = parsePlace(origin);
    const d = parsePlace(destination);
    if (!o) return setError("Não reconheci a origem. Digite o nome da cidade ou o código do aeroporto (ex.: SAO).");
    if (!d) return setError("Não reconheci o destino. Digite o nome da cidade ou o código do aeroporto (ex.: LIS).");
    if (o === d) return setError("Origem e destino precisam ser diferentes.");
    if (!departure) return setError("Escolha a data de ida.");
    if (roundTrip && (!returnDate || returnDate < departure)) return setError("Escolha a data de volta.");
    if (infants > adults) return setError("Cada bebê precisa de um adulto.");
    setSearch({
      origin: o,
      destination: d,
      departure,
      returnDate: roundTrip ? returnDate : undefined,
      adults,
      children,
      infants,
    });
  }

  function swapPlaces() {
    setOrigin(destination);
    setDestination(origin);
  }

  // Abre um site numa janela que ocupa a sua coluna da tela (Decolar à esquerda, CVC à direita).
  // Retorna false se o bloqueador de pop-up impediu.
  function openProvider(id: string) {
    if (!search) return false;
    const i = PROVIDERS.findIndex((p) => p.id === id);
    const { availLeft = 0, availTop = 0, availWidth, availHeight } = window.screen as Screen & {
      availLeft?: number;
      availTop?: number;
    };
    const width = Math.floor(availWidth / PROVIDERS.length);
    const features = `popup,left=${availLeft + i * width},top=${availTop},width=${width},height=${availHeight}`;
    // Sem "noopener" para saber se abriu; o opener é cortado logo em seguida.
    const win = window.open(PROVIDERS[i].buildUrl(search), `voos-${id}`, features);
    if (!win) return false;
    win.opener = null;
    return true;
  }

  // Lado a lado só funciona com janelas abertas pelo site (a aba atual não
  // pode ser movida nem redimensionada). Sem pop-ups liberados, o navegador
  // abre só uma janela por clique: as bloqueadas viram botões, e cada clique
  // abre a próxima já na sua metade da tela.
  function openAll() {
    setBlocked(PROVIDERS.map((p) => p.id).filter((id) => !openProvider(id)));
  }

  function openBlocked(id: string) {
    if (openProvider(id)) setBlocked((ids) => ids.filter((x) => x !== id));
  }

  const bare = "w-full min-w-0 bg-transparent py-1 text-base font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400";
  const textInputProps = { autoComplete: "off", autoCorrect: "off", autoCapitalize: "words", spellCheck: false } as const;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Topo com foto de destino */}
      <header
        className="relative bg-sky-800 bg-cover bg-center pb-40 text-white sm:pb-36"
        style={{ backgroundImage: "url('/hero.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/30 to-slate-950/60" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <nav className="flex items-center gap-2 py-5 text-lg font-bold tracking-tight">
            <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur">✈</span>
            Busca de passagens
          </nav>
          <div className="pt-10 pb-4 sm:pt-16">
            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight drop-shadow sm:text-5xl">
              Para onde vamos dessa vez?
            </h1>
            <p className="mt-3 max-w-lg text-lg text-white/90 drop-shadow">
              Compare CVC e Decolar numa busca só.
            </p>
          </div>
        </div>
      </header>

      <div className="relative mx-auto -mt-32 max-w-5xl px-4 sm:-mt-28 sm:px-6">
        {/* Caixa de busca flutuando sobre a foto */}
        <form onSubmit={onSubmit} className="rounded-2xl bg-white p-4 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/5 sm:p-6">
          <div role="radiogroup" aria-label="Tipo de viagem" className="mb-4 inline-flex rounded-full bg-slate-100 p-1 text-sm font-medium">
            {(
              [
                [true, "Ida e volta"],
                [false, "Só ida"],
              ] as const
            ).map(([val, text]) => (
              <button
                key={text}
                type="button"
                role="radio"
                aria-checked={roundTrip === val}
                onClick={() => setRoundTrip(val)}
                className={`rounded-full px-4 py-1.5 transition ${
                  roundTrip === val ? "bg-white text-sky-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {text}
              </button>
            ))}
          </div>

          <datalist id="places">
            {PLACES.map((p) => (
              <option key={p.code} value={`${p.label} – ${p.code}`} />
            ))}
          </datalist>

          <div className="grid gap-3 lg:grid-cols-12">
            {/* Origem e destino, com botão para inverter */}
            <div className="relative grid gap-3 sm:grid-cols-2 lg:col-span-5">
              <Field label="Origem" htmlFor="origin" icon="🛫">
                <input id="origin" list="places" {...textInputProps} className={bare} placeholder="De onde?" value={origin} onChange={(e) => setOrigin(e.target.value)} />
              </Field>
              <Field label="Destino" htmlFor="destination" icon="🛬">
                <input id="destination" list="places" {...textInputProps} className={bare} placeholder="Para onde?" value={destination} onChange={(e) => setDestination(e.target.value)} />
              </Field>
              <button
                type="button"
                onClick={swapPlaces}
                aria-label="Inverter origem e destino"
                title="Inverter origem e destino"
                className="absolute top-1/2 left-1/2 z-10 hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-sky-700 shadow-sm transition hover:bg-sky-50 sm:flex"
              >
                ⇄
              </button>
            </div>

            <div className="lg:col-span-4">
              <DateRangePicker
                roundTrip={roundTrip}
                start={departure}
                end={returnDate}
                onChange={(a, b) => {
                  setDeparture(a);
                  setReturnDate(b);
                }}
              />
            </div>

            {/* Passageiros: campo compacto que abre um painel com + e − */}
            <div ref={paxRef} className="relative lg:col-span-3">
              <button
                type="button"
                onClick={() => setPaxOpen((v) => !v)}
                aria-expanded={paxOpen}
                aria-controls="pax-panel"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 pt-2 pb-1.5 text-left transition hover:border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none"
              >
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Passageiros</span>
                <span className="flex items-center gap-2 py-1">
                  <span aria-hidden className="text-slate-400">👤</span>
                  <span className="truncate text-base font-medium text-slate-900">{paxSummary(adults, children, infants)}</span>
                  <span aria-hidden className={`ml-auto text-xs text-slate-400 transition ${paxOpen ? "rotate-180" : ""}`}>▼</span>
                </span>
              </button>

              {paxOpen && (
                <div id="pax-panel" className="absolute right-0 left-0 z-20 mt-2 rounded-xl bg-white p-2 shadow-xl ring-1 ring-slate-900/10 sm:left-auto sm:w-80">
                  {(
                    [
                      ["Adultos", "12 anos ou mais", adults, setAdults, 1],
                      ["Crianças", "2 a 11 anos", children, setChildren, 0],
                      ["Bebês", "até 1 ano", infants, setInfants, 0],
                    ] as const
                  ).map(([text, hint, value, set, min]) => (
                    <div key={text} className="flex items-center justify-between px-2 py-2.5">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{text}</div>
                        <div className="text-xs text-slate-500">{hint}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" aria-label={`Diminuir ${text}`} disabled={value <= min} onClick={() => set(value - 1)} className="h-9 w-9 rounded-full border border-slate-300 text-lg text-sky-700 transition hover:border-sky-500 hover:bg-sky-50 disabled:pointer-events-none disabled:opacity-30">−</button>
                        <span className="w-4 text-center font-semibold tabular-nums" aria-live="polite">{value}</span>
                        <button type="button" aria-label={`Aumentar ${text}`} disabled={value >= 9} onClick={() => set(value + 1)} className="h-9 w-9 rounded-full border border-slate-300 text-lg text-sky-700 transition hover:border-sky-500 hover:bg-sky-50 disabled:pointer-events-none disabled:opacity-30">+</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setPaxOpen(false)} className="mt-1 w-full rounded-lg py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50">
                    Pronto
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-orange-500 px-10 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 active:scale-[.99] sm:w-auto"
            >
              Buscar passagens
            </button>
          </div>
        </form>

        {search && (
          <section ref={resultsRef} className="mt-10 scroll-mt-6 pb-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Sua busca</p>
                <h2 className="text-2xl font-bold tracking-tight">
                  {placeLabel(search.origin)} <span className="text-sky-600">→</span> {placeLabel(search.destination)}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {formatDate(search.departure)}
                  {search.returnDate && ` – ${formatDate(search.returnDate)}`} · {paxSummary(search.adults, search.children, search.infants)}
                </p>
              </div>
              {/* Celulares bloqueiam abrir duas abas com um toque: lá ficam só os cards. */}
              <button onClick={openAll} className="hidden rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-sky-500 hover:text-sky-700 sm:inline-block">
                Abrir os dois lado a lado
              </button>
            </div>

            {blocked.length > 0 && (
              <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span>O navegador bloqueou uma janela. Clique para abrir ao lado:</span>
                  {PROVIDERS.filter((p) => blocked.includes(p.id)).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => openBlocked(p.id)}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-700"
                    >
                      Abrir {p.name}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-amber-800">
                  Dica: clique no ícone de pop-up bloqueado na barra de endereço e escolha “Sempre permitir”. Assim os
                  dois abrem lado a lado com um clique só.
                </p>
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {PROVIDERS.map((p) => (
                <a
                  key={p.id}
                  href={p.buildUrl(search)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-extrabold"
                      style={{ background: p.color, color: p.textColor }}
                    >
                      {p.name[0]}
                    </span>
                    <span className="text-xl font-bold">{p.name}</span>
                  </div>
                  <p className="mt-3 flex-1 text-sm text-slate-600">
                    {p.prefilled
                      ? "Abre os resultados com sua busca já preenchida."
                      : "Abre a página de passagens. Refaça a busca lá com os dados acima."}
                  </p>
                  <span
                    className="mt-5 rounded-xl py-2.5 text-center text-sm font-bold transition group-hover:brightness-95"
                    style={{ background: p.color, color: p.textColor }}
                  >
                    Ver ofertas na {p.name} ↗
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        <footer className="py-10 text-center text-xs text-slate-400">
          Os preços e a compra ficam nos sites da CVC e da Decolar.
        </footer>
      </div>
    </main>
  );
}
