const { createChart } = window.DomzackChartLib;

const chart = createChart(document.getElementById("chart"), {
    timeframe: "1m",
    maxCandles: 1000,
    initialVisibleCandles: 100,
    showGrid: true,
    showCrosshair: true
});

const series = chart.addCandlestickSeries();

const initial = [];
const now = Date.now();
let lastTime = now - 200 * 60_000;
let lastClose = 100;

for (let i = 0; i < 200; i += 1) {
    const open = lastClose;
    const close = open + (Math.random() - 0.5) * 1.2;
    const high = Math.max(open, close) + Math.random() * 0.5;
    const low = Math.min(open, close) - Math.random() * 0.5;
    lastClose = close;
    lastTime += 60_000;
    initial.push({
        time: lastTime,
        open,
        high,
        low,
        close,
        volume: 120 + Math.round(Math.random() * 250)
    });
}

series.setData(initial);
chart.timeScale().fitContent();

const info = document.getElementById("info");
const rangeModal = document.getElementById("range-modal");
const rangeXz = document.getElementById("range-xz");
const rangeCount = document.getElementById("range-count");
const rangeOhlcv = document.getElementById("range-ohlcv");
const rangeVolume = document.getElementById("range-volume");
const rangeVariation = document.getElementById("range-variation");
const rangePreview = document.getElementById("range-preview");
const miniCandleCanvas = document.getElementById("mini-candle");
const miniCandleLegend = document.getElementById("mini-candle-legend");
const copyRangeCsvButton = document.getElementById("copy-range-csv");
const closeRangeModalButton = document.getElementById("close-range-modal");

let lastSelectedRange = null;

const logUi = (action, details = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[chart-ui][${timestamp}] ${action}`, details);
};

const formatDate = (value) => new Date(value).toLocaleString();

const toCsv = (candles) => {
    const header = "datetime,open,high,low,close,volume";
    const rows = candles.map((c) => {
        return [
            new Date(c.time).toISOString(),
            c.open,
            c.high,
            c.low,
            c.close,
            c.volume
        ].join(",");
    });
    return [header, ...rows].join("\n");
};

const openRangeModal = () => {
    rangeModal.classList.add("open");
};

const closeRangeModal = () => {
    rangeModal.classList.remove("open");
};

const isModalOpen = () => rangeModal.classList.contains("open");

const drawMiniCandle = ({ open, high, low, close }) => {
    const canvas = miniCandleCanvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return;
    }

    const width = canvas.width;
    const height = canvas.height;
    const pad = 12;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0b1018";
    ctx.fillRect(0, 0, width, height);

    const maxPrice = Math.max(high, open, close);
    const minPrice = Math.min(low, open, close);
    const priceRange = Math.max(1e-9, maxPrice - minPrice);
    const toY = (price) => {
        const ratio = (price - minPrice) / priceRange;
        return Math.round(height - pad - ratio * (height - pad * 2));
    };

    const x = Math.round(width / 2);
    const wickTop = toY(high);
    const wickBottom = toY(low);
    const yOpen = toY(open);
    const yClose = toY(close);
    const bodyTop = Math.min(yOpen, yClose);
    const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
    const bullish = close >= open;
    const color = bullish ? "#26a69a" : "#ef5350";

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, wickTop);
    ctx.lineTo(x, wickBottom);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.fillRect(x - 14, bodyTop, 28, bodyHeight);

    ctx.strokeStyle = "#25304a";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
};

closeRangeModalButton.addEventListener("click", closeRangeModal);
rangeModal.addEventListener("click", (event) => {
    if (event.target === rangeModal) {
        logUi("modal.backdrop-click", { open: isModalOpen() });
        closeRangeModal();
    }
});

const copySelectedRangeCsv = async () => {
    if (!lastSelectedRange || !lastSelectedRange.candles.length) {
        return false;
    }

    const csv = toCsv(lastSelectedRange.candles);
    try {
        await navigator.clipboard.writeText(csv);
        info.textContent = `OHLCV do período copiado (${lastSelectedRange.candles.length} candles).`;
        return true;
    } catch (error) {
        info.textContent = "Falha ao copiar para clipboard.";
        return false;
    }
};

copyRangeCsvButton.addEventListener("click", async () => {
    logUi("button.copy-range-csv.click", {
        hasRange: Boolean(lastSelectedRange),
        candleCount: lastSelectedRange?.candles?.length ?? 0
    });
    await copySelectedRangeCsv();
});

document.addEventListener("keydown", async (event) => {
    if (!isModalOpen()) {
        return;
    }

    if (event.key === "Escape") {
        event.preventDefault();
        logUi("modal.keyboard.escape", { open: isModalOpen() });
        closeRangeModal();
        return;
    }

    const key = event.key.toLowerCase();
    if (event.ctrlKey && key === "c") {
        event.preventDefault();
        logUi("modal.keyboard.ctrl-c", {
            hasRange: Boolean(lastSelectedRange),
            candleCount: lastSelectedRange?.candles?.length ?? 0
        });
        await copySelectedRangeCsv();
    }
});

chart.onCandleClick(({ candle, index }) => {
    logUi("chart.candle-click", {
        index,
        time: candle.time,
        close: candle.close
    });
    info.textContent = `Candle #${index} | ${new Date(candle.time).toLocaleString()} | O:${candle.open.toFixed(3)} H:${candle.high.toFixed(3)} L:${candle.low.toFixed(3)} C:${candle.close.toFixed(3)} V:${Math.round(candle.volume)}`;
});

chart.onRangeSelect(({ candles, from, to, fromIndex, toIndex }) => {
    logUi("chart.range-select", {
        candleCount: candles.length,
        fromIndex,
        toIndex,
        fromTime: from.time,
        toTime: to.time
    });
    const high = Math.max(...candles.map((c) => c.high));
    const low = Math.min(...candles.map((c) => c.low));
    const volume = candles.reduce((acc, c) => acc + c.volume, 0);
    const open = from.open;
    const close = to.close;
    const variationAbs = close - open;
    const variationPct = open === 0 ? 0 : (variationAbs / open) * 100;

    lastSelectedRange = { candles, from, to, fromIndex, toIndex };

    rangeXz.textContent = `X → Z: ${formatDate(from.time)} → ${formatDate(to.time)}`;
    rangeCount.textContent = `Candles: ${candles.length}  (índices ${fromIndex} → ${toIndex})`;
    rangeOhlcv.textContent = `OHLCV período: O ${open.toFixed(4)} | H ${high.toFixed(4)} | L ${low.toFixed(4)} | C ${close.toFixed(4)}`;
    rangeVolume.textContent = `Volume acumulado: ${Math.round(volume)}`;
    rangeVariation.textContent = `Variação (open→close): ${variationAbs >= 0 ? "+" : ""}${variationAbs.toFixed(4)} (${variationPct.toFixed(2)}%)`;
    rangePreview.textContent = toCsv(candles).split("\n").slice(0, 11).join("\n") + (candles.length > 10 ? "\n..." : "");

    drawMiniCandle({ open, high, low, close });
    miniCandleLegend.textContent = `Candle agregado | O:${open.toFixed(4)} H:${high.toFixed(4)} L:${low.toFixed(4)} C:${close.toFixed(4)}`;

    info.textContent = `Período selecionado: ${candles.length} candles. Janela de resumo aberta.`;
    openRangeModal();
});

const timeframeButtons = Array.from(document.querySelectorAll("button[data-tf]"));
let currentTimeframe = "1m";

const syncTimeframeButtons = () => {
    timeframeButtons.forEach((button) => {
        button.classList.toggle("is-selected", button.dataset.tf === currentTimeframe);
    });
};

timeframeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentTimeframe = button.dataset.tf;
        chart.setTimeframe(currentTimeframe);
        syncTimeframeButtons();
        logUi("button.timeframe.click", {
            timeframe: currentTimeframe,
            autoFollow: chart.isAutoFollow(),
            mode: chart.getAutoFollowMode(),
            rightOffsetCandles: chart.getRightOffsetCandles()
        });
    });
});

document.getElementById("fit").addEventListener("click", () => {
    chart.timeScale().fitContent();
    syncUiState();
    logUi("button.fit.click", {
        autoFollow: chart.isAutoFollow(),
        mode: chart.getAutoFollowMode(),
        rightOffsetCandles: chart.getRightOffsetCandles()
    });
});

const autoFollowButton = document.getElementById("auto-follow");
const autoFollowModeButton = document.getElementById("auto-follow-mode");
const offsetLessButton = document.getElementById("offset-less");
const offsetMoreButton = document.getElementById("offset-more");

const syncUiState = () => {
    const autoFollowOn = chart.isAutoFollow();
    const mode = chart.getAutoFollowMode();

    autoFollowButton.textContent = `AutoFollow: ${autoFollowOn ? "ON" : "OFF"}`;
    autoFollowButton.classList.toggle("is-on", autoFollowOn);
    autoFollowButton.classList.toggle("is-off", !autoFollowOn);

    autoFollowModeButton.textContent = `Mode: ${mode.toUpperCase()}`;
    autoFollowModeButton.classList.toggle("mode-bar", mode === "bar");
    autoFollowModeButton.classList.toggle("mode-tick", mode === "tick");
};

syncTimeframeButtons();
syncUiState();

autoFollowButton.addEventListener("click", () => {
    const next = !chart.isAutoFollow();
    chart.setAutoFollow(next);
    syncUiState();
    logUi("button.auto-follow.click", {
        autoFollow: chart.isAutoFollow(),
        mode: chart.getAutoFollowMode(),
        rightOffsetCandles: chart.getRightOffsetCandles()
    });
});

autoFollowModeButton.addEventListener("click", () => {
    const nextMode = chart.getAutoFollowMode() === "bar" ? "tick" : "bar";
    chart.setAutoFollowMode(nextMode);
    syncUiState();
    logUi("button.auto-follow-mode.click", {
        mode: chart.getAutoFollowMode(),
        autoFollow: chart.isAutoFollow(),
        rightOffsetCandles: chart.getRightOffsetCandles()
    });
});

offsetLessButton.addEventListener("click", () => {
    const next = Math.max(0, chart.getRightOffsetCandles() - 0.5);
    chart.setRightOffsetCandles(next);
    info.textContent = `RightOffsetCandles: ${next.toFixed(1)}`;
    logUi("button.offset-less.click", {
        rightOffsetCandles: next,
        autoFollow: chart.isAutoFollow(),
        mode: chart.getAutoFollowMode(),
        timeframe: currentTimeframe
    });
});

offsetMoreButton.addEventListener("click", () => {
    const next = Math.min(12, chart.getRightOffsetCandles() + 0.5);
    chart.setRightOffsetCandles(next);
    info.textContent = `RightOffsetCandles: ${next.toFixed(1)}`;
    logUi("button.offset-more.click", {
        rightOffsetCandles: next,
        autoFollow: chart.isAutoFollow(),
        mode: chart.getAutoFollowMode(),
        timeframe: currentTimeframe
    });
});

document.getElementById("new-candle").addEventListener("click", () => {
    const open = lastClose;
    const close = open + (Math.random() - 0.5) * 1.4;
    const high = Math.max(open, close) + Math.random() * 0.4;
    const low = Math.min(open, close) - Math.random() * 0.4;

    lastClose = close;
    lastTime += 60_000;

    series.update({
        time: lastTime,
        open,
        high,
        low,
        close,
        volume: 150 + Math.round(Math.random() * 180)
    });

    logUi("button.new-candle.click", {
        time: lastTime,
        close,
        autoFollow: chart.isAutoFollow(),
        mode: chart.getAutoFollowMode(),
        timeframe: currentTimeframe
    });
});

document.getElementById("prepend").addEventListener("click", () => {
    const oldest = series.data()[0];
    if (!oldest) return;

    const olderTime = oldest.time - 60_000;
    const close = oldest.open - (Math.random() - 0.5) * 0.8;
    const open = close + (Math.random() - 0.5) * 0.5;
    const high = Math.max(open, close) + 0.3;
    const low = Math.min(open, close) - 0.3;

    series.prependData([
        {
            time: olderTime,
            open,
            high,
            low,
            close,
            volume: 170
        }
    ]);

    logUi("button.prepend.click", {
        olderTime,
        close,
        autoFollow: chart.isAutoFollow(),
        mode: chart.getAutoFollowMode(),
        timeframe: currentTimeframe
    });
});

info.textContent = "Clique no candle | Shift+clique em 2 pontos para período | Shift+arraste também funciona";
