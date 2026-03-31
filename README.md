# Guia de Uso da API — `domzack-chart-lib`

Repositório de demo/validação local da biblioteca [`domzack-chart-lib`](https://github.com/domzack/domzack-chart-lib).

Aqui você encontra:
- como importar a lib;
- quais funções públicas existem;
- exemplos práticos de uso.

---

## 1) Pré-requisitos

O bundle da lib já está incluído em `public/lib/index.global.js`.

Para atualizar o bundle após mudanças na lib:

```powershell
# 1. build da lib
Set-Location "C:\mygits\domzack-chart-lib"
npm run build

# 2. copiar o bundle para o projeto de teste
Copy-Item ".\dist\index.global.js" "..\test\public\lib\index.global.js" -Force
```

Para rodar o servidor de teste:

```powershell
Set-Location "C:\mygits\test"
npm start
```

Abrir no navegador:

- `http://localhost:5500/index.html`

---

## 2) Formas de importação

### A) CDN — jsDelivr (GitHub)

```html
<script src="https://cdn.jsdelivr.net/gh/domzack/domzack-chart-lib@main/dist/index.global.js"></script>
<script>
  const { createChart } = window.DomzackChartLib;
</script>
```

### B) Local (bundle incluído neste repo)

```html
<script src="/lib/index.global.js"></script>
<script>
  const { createChart } = window.DomzackChartLib;
</script>
```

### C) ESM (projeto TypeScript/JavaScript)

```ts
import { createChart } from "domzack-chart-lib";
```

---

## 3) Tipos principais

### `CandleInput`

```ts
type TimeValue = number | string | Date;

interface CandleInput {
  time: TimeValue;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
```

### `Candle` (normalizado internamente)

```ts
interface Candle {
  time: number; // unix ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

### `Timeframe`

```ts
type Timeframe = `${number}${"ms" | "s" | "m" | "h" | "d" | "w"}`;
```

Exemplos: `"1m"`, `"5m"`, `"15m"`, `"1h"`.

---

## 4) API pública completa

### `createChart(container, options?)` → `ChartApi`

Cria uma instância de gráfico e retorna `ChartApi`.

```ts
const chart = createChart(document.getElementById('chart'), {
  timeframe: '1m',
  autoFollowMode: 'tick',
  rightOffsetCandles: 1.5
});
```

#### `ChartOptions`

| Opção | Tipo | Padrão | Descrição |
|---|---|---|---|
| `timeframe` | `Timeframe` | `'1m'` | Timeframe de agrupamento. Ex: `'15s'`, `'5m'`, `'1h'`, `'1d'` |
| `maxCandles` | `number` | `5000` | Limite máximo de candles armazenadas |
| `initialVisibleCandles` | `number` | `120` | Quantidade de candles visíveis ao iniciar |
| `showGrid` | `boolean` | `true` | Exibe linhas de grid |
| `showCrosshair` | `boolean` | `true` | Exibe crosshair ao hover |
| `showTooltip` | `boolean` | `true` | Exibe tooltip OHLCV ao hover |
| `autoFollowMode` | `'bar'\|'tick'` | `'tick'` | Modo de autofollow inicial |
| `rightOffsetCandles` | `number` | `1.5` | Espaço vazio à direita (em candles) |
| `width` | `number` | auto | Largura fixa em px (se omitido, usa o container) |
| `height` | `number` | auto | Altura fixa em px (se omitido, usa o container) |
| `theme` | `Partial<ChartTheme>` | — | Sobrescreve cores: `background`, `grid`, `text`, `upCandle`, `downCandle`, `upVolume`, `downVolume`, `crosshair` |

---

## 5) Métodos de `ChartApi`

| Função | Exemplo de uso | Descrição |
|---|---|---|
| `addCandlestickSeries(opts?)` | `const series = chart.addCandlestickSeries()` | Cria e retorna a série de candles (`CandlestickSeriesApi`) |
| `setTimeframe(tf)` | `chart.setTimeframe('15m')` | Troca o timeframe visual sem perder a série base canônica |
| `setAutoFollow(enabled)` | `chart.setAutoFollow(true)` | Ativa/desativa autofollow. Se `true`, rola imediatamente para a última candle |
| `isAutoFollow()` | `chart.isAutoFollow()` | Retorna `true` se autofollow está ativo |
| `setAutoFollowMode(mode)` | `chart.setAutoFollowMode('bar')` | Define o modo: `'tick'` = rola a todo update; `'bar'` = rola apenas quando nova barra abre |
| `getAutoFollowMode()` | `chart.getAutoFollowMode()` | Retorna o modo atual: `'tick'` ou `'bar'` |
| `setRightOffsetCandles(n)` | `chart.setRightOffsetCandles(3)` | Define o espaço vazio à direita (em candles) |
| `getRightOffsetCandles()` | `chart.getRightOffsetCandles()` | Retorna o offset atual |
| `onCandleClick(handler)` | `chart.onCandleClick(({ candle, index }) => {})` | Callback ao clicar numa candle. Retorna função de `unsubscribe` |
| `onRangeSelect(handler)` | `chart.onRangeSelect(({ candles, from, to, fromIndex, toIndex }) => {})` | Callback ao selecionar range com drag. Retorna função de `unsubscribe` |
| `timeScale().fitContent()` | `chart.timeScale().fitContent()` | Rola para a última candle e ativa autofollow |
| `destroy()` | `chart.destroy()` | Remove o canvas e limpa todos os listeners |

---

## 6) Métodos de `CandlestickSeriesApi`

| Função | Exemplo de uso | Descrição |
|---|---|---|
| `setData(candles)` | `series.setData([{ time: Date.now(), open: 1, high: 2, low: 0.9, close: 1.5, volume: 100 }])` | Substitui todo o histórico da série e dispara re-render |
| `update(candle)` | `series.update({ time: Date.now(), open: 1.5, high: 1.6, low: 1.4, close: 1.55 })` | Atualiza a última candle (tick) ou abre nova barra se o `time` for diferente |
| `prependData(candles)` | `series.prependData(olderCandles)` | Insere candles mais antigas no início (carregamento de histórico) |
| `upsertHistorical(candles)` | `series.upsertHistorical(backfill)` | Mescla candles históricas: atualiza existentes por `time` e insere as novas, mantendo ordem cronológica |
| `data()` | `const all = series.data()` | Retorna cópia do array `Candle[]` atual (já normalizados com `time: number`) |

---

## 7) Exemplo completo (global/script)

```html
<div id="chart" style="width:100%;height:420px"></div>
<script src="../domzack-chart-lib/dist/index.global.js"></script>
<script>
  const { createChart } = window.DomzackChartLib;

  const chart = createChart(document.getElementById("chart"), {
    timeframe: "1m",
    autoFollowMode: "tick",
    rightOffsetCandles: 1.5,
    showTooltip: true
  });

  const series = chart.addCandlestickSeries();

  series.setData([
    { time: Date.now() - 120000, open: 100, high: 101, low: 99.7, close: 100.4, volume: 1200 },
    { time: Date.now() - 60000, open: 100.4, high: 101.4, low: 100.2, close: 101.0, volume: 980 }
  ]);

  chart.onCandleClick(({ candle, index }) => {
    console.log("click", index, candle);
  });

  chart.onRangeSelect((selection) => {
    console.log("range", selection.fromIndex, selection.toIndex, selection.candles.length);
  });

  chart.timeScale().fitContent();

  setInterval(() => {
    const prev = series.data().at(-1);
    if (!prev) return;

    const open = prev.close;
    const close = open + (Math.random() - 0.5) * 0.8;
    const high = Math.max(open, close) + Math.random() * 0.4;
    const low = Math.min(open, close) - Math.random() * 0.4;

    series.update({
      time: Date.now(),
      open,
      high,
      low,
      close,
      volume: 500 + Math.round(Math.random() * 900)
    });
  }, 1000);
</script>
```

---

## 8) Demo local (`index.html`)

Estrutura do projeto de teste:

```
public/
  index.html          # HTML principal
  css/styles.css      # estilos
  js/main.js          # entry point público
  lib/
    index.global.js   # bundle da domzack-chart-lib (copiado do dist/)
src/
  js/main.js          # lógica da demo
server.mjs            # servidor HTTP estático
```

A rota antiga `/example.html` redireciona internamente para `/index.html`.

A demo local possui logs no console no formato:

- `[chart-ui][<timestamp>] button.timeframe.click ...`
- `[chart-ui][<timestamp>] button.auto-follow.click ...`
- `[chart-ui][<timestamp>] button.new-candle.click ...`
- `[chart-ui][<timestamp>] chart.range-select ...`

Esses logs ajudam a investigar travamentos de interação e estado de viewport.

---

## 9) Referência rápida (cheat sheet)

```ts
const chart = createChart(container, options);
const series = chart.addCandlestickSeries();

series.setData(candles);
series.update(candle);
series.prependData(candles);
series.upsertHistorical(candles);
series.data();

chart.setTimeframe("5m");
chart.setAutoFollow(true);
chart.isAutoFollow();
chart.setAutoFollowMode("tick");
chart.getAutoFollowMode();
chart.setRightOffsetCandles(1.5);
chart.getRightOffsetCandles();
chart.onCandleClick(cb);
chart.onRangeSelect(cb);
chart.timeScale().fitContent();
chart.destroy();
```
