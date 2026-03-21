# Mapa no Expo (React Native) — `GET /establishments/map-bounds`

Este guia combina com o novo endpoint do backend que **filtra estabelecimentos no Postgres** pelo retângulo visível do mapa, em vez de carregar todos os pins ou só “raio fixo” sem relação com o viewport.

---

## 1. Endpoint

```
GET /establishments/map-bounds?swLat=...&swLng=...&neLat=...&neLng=...[&centerLat=...&centerLng=...][&limit=120]
```

| Query | Obrigatório | Descrição |
|-------|-------------|-----------|
| `swLat`, `swLng` | Sim | Canto **south-west** do mapa (pode ser qualquer diagonal; o backend normaliza min/max). |
| `neLat`, `neLng` | Sim | Canto **north-east**. |
| `centerLat`, `centerLng` | Não | Ex.: GPS do usuário. Se os dois vierem, a lista vem **ordenada por distância** e cada item inclui **`distanceKm`**. |
| `limit` | Não | Máximo de resultados (1–250, default **120**). |

**Auth:** mesmo padrão do app — header `Authorization: Bearer <accessToken>`.

**Erro 400:** retângulo maior que **8°** em latitude ou longitude → peça ao usuário dar **zoom** (protege o servidor).

**Resposta:** array JSON com os campos do estabelecimento + opcionalmente `distanceKm`.

---

## 2. Obter os cantos do mapa (`react-native-maps`)

No `MapView`, use **`onRegionChangeComplete`** (não `onRegionChange` a cada frame — isso evita flicker e excesso de requests).

`region` devolve:

- `latitude`, `longitude` — centro  
- `latitudeDelta`, `longitudeDelta` — “largura” da área em graus  

Cantos aproximados:

```ts
const halfLat = region.latitudeDelta / 2;
const halfLng = region.longitudeDelta / 2;
const swLat = region.latitude - halfLat;
const neLat = region.latitude + halfLat;
const swLng = region.longitude - halfLng;
const neLng = region.longitude + halfLng;
```

Envie esses quatro valores na query string do `GET map-bounds`.

**GPS como centro (opcional):** se tiver `userLocation.coords.latitude/longitude`, passe como `centerLat` e `centerLng` para ordenação e `distanceKm`.

---

## 3. Fluxo recomendado no app (performance + menos piscar)

1. **Debounce** após `onRegionChangeComplete` (ex.: **400–800 ms**) antes de chamar a API.  
2. **Margem (histerese):** opcionalmente expandir o retângulo em ~15–25% antes de buscar, para pins não sumirem na borda ao micro-mover o mapa.  
3. **Merge de markers:** manter um `Map` por `id`. Ao chegar a resposta nova:
   - **adicionar** ids novos;
   - **remover** só os que saíram do critério (ou fora de um retângulo levemente maior), em vez de `setMarkers([])` e substituir tudo de uma vez.  
4. **`key={String(item.id)}`** em cada `Marker`.  
5. Ícone customizado: após carregar, em Android costuma ajudar **`tracksViewChanges={false}`** no `Marker` (quando aplicável à tua versão).  
6. Muitos pins: considerar **clustering** (`supercluster` + markers agregados).

---

## 4. Exemplo de fetch (pseudo-código)

```ts
const params = new URLSearchParams({
  swLat: String(swLat),
  swLng: String(swLng),
  neLat: String(neLat),
  neLng: String(neLng),
  limit: '120',
});
if (userLat != null && userLng != null) {
  params.set('centerLat', String(userLat));
  params.set('centerLng', String(userLng));
}

const res = await fetch(`${API_URL}/establishments/map-bounds?${params}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const data = await res.json();
// data: EstablishmentMapItemJson[]
```

Use `expo-constants` / env para `API_URL`.

---

## 5. Relação com `GET /establishments/near`

- **`near`:** círculo em torno de um ponto (lat/lng + `radiusKm`). No backend, agora também **pré-filtra por caixa** antes do Haversine (melhor que carregar a tabela inteira).  
- **`map-bounds`:** alinhado ao **retângulo da câmera** — é o fluxo certo para mapa que pan/zoom.

Para o teu caso (pins conforme a área visível), **priorize `map-bounds`**.

---

## 6. Checklist rápido

- [ ] Migrar o app de “listar tudo” ou só `near` fixo para **`map-bounds`** com região do mapa.  
- [ ] `onRegionChangeComplete` + debounce.  
- [ ] Merge por `id` + keys estáveis.  
- [ ] Tratar 400 “área muito grande” (toast pedindo zoom).  
- [ ] Rodar `npx prisma migrate deploy` no backend para criar o **índice** `(latitude, longitude)`.

---

*Backend: `EstablishmentController` → `GET establishments/map-bounds`.*
