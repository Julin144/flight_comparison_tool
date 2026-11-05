# Busca de passagens: CVC + Decolar

Faça uma busca só (origem, destino, datas, passageiros) e abra os resultados nos dois sites.

```bash
npm install
npm run dev   # http://localhost:3000
```

## Como funciona

CVC e Decolar não têm API pública de busca e bloqueiam acesso automatizado (HTTP 403),
então o site **não raspa** as páginas delas. Ele gera links diretos de busca:

- **Decolar**: abre os resultados já preenchidos
  (`/shop/flights/results/roundtrip/ORIGEM/DESTINO/IDA/VOLTA/adultos/criancas/bebes`).
- **CVC**: abre os resultados já preenchidos
  (`/passagens/v3/busca/ORIGEM/DESTINO?dates=IDA&dates=VOLTA&cabin=economy`).
  O formato não é documentado; se a CVC mudar, copie a URL de um resultado em cvc.com.br
  e ajuste `buildUrl` em `src/lib/providers.ts`.

Para mostrar preços dentro do site, use uma API oficial (programa de afiliados das agências,
ou APIs de voos como Amadeus/Duffel) e adicione um provider em `src/lib/providers.ts`.

## Observações

- `overrides.magic-string = 0.30.17` no `package.json` faz o Tailwind 4 funcionar no Node 22.5.
  Atualizando para Node ≥ 22.12, esse override pode ser removido.
- Cidades e aeroportos ficam em `src/lib/airports.ts`. Também dá para digitar qualquer código IATA.
