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
    // Ex.: /passagens/v3/busca/SSA/GIG?dates=2027-02-12&dates=2027-02-19&cabin=economy
    // Um "dates" para a ida e outro para a volta. A URL de exemplo não tinha passageiros.
    prefilled: true,
    buildUrl: (s) => {
      const params = new URLSearchParams();
      params.append("dates", s.departure);
      if (s.returnDate) params.append("dates", s.returnDate);
      params.set("cabin", "economy");
      return `https://www.cvc.com.br/passagens/v3/busca/${s.origin}/${s.destination}?${params}`;
    },
  },
];
