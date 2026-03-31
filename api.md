# API — `domzack-chart-lib`

Guia detalhado de uso da API pública usada no exemplo em `public/index.html`.

## 1) Criação do gráfico

```js
const { createChart } = window.DomzackChartLib;

const chart = createChart(document.getElementById("chart"), {
  timeframe: "1m",
  maxCandles: 1000,
  initialVisibleCandles: 100,
  showGrid: true,
  showCrosshair: true,
  showTooltip: true,
  autoFollowMode: "bar",
  rightOffsetCandles: 1.5
});
```

## 2) `ChartOptions`

| Opção | Tipo | Padrão | Descrição |
|---|---|---|---|
| `width` | `number` | auto | Largura do canvas |
| `height` | `number` | auto | Altura do canvas |
| `timeframe` | `Timeframe` | `"1m"` | Timeframe inicial |
| `maxCandles` | `number` | `5000` | Limite de candles na série canônica |
| `initialVisibleCandles` | `number` | `120` | Janela inicial visível |
| `showGrid` | `boolean` | `true` | Mostra/esconde grade |
| `showCrosshair` | `boolean` | `true` | Mostra/esconde crosshair |
| `showTooltip` | `boolean` | `true` | Mostra/esconde tooltip OHLCV |
| `autoFollowMode` | `"bar" \| "tick"` | `"tick"` | Regra de acompanhamento realtime |
| `rightOffsetCandles` | `number` | `1.5` | Espaço vazio à direita |
| `theme` | `Partial<ChartTheme>` | padrão interno | Cores do chart |

## 3) Métodos de `ChartApi`

### `addCandlestickSeries(options?)`

Cria e retorna a API da série (`CandlestickSeriesApi`).

```js
const series = chart.addCandlestickSeries();
```

### `setTimeframe(timeframe)`

Troca o timeframe visual sem perder a série base.

```js
chart.setTimeframe("15m");
```

### `setAutoFollow(enabled)` / `isAutoFollow()`

Liga/desliga o autofollow do último candle.

```js
chart.setAutoFollow(true);
const enabled = chart.isAutoFollow();
```

### `setAutoFollowMode(mode)` / `getAutoFollowMode()`

Define/obtém o modo de autofollow:
- `"tick"`: acompanha a cada update
- `"bar"`: acompanha quando abre novo candle

```js
chart.setAutoFollowMode("bar");
const mode = chart.getAutoFollowMode();
```

### `setRightOffsetCandles(value)` / `getRightOffsetCandles()`

Controla o deslocamento à direita da última barra.

```js
chart.setRightOffsetCandles(2);
const offset = chart.getRightOffsetCandles();
```

### `onCandleClick(handler)`

Dispara callback ao clicar em candle.

```js
const unsubscribe = chart.onCandleClick(({ candle, index }) => {
  console.log(index, candle.close);
});

// depois
unsubscribe();
```

### `onRangeSelect(handler)`

Dispara callback ao selecionar intervalo com Shift+click ou Shift+arraste.

```js
chart.onRangeSelect(({ candles, from, to, fromIndex, toIndex }) => {
  console.log(candles.length, fromIndex, toIndex, from.time, to.time);
});
```

### `timeScale().fitContent()`

Reposiciona no conteúdo final e ativa autofollow.

```js
chart.timeScale().fitContent();
```

### `destroy()`

Remove canvas e listeners.

```js
chart.destroy();
```

## 4) Métodos de `CandlestickSeriesApi`

### `setData(candles)`

Substitui todo o histórico.

```js
series.setData([
  { time: Date.now() - 60000, open: 100, high: 101, low: 99.5, close: 100.2, volume: 300 },
  { time: Date.now(), open: 100.2, high: 100.9, low: 99.9, close: 100.7, volume: 280 }
]);
```

### `update(candle)`

Atualiza candle atual (mesmo bucket) ou cria novo candle (novo bucket).

```js
series.update({
  time: Date.now(),
  open: 100.7,
  high: 101.2,
  low: 100.4,
  close: 101.0,
  volume: 190
});
```

### `prependData(candles)`

Insere candles mais antigas (backfill).

```js
series.prependData([
  { time: Date.now() - 120000, open: 99.8, high: 100.3, low: 99.5, close: 100.0, volume: 170 }
]);
```

### `upsertHistorical(candles)`

Corrige ou insere candles históricas por timestamp.

```js
series.upsertHistorical([
  { time: Date.now() - 60000, open: 100.1, high: 101.0, low: 99.9, close: 100.8, volume: 250 }
]);
```

### `data()`

Retorna os candles do timeframe atual.

```js
const candles = series.data();
```

## 5) Tipos principais

```ts
type TimeValue = number | string | Date;
type Timeframe = `${number}${"ms" | "s" | "m" | "h" | "d" | "w"}`;
type AutoFollowMode = "bar" | "tick";

interface CandleInput {
  time: TimeValue;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

## 6) Fluxo recomendado no HTML

1. Criar chart com `createChart`
2. Criar série com `addCandlestickSeries`
3. Carregar histórico com `setData`
4. Ativar posição inicial com `fitContent`
5. Em realtime, usar `update`
6. Para histórico antigo, usar `prependData`
7. Ligar callbacks com `onCandleClick` e `onRangeSelect`

## 7) Referências

- Exemplo completo: `public/index.html`
- Lógica da demo: `public/js/main.js`
- Ajuda visual: `HELP.md`
