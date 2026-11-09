import { placeLabel } from "./airports";

/** "São Paulo (todos)" -> "São Paulo - Todos aeroportos (SAO)", como a CVC exibe. */
function cvcPlaceName(code: string): string {
  const label = placeLabel(code);
  if (label === code) return code;
  return `${label.replace(/\s*\(todos\)$/, " - Todos aeroportos")} (${code})`;
}

export type FlightSearch = {
  origin: string; // IATA
  destination: string; // IATA
  departure: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD (ausente = só ida)
  adults: number;
  children: number;
  infants: number;
};

export type Provider = {
  id: string;
  name: string;
  color: string;
  /** Cor do texto sobre `color`. */
  textColor: string;
  /** true quando a URL já abre os resultados com a busca preenchida. */
  prefilled: boolean;
  buildUrl: (s: FlightSearch) => string;
};

/**
 * CVC e Decolar não oferecem API pública de busca e bloqueiam acesso
 * automatizado. Por isso o site gera links diretos para os resultados
 * de cada agência, sem raspar páginas. Para mostrar preços aqui dentro,
 * seria preciso uma API oficial de afiliados (veja o README).
 */
export const PROVIDERS: Provider[] = [
  {
    id: "decolar",
    name: "Decolar",
    color: "#5c1fa8",
    textColor: "#ffffff",
    prefilled: true,
    buildUrl: (s) => {
      const pax = `${s.adults}/${s.children}/${s.infants}`;
      return s.returnDate
        ? `https://www.decolar.com/shop/flights/results/roundtrip/${s.origin}/${s.destination}/${s.departure}/${s.returnDate}/${pax}`
        : `https://www.decolar.com/shop/flights/results/oneway/${s.origin}/${s.destination}/${s.departure}/${pax}`;
    },
  },
  {
    id: "cvc",
    name: "CVC",
    color: "#ffcc00",
    textColor: "#1e293b",
    // Formato não documentado, copiado da URL de resultados do site da CVC.
    // Ex.: /passagens/v2/search/SAO/BSB?fType=roundtrip&CLA=all&ADT=3&CHD=0&INF=0
    //   &MCO1=São+Paulo+-+Todos+aeroportos+(SAO)&MCD1=Brasília+(BSB)
    //   &Date1=2026-12-07&STO=PACKAGE&Date2=2027-01-29
    // MCO1/MCD1 são os nomes exibidos na busca; Date2 só existe em ida e volta.
    prefilled: true,
    buildUrl: (s) => {
      const params = new URLSearchParams({
        fType: s.returnDate ? "roundtrip" : "oneway",
        CLA: "all",
        ADT: String(s.adults),
        CHD: String(s.children),
        INF: String(s.infants),
        MCO1: cvcPlaceName(s.origin),
        MCD1: cvcPlaceName(s.destination),
        Date1: s.departure,
        STO: "PACKAGE",
      });
      if (s.returnDate) params.set("Date2", s.returnDate);
      return `https://www.cvc.com.br/passagens/v2/search/${s.origin}/${s.destination}?${params}`;
    },
  },
];
