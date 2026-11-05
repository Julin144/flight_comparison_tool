export type Place = { code: string; label: string };

// Códigos IATA de cidade (agrupam aeroportos) ou de aeroporto.
export const PLACES: Place[] = [
  { code: "SAO", label: "São Paulo (todos)" },
  { code: "RIO", label: "Rio de Janeiro (todos)" },
  { code: "BSB", label: "Brasília" },
  { code: "BHZ", label: "Belo Horizonte (todos)" },
  { code: "SSA", label: "Salvador" },
  { code: "REC", label: "Recife" },
  { code: "FOR", label: "Fortaleza" },
  { code: "NAT", label: "Natal" },
  { code: "MCZ", label: "Maceió" },
  { code: "JPA", label: "João Pessoa" },
  { code: "AJU", label: "Aracaju" },
  { code: "POA", label: "Porto Alegre" },
  { code: "CWB", label: "Curitiba" },
  { code: "FLN", label: "Florianópolis" },
  { code: "IGU", label: "Foz do Iguaçu" },
  { code: "GYN", label: "Goiânia" },
  { code: "CGB", label: "Cuiabá" },
  { code: "CGR", label: "Campo Grande" },
  { code: "MAO", label: "Manaus" },
  { code: "BEL", label: "Belém" },
  { code: "SLZ", label: "São Luís" },
  { code: "THE", label: "Teresina" },
  { code: "VIX", label: "Vitória" },
  { code: "FEN", label: "Fernando de Noronha" },
  { code: "PSS", label: "Porto Seguro" },
  { code: "BUE", label: "Buenos Aires (todos)" },
  { code: "SCL", label: "Santiago" },
  { code: "MVD", label: "Montevidéu" },
  { code: "LIM", label: "Lima" },
  { code: "BOG", label: "Bogotá" },
  { code: "CUN", label: "Cancún" },
  { code: "MIA", label: "Miami" },
  { code: "ORL", label: "Orlando (todos)" },
  { code: "NYC", label: "Nova York (todos)" },
  { code: "LIS", label: "Lisboa" },
  { code: "OPO", label: "Porto" },
  { code: "MAD", label: "Madri" },
  { code: "BCN", label: "Barcelona" },
  { code: "PAR", label: "Paris (todos)" },
  { code: "ROM", label: "Roma (todos)" },
  { code: "LON", label: "Londres (todos)" },
];

export function placeLabel(code: string): string {
  return PLACES.find((p) => p.code === code)?.label ?? code;
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(.*?\)/g, "")
    .toLowerCase()
    .trim();

/**
 * Aceita "SAO", "sao", "São Paulo", "sao paulo", "Lisboa" ou
 * "São Paulo (todos) – SAO" e devolve o código IATA.
 */
export function parsePlace(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // "Qualquer coisa – XXX" (opção da lista) ou só "XXX".
  const suffix = trimmed.match(/[–-]\s*([A-Za-z]{3})$/);
  if (suffix) return suffix[1].toUpperCase();

  const q = normalize(trimmed);
  const byName =
    PLACES.find((p) => normalize(p.label) === q) ??
    PLACES.find((p) => normalize(p.label).startsWith(q) && q.length >= 3);
  if (byName) return byName.code;

  if (/^[A-Za-z]{3}$/.test(trimmed)) return trimmed.toUpperCase();
  return null;
}
