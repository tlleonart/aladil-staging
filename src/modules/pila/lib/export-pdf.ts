// Dynamic imports to avoid SSR/bundling issues with Next.js
async function loadJsPdf() {
  const { jsPDF } = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  return { jsPDF, autoTable: autoTableModule.default };
}

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Brand colors
const BRAND_BLUE: RGB = [30, 64, 120];
const BRAND_BLUE_LIGHT: RGB = [91, 155, 213];
const BAR_BLUE: RGB = [68, 114, 196];
const LINE_GREEN: RGB = [76, 175, 80];
const MEAN_RED: RGB = [211, 47, 47];
const TABLE_HEADER_BG: RGB = [30, 64, 120];
const TABLE_HEADER_LIGHT: RGB = [91, 155, 213];
const GRAY_TEXT: RGB = [100, 100, 100];
const LIGHT_GRAY: RGB = [240, 243, 247];
const WHITE: RGB = [255, 255, 255];
const HIGHLIGHT_GOLD: RGB = [234, 170, 0];
const BAR_GRAY: RGB = [180, 185, 195];

type RGB = [number, number, number];
type JsPdfDoc = InstanceType<Awaited<ReturnType<typeof loadJsPdf>>["jsPDF"]>;

// ── Interfaces ───────────────────────────────────────────────────

interface ReportData {
  reports: Array<{
    id: string;
    year: number;
    month: number;
    lab?: {
      id: string;
      name: string;
      countryCode: string;
      pilaNumber?: number | null;
    } | null;
    values: Array<{
      numerator: number | null;
      denominator: number | null;
      doesNotReport?: boolean;
      indicator: { id: string; code: string; name: string };
    }>;
  }>;
  indicators: Array<{
    id: string;
    code: string;
    name: string;
    formula: string;
    numeratorLabel: string;
    denominatorLabel: string;
    considerations?: string | null;
    exclusions?: string | null;
  }>;
}

interface ExportPdfOptions {
  data: ReportData;
  showLabName: boolean;
  title: string;
  subtitle: string;
  /** When set, this lab is highlighted in anonymous reports (reporter's own lab) */
  highlightLabId?: string;
  highlightLabName?: string;
}

// ── Logo loader ──────────────────────────────────────────────────

async function loadLogoBase64(): Promise<string | null> {
  try {
    const resp = await fetch("/logo.png");
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function computePercentage(
  num: number | null | undefined,
  den: number | null | undefined,
): number | null {
  if (num == null || den == null || den === 0) return null;
  return (num / den) * 100;
}

function buildPeriodString(reports: ReportData["reports"]): string {
  if (reports.length === 0) return "";
  const sorted = [...reports].sort(
    (a, b) => a.year * 100 + a.month - (b.year * 100 + b.month),
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (first.year === last.year && first.month === last.month) {
    return `${MONTHS[first.month - 1]} ${first.year}`;
  }
  return `${MONTHS[first.month - 1]} ${first.year} - ${MONTHS[last.month - 1]} ${last.year}`;
}

function niceMax(value: number): number {
  if (value <= 0) return 0.01;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  let nice: number;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 1.5) nice = 1.5;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 3) nice = 3;
  else if (normalized <= 5) nice = 5;
  else if (normalized <= 7.5) nice = 7.5;
  else nice = 10;
  return nice * magnitude;
}

function formatPct(val: number | null): string {
  if (val == null) return "—";
  return `${val.toFixed(2)}%`;
}

/**
 * Sort unique lab IDs from a report set by their stable `pilaNumber`
 * (ascending), falling back to insertion order for labs without a number.
 * Returns a `{ labId, pilaNumber }[]` so downstream code can render labels
 * consistently across months.
 */
function orderedLabsWithNumber(
  reports: ReportData["reports"],
): Array<{ labId: string; pilaNumber: number | null }> {
  const seen = new Map<
    string,
    { pilaNumber: number | null; firstSeenIdx: number }
  >();
  reports.forEach((r, idx) => {
    const id = r.lab?.id ?? r.id;
    if (!seen.has(id)) {
      seen.set(id, {
        pilaNumber: r.lab?.pilaNumber ?? null,
        firstSeenIdx: idx,
      });
    }
  });
  return [...seen.entries()]
    .sort((a, b) => {
      const pa = a[1].pilaNumber ?? Number.POSITIVE_INFINITY;
      const pb = b[1].pilaNumber ?? Number.POSITIVE_INFINITY;
      if (pa !== pb) return pa - pb;
      return a[1].firstSeenIdx - b[1].firstSeenIdx;
    })
    .map(([labId, meta]) => ({ labId, pilaNumber: meta.pilaNumber }));
}

function labLabelFor(
  pilaNumber: number | null,
  fallbackIdx: number,
  isHighlighted: boolean,
  highlightLabName?: string,
): string {
  if (isHighlighted && highlightLabName) return highlightLabName;
  if (pilaNumber != null) return `Lab ${pilaNumber}`;
  return `Lab ${fallbackIdx + 1}`;
}

// ── Page components ──────────────────────────────────────────────

function addPageHeader(
  doc: JsPdfDoc,
  period: string,
  pageWidth: number,
  margin: number,
  logo: string | null,
) {
  // Thin accent line at very top
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageWidth, 2, "F");

  // Logo top-right
  if (logo) {
    doc.addImage(logo, "PNG", pageWidth - margin - 18, 5, 18, 18);
  }

  // Left: program info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...BRAND_BLUE);
  doc.text("PROGRAMA INTERLABORATORIAL DE INDICADORES", margin, 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(`Periodo: ${period}`, margin, 14.5);

  // Separator line under header
  doc.setDrawColor(...BRAND_BLUE_LIGHT);
  doc.setLineWidth(0.4);
  doc.line(margin, 19, pageWidth - margin, 19);
}

function addPageFooter(
  doc: JsPdfDoc,
  pageNum: number,
  totalPages: number,
  pageWidth: number,
  pageHeight: number,
  margin: number,
) {
  const footerY = pageHeight - 10;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  // Left: ALADIL branding
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY_TEXT);
  doc.text("ALADIL — Programa PILA", margin, footerY);

  // Right: page number
  doc.setFont("helvetica", "normal");
  doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, footerY, {
    align: "right",
  });
}

function addCoverPage(
  doc: JsPdfDoc,
  title: string,
  subtitle: string,
  pageWidth: number,
  pageHeight: number,
  logo: string | null,
) {
  const centerX = pageWidth / 2;

  // Top accent bar
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageWidth, 4, "F");

  // Logo centered
  if (logo) {
    doc.addImage(logo, "PNG", centerX - 22, 35, 44, 44);
  }

  // Organization name
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(
    "ASOCIACIÓN DE LABORATORIOS DE DIAGNÓSTICO DE LATINOAMÉRICA",
    centerX,
    88,
    { align: "center" },
  );

  // Decorative line
  doc.setDrawColor(...BRAND_BLUE_LIGHT);
  doc.setLineWidth(0.6);
  doc.line(centerX - 50, 95, centerX + 50, 95);

  // Program title
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_BLUE);
  doc.text("Programa Interlaboratorial de Indicadores", centerX, 108, {
    align: "center",
  });

  // Dynamic title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...BRAND_BLUE);
  const titleLines = doc.splitTextToSize(title, pageWidth - 60);
  doc.text(titleLines, centerX, 122, { align: "center" });

  // Subtitle
  const titleOffset = titleLines.length * 8;
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(subtitle, centerX, 122 + titleOffset, { align: "center" });
  }

  // Bottom decorative line
  doc.setDrawColor(...BRAND_BLUE_LIGHT);
  doc.setLineWidth(0.6);
  doc.line(
    centerX - 50,
    122 + titleOffset + 10,
    centerX + 50,
    122 + titleOffset + 10,
  );

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(`© ${new Date().getFullYear()} ALADIL`, centerX, pageHeight - 20, {
    align: "center",
  });
}

function addIndicatorListPage(
  doc: JsPdfDoc,
  indicators: ReportData["indicators"],
  autoTable: Awaited<ReturnType<typeof loadJsPdf>>["autoTable"],
  period: string,
  pageWidth: number,
  margin: number,
  logo: string | null,
) {
  doc.addPage();
  addPageHeader(doc, period, pageWidth, margin, logo);

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BRAND_BLUE);
  doc.text("Indicadores Evaluados", margin, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(
    "A continuación se detallan los indicadores incluidos en este informe.",
    margin,
    38,
  );

  autoTable(doc, {
    startY: 44,
    head: [
      [
        { content: "Código", styles: { halign: "center" as const } },
        {
          content: "Indicador",
          styles: { halign: "left" as const },
        },
        {
          content: "Fórmula",
          styles: { halign: "left" as const },
        },
      ],
    ],
    body: indicators.map((ind) => [ind.code, ind.name, ind.formula]),
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3.5,
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
      textColor: [40, 40, 40] as RGB,
    },
    headStyles: {
      fillColor: TABLE_HEADER_BG,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center",
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 20, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 55 },
      2: {},
    },
    alternateRowStyles: {
      fillColor: LIGHT_GRAY,
    },
    margin: { left: margin, right: margin },
  });
}

// ── Chart drawing ────────────────────────────────────────────────

interface BarChartData {
  labels: string[];
  values: (number | null)[];
  chartTitle: string;
}

function drawBarChart(
  doc: JsPdfDoc,
  chartData: BarChartData,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const { labels, values, chartTitle } = chartData;
  const validValues = values.filter((v): v is number => v != null);
  if (validValues.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(
      "Sin datos disponibles para este indicador.",
      x + width / 2,
      y + height / 2,
      { align: "center" },
    );
    return;
  }

  const maxValue = niceMax(Math.max(...validValues));
  const mean =
    validValues.length > 0
      ? validValues.reduce((a, b) => a + b, 0) / validValues.length
      : 0;

  // Chart area
  const chartLeft = x + 20;
  const chartRight = x + width - 8;
  const chartTop = y + 14;
  const chartBottom = y + height - 22;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(chartTitle, x + width / 2, y + 6, { align: "center" });

  // Background
  doc.setFillColor(250, 251, 253);
  doc.roundedRect(
    chartLeft - 2,
    chartTop - 2,
    chartW + 4,
    chartH + 4,
    1,
    1,
    "F",
  );

  // Y-axis gridlines and labels
  const yTicks = 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...GRAY_TEXT);

  for (let i = 0; i <= yTicks; i++) {
    const tickY = chartBottom - (i / yTicks) * chartH;
    const tickVal = (i / yTicks) * maxValue;

    // Gridline
    doc.setDrawColor(225, 230, 235);
    doc.setLineWidth(0.1);
    doc.line(chartLeft, tickY, chartRight, tickY);

    // Label
    let label: string;
    if (maxValue >= 1) {
      label = tickVal.toFixed(maxValue >= 10 ? 0 : 2);
    } else {
      label = tickVal.toFixed(4);
    }
    doc.text(label, chartLeft - 2, tickY + 1, { align: "right" });
  }

  // Y-axis line
  doc.setDrawColor(180, 185, 190);
  doc.setLineWidth(0.3);
  doc.line(chartLeft, chartTop, chartLeft, chartBottom);
  // X-axis line
  doc.line(chartLeft, chartBottom, chartRight, chartBottom);

  // Bars
  const barCount = labels.length;
  const groupWidth = chartW / barCount;
  const barWidth = Math.min(groupWidth * 0.6, 14);
  const barGap = (groupWidth - barWidth) / 2;

  for (let i = 0; i < barCount; i++) {
    const val = values[i];
    const barX = chartLeft + i * groupWidth + barGap;

    if (val != null && val > 0) {
      const barH = (val / maxValue) * chartH;
      const barY = chartBottom - barH;

      // Bar gradient effect (two rects)
      doc.setFillColor(...BAR_BLUE);
      doc.roundedRect(barX, barY, barWidth, barH, 0.5, 0.5, "F");

      // Lighter overlay on left half for subtle gradient
      doc.setFillColor(88, 134, 216);
      doc.roundedRect(barX, barY, barWidth * 0.4, barH, 0.5, 0.5, "F");

      // Value label on top
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(...BRAND_BLUE);
      doc.text(`${val.toFixed(2)}%`, barX + barWidth / 2, barY - 1.5, {
        align: "center",
      });
    }

    // X-axis label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(60, 60, 60);
    doc.text(
      labels[i],
      chartLeft + i * groupWidth + groupWidth / 2,
      chartBottom + 5,
      { align: "center" },
    );
  }

  // Mean line (dashed)
  if (mean > 0 && mean <= maxValue) {
    const meanY = chartBottom - (mean / maxValue) * chartH;
    doc.setDrawColor(...MEAN_RED);
    doc.setLineWidth(0.5);
    // Dashed line
    const dashLen = 2;
    const gapLen = 1.5;
    let cx = chartLeft + 2;
    while (cx < chartRight - 2) {
      const endX = Math.min(cx + dashLen, chartRight - 2);
      doc.line(cx, meanY, endX, meanY);
      cx = endX + gapLen;
    }
  }

  // Legend
  const legendY = chartBottom + 12;
  const legendCenterX = x + width / 2;

  // Bar legend
  doc.setFillColor(...BAR_BLUE);
  doc.roundedRect(legendCenterX - 28, legendY - 2, 5, 3, 0.5, 0.5, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(60, 60, 60);
  doc.text("Valor", legendCenterX - 21, legendY + 0.5);

  // Mean legend
  doc.setDrawColor(...MEAN_RED);
  doc.setLineWidth(0.5);
  doc.line(legendCenterX + 2, legendY - 0.5, legendCenterX + 8, legendY - 0.5);
  doc.text(`Media (${mean.toFixed(2)}%)`, legendCenterX + 10, legendY + 0.5);
}

// ── Highlighted bar chart (anonymous with own lab highlighted) ───

interface HighlightedBarChartData {
  labels: string[];
  values: (number | null)[];
  highlighted: boolean[];
  chartTitle: string;
}

function drawBarChartHighlighted(
  doc: JsPdfDoc,
  chartData: HighlightedBarChartData,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const { labels, values, highlighted, chartTitle } = chartData;
  const validValues = values.filter((v): v is number => v != null);
  if (validValues.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(
      "Sin datos disponibles para este indicador.",
      x + width / 2,
      y + height / 2,
      { align: "center" },
    );
    return;
  }

  const maxValue = niceMax(Math.max(...validValues));
  // Mean excludes N/R (null values already filtered)
  const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;

  const chartLeft = x + 20;
  const chartRight = x + width - 8;
  const chartTop = y + 14;
  const chartBottom = y + height - 22;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(chartTitle, x + width / 2, y + 6, { align: "center" });

  // Background
  doc.setFillColor(250, 251, 253);
  doc.roundedRect(
    chartLeft - 2,
    chartTop - 2,
    chartW + 4,
    chartH + 4,
    1,
    1,
    "F",
  );

  // Y-axis gridlines and labels
  const yTicks = 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...GRAY_TEXT);
  for (let i = 0; i <= yTicks; i++) {
    const tickY = chartBottom - (i / yTicks) * chartH;
    const tickVal = (i / yTicks) * maxValue;
    doc.setDrawColor(225, 230, 235);
    doc.setLineWidth(0.1);
    doc.line(chartLeft, tickY, chartRight, tickY);
    let label: string;
    if (maxValue >= 1) label = tickVal.toFixed(maxValue >= 10 ? 0 : 2);
    else label = tickVal.toFixed(4);
    doc.text(label, chartLeft - 2, tickY + 1, { align: "right" });
  }

  // Axes
  doc.setDrawColor(180, 185, 190);
  doc.setLineWidth(0.3);
  doc.line(chartLeft, chartTop, chartLeft, chartBottom);
  doc.line(chartLeft, chartBottom, chartRight, chartBottom);

  // Bars
  const barCount = labels.length;
  const groupWidth = chartW / barCount;
  const barWidth = Math.min(groupWidth * 0.6, 14);
  const barGap = (groupWidth - barWidth) / 2;

  for (let i = 0; i < barCount; i++) {
    const val = values[i];
    const isHL = highlighted[i];
    const barX = chartLeft + i * groupWidth + barGap;

    if (val != null && val > 0) {
      const barH = (val / maxValue) * chartH;
      const barY = chartBottom - barH;

      // Use gold for highlighted lab, gray for others
      if (isHL) {
        doc.setFillColor(...HIGHLIGHT_GOLD);
      } else {
        doc.setFillColor(...BAR_GRAY);
      }
      doc.roundedRect(barX, barY, barWidth, barH, 0.5, 0.5, "F");

      // Value label on top
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(...(isHL ? HIGHLIGHT_GOLD : BRAND_BLUE));
      doc.text(`${val.toFixed(2)}%`, barX + barWidth / 2, barY - 1.5, {
        align: "center",
      });
    }

    // X-axis label
    doc.setFont("helvetica", isHL ? "bold" : "normal");
    doc.setFontSize(isHL ? 6.5 : 6);
    doc.setTextColor(...(isHL ? ([0, 0, 0] as RGB) : ([60, 60, 60] as RGB)));
    doc.text(
      labels[i],
      chartLeft + i * groupWidth + groupWidth / 2,
      chartBottom + 5,
      { align: "center" },
    );
  }

  // Mean line (dashed)
  if (mean > 0 && mean <= maxValue) {
    const meanY = chartBottom - (mean / maxValue) * chartH;
    doc.setDrawColor(...MEAN_RED);
    doc.setLineWidth(0.5);
    let cx = chartLeft + 2;
    while (cx < chartRight - 2) {
      const endX = Math.min(cx + 2, chartRight - 2);
      doc.line(cx, meanY, endX, meanY);
      cx = endX + 1.5;
    }
  }

  // Legend
  const legendY = chartBottom + 12;
  const legendCenterX = x + width / 2;

  // Highlighted lab legend
  const hasHighlight = highlighted.some(Boolean);
  if (hasHighlight) {
    doc.setFillColor(...HIGHLIGHT_GOLD);
    doc.roundedRect(legendCenterX - 50, legendY - 2, 5, 3, 0.5, 0.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(60, 60, 60);
    doc.text("Mi laboratorio", legendCenterX - 43, legendY + 0.5);
  }

  // Others legend
  doc.setFillColor(...BAR_GRAY);
  doc.roundedRect(legendCenterX - 6, legendY - 2, 5, 3, 0.5, 0.5, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(60, 60, 60);
  doc.text("Otros", legendCenterX + 1, legendY + 0.5);

  // Mean legend
  doc.setDrawColor(...MEAN_RED);
  doc.setLineWidth(0.5);
  doc.line(
    legendCenterX + 16,
    legendY - 0.5,
    legendCenterX + 22,
    legendY - 0.5,
  );
  doc.text(`Media (${mean.toFixed(2)}%)`, legendCenterX + 24, legendY + 0.5);
}

// ── Line chart drawing ───────────────────────────────────────────

interface LineChartData {
  labels: string[];
  values: (number | null)[];
  chartTitle: string;
}

function drawLineChart(
  doc: JsPdfDoc,
  chartData: LineChartData,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const { labels, values, chartTitle } = chartData;
  const validValues = values.filter((v): v is number => v != null);
  if (validValues.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_TEXT);
    doc.text("Sin datos disponibles.", x + width / 2, y + height / 2, {
      align: "center",
    });
    return;
  }

  const maxValue = niceMax(Math.max(...validValues));
  const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;

  const chartLeft = x + 20;
  const chartRight = x + width - 10;
  const chartTop = y + 14;
  const chartBottom = y + height - 18;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(chartTitle, x + width / 2, y + 6, { align: "center" });

  // Background
  doc.setFillColor(250, 251, 253);
  doc.roundedRect(
    chartLeft - 2,
    chartTop - 2,
    chartW + 4,
    chartH + 4,
    1,
    1,
    "F",
  );

  // Y-axis gridlines
  const yTicks = 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...GRAY_TEXT);
  for (let i = 0; i <= yTicks; i++) {
    const tickY = chartBottom - (i / yTicks) * chartH;
    const tickVal = (i / yTicks) * maxValue;
    doc.setDrawColor(225, 230, 235);
    doc.setLineWidth(0.1);
    doc.line(chartLeft, tickY, chartRight, tickY);
    let label: string;
    if (maxValue >= 1) {
      label = tickVal.toFixed(maxValue >= 10 ? 0 : 2);
    } else {
      label = tickVal.toFixed(4);
    }
    doc.text(label, chartLeft - 2, tickY + 1, { align: "right" });
  }

  // Axes
  doc.setDrawColor(180, 185, 190);
  doc.setLineWidth(0.3);
  doc.line(chartLeft, chartTop, chartLeft, chartBottom);
  doc.line(chartLeft, chartBottom, chartRight, chartBottom);

  // Mean dashed line
  if (mean > 0 && mean <= maxValue) {
    const meanY = chartBottom - (mean / maxValue) * chartH;
    doc.setDrawColor(...MEAN_RED);
    doc.setLineWidth(0.4);
    let cx = chartLeft + 2;
    while (cx < chartRight - 2) {
      const endX = Math.min(cx + 2, chartRight - 2);
      doc.line(cx, meanY, endX, meanY);
      cx = endX + 1.5;
    }
  }

  // Points and lines
  const pointsX: number[] = [];
  const pointsY: number[] = [];
  const pointCount = labels.length;

  for (let i = 0; i < pointCount; i++) {
    const px = chartLeft + (i / Math.max(pointCount - 1, 1)) * chartW;
    pointsX.push(px);

    const val = values[i];
    if (val != null) {
      const py = chartBottom - (val / maxValue) * chartH;
      pointsY.push(py);
    } else {
      pointsY.push(Number.NaN);
    }

    // X-axis label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(60, 60, 60);
    doc.text(labels[i], px, chartBottom + 5, { align: "center" });
  }

  // Draw connecting lines
  doc.setDrawColor(...LINE_GREEN);
  doc.setLineWidth(0.7);
  let prevX: number | null = null;
  let prevY: number | null = null;
  for (let i = 0; i < pointCount; i++) {
    if (!Number.isNaN(pointsY[i])) {
      if (prevX != null && prevY != null) {
        doc.line(prevX, prevY, pointsX[i], pointsY[i]);
      }
      prevX = pointsX[i];
      prevY = pointsY[i];
    }
  }

  // Draw dots and value labels
  for (let i = 0; i < pointCount; i++) {
    const val = values[i];
    if (val != null && !Number.isNaN(pointsY[i])) {
      // Dot
      doc.setFillColor(...LINE_GREEN);
      doc.circle(pointsX[i], pointsY[i], 1.2, "F");
      doc.setFillColor(255, 255, 255);
      doc.circle(pointsX[i], pointsY[i], 0.5, "F");

      // Value label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(...LINE_GREEN);
      doc.text(`${val.toFixed(2)}%`, pointsX[i], pointsY[i] - 3, {
        align: "center",
      });
    }
  }

  // Legend
  const legendY = chartBottom + 12;
  const legendCenterX = x + width / 2;

  doc.setDrawColor(...LINE_GREEN);
  doc.setLineWidth(0.7);
  doc.line(
    legendCenterX - 26,
    legendY - 0.5,
    legendCenterX - 20,
    legendY - 0.5,
  );
  doc.setFillColor(...LINE_GREEN);
  doc.circle(legendCenterX - 23, legendY - 0.5, 0.8, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(60, 60, 60);
  doc.text("Evolución", legendCenterX - 18, legendY + 0.5);

  doc.setDrawColor(...MEAN_RED);
  doc.setLineWidth(0.4);
  doc.line(legendCenterX + 6, legendY - 0.5, legendCenterX + 12, legendY - 0.5);
  doc.text(`Media (${mean.toFixed(2)}%)`, legendCenterX + 14, legendY + 0.5);
}

// ── Indicator detail page (personalized — per lab, showing months) ──

function addIndicatorPagePersonalized(
  doc: JsPdfDoc,
  indicator: ReportData["indicators"][0],
  reports: ReportData["reports"],
  autoTable: Awaited<ReturnType<typeof loadJsPdf>>["autoTable"],
  period: string,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  logo: string | null,
) {
  doc.addPage();
  addPageHeader(doc, period, pageWidth, margin, logo);

  let y = 28;

  // Indicator title with accent
  doc.setFillColor(...BRAND_BLUE);
  doc.roundedRect(margin, y - 3.5, 3, 8, 0.5, 0.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(`${indicator.code} — ${indicator.name}`, margin + 6, y + 2);
  y += 10;

  // Formula
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_BLUE);
  doc.text("Cálculo:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  const formulaLines = doc.splitTextToSize(
    indicator.formula,
    pageWidth - margin * 2 - 18,
  );
  doc.text(formulaLines, margin + 18, y);
  y += formulaLines.length * 3.5 + 2;

  // Considerations
  if (indicator.considerations) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_BLUE);
    doc.text("Consideraciones:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    const consLines = doc.splitTextToSize(
      indicator.considerations,
      pageWidth - margin * 2,
    );
    y += 3.5;
    doc.text(consLines, margin, y);
    y += consLines.length * 3.5 + 1;
  }

  // Exclusions
  if (indicator.exclusions) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_BLUE);
    doc.text("Exclusiones:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    const exclLines = doc.splitTextToSize(
      indicator.exclusions,
      pageWidth - margin * 2,
    );
    y += 3.5;
    doc.text(exclLines, margin, y);
    y += exclLines.length * 3.5 + 1;
  }

  y += 3;

  // Data table: Month | Numerator | Denominator | %
  const sortedReports = [...reports].sort(
    (a, b) => a.year * 100 + a.month - (b.year * 100 + b.month),
  );

  const tableBody = sortedReports.map((report) => {
    const val = report.values.find((v) => v.indicator.id === indicator.id);
    const pct = computePercentage(val?.numerator, val?.denominator);
    return [
      `${MONTHS[report.month - 1]} ${report.year}`,
      val?.numerator != null ? String(val.numerator) : "—",
      val?.denominator != null ? String(val.denominator) : "—",
      formatPct(pct),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Periodo",
        indicator.numeratorLabel || "Numerador",
        indicator.denominatorLabel || "Denominador",
        "%",
      ],
    ],
    body: tableBody,
    theme: "grid",
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: [220, 220, 220],
      lineWidth: 0.15,
      textColor: [40, 40, 40] as RGB,
    },
    headStyles: {
      fillColor: TABLE_HEADER_LIGHT,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: "bold" },
      1: { halign: "center", cellWidth: 35 },
      2: { halign: "center", cellWidth: 35 },
      3: { halign: "center", cellWidth: 25, fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: margin, right: margin },
  });

  // biome-ignore lint/suspicious/noExplicitAny: jspdf-autotable extends doc
  const tableEndY = (doc as any).lastAutoTable?.finalY ?? y + 30;
  y = tableEndY + 6;

  // Line chart showing evolution
  const chartAvailableH = Math.min(pageHeight - y - 20, 70);
  if (chartAvailableH > 30) {
    const entries = sortedReports.map((report) => {
      const val = report.values.find((v) => v.indicator.id === indicator.id);
      return {
        label: `${MONTHS[report.month - 1].substring(0, 3)} ${String(report.year).slice(2)}`,
        pct: computePercentage(val?.numerator, val?.denominator),
      };
    });

    drawLineChart(
      doc,
      {
        labels: entries.map((e) => e.label),
        values: entries.map((e) => e.pct),
        chartTitle: `Evolución — ${indicator.code}`,
      },
      margin,
      y,
      pageWidth - margin * 2,
      chartAvailableH,
    );
  }
}

// ── Indicator detail page (anonymous — integral report) ──────────

function addIndicatorPageAnonymous(
  doc: JsPdfDoc,
  indicator: ReportData["indicators"][0],
  reports: ReportData["reports"],
  period: string,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  logo: string | null,
  highlightLabId?: string,
  highlightLabName?: string,
) {
  doc.addPage();
  addPageHeader(doc, period, pageWidth, margin, logo);

  let y = 28;

  // Indicator title with accent
  doc.setFillColor(...BRAND_BLUE);
  doc.roundedRect(margin, y - 3.5, 3, 8, 0.5, 0.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(`${indicator.code} — ${indicator.name}`, margin + 6, y + 2);
  y += 10;

  // Formula
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_BLUE);
  doc.text("Cálculo:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  const formulaLines = doc.splitTextToSize(
    indicator.formula,
    pageWidth - margin * 2 - 18,
  );
  doc.text(formulaLines, margin + 18, y);
  y += formulaLines.length * 3.5 + 4;

  // Bar chart for anonymous data
  const ordered = orderedLabsWithNumber(reports);
  const labEntries = ordered.map(({ labId, pilaNumber }, idx) => {
    const labReports = reports.filter((r) => (r.lab?.id ?? r.id) === labId);
    const values: number[] = [];
    for (const report of labReports) {
      const val = report.values.find((v) => v.indicator.id === indicator.id);
      // Skip doesNotReport values
      if (val?.doesNotReport) continue;
      const pct = computePercentage(val?.numerator, val?.denominator);
      if (pct != null) values.push(pct);
    }
    const avgPct =
      values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null;
    const isHighlighted = highlightLabId === labId;
    return {
      label: labLabelFor(pilaNumber, idx, isHighlighted, highlightLabName),
      pct: avgPct,
      isHighlighted,
    };
  });

  const chartHeight = Math.min(pageHeight - y - 22, 120);
  drawBarChartHighlighted(
    doc,
    {
      labels: labEntries.map((e) => e.label),
      values: labEntries.map((e) => e.pct),
      highlighted: labEntries.map((e) => e.isHighlighted),
      chartTitle: `${indicator.code} — Comparativa entre laboratorios`,
    },
    margin,
    y,
    pageWidth - margin * 2,
    chartHeight,
  );
}

// ── Summary statistics table ─────────────────────────────────────

function addSummaryPage(
  doc: JsPdfDoc,
  data: ReportData,
  autoTable: Awaited<ReturnType<typeof loadJsPdf>>["autoTable"],
  period: string,
  pageWidth: number,
  margin: number,
  logo: string | null,
) {
  doc.addPage();
  addPageHeader(doc, period, pageWidth, margin, logo);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BRAND_BLUE);
  doc.text("Resumen Estadístico", margin, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(
    "Estadísticas descriptivas por indicador para el periodo evaluado.",
    margin,
    38,
  );

  const { reports, indicators } = data;

  const body = indicators.map((ind) => {
    const values: number[] = [];
    for (const report of reports) {
      const val = report.values.find((v) => v.indicator.id === ind.id);
      if (val?.doesNotReport) continue; // Exclude N/R from statistics
      const pct = computePercentage(val?.numerator, val?.denominator);
      if (pct != null) values.push(pct);
    }

    if (values.length === 0) {
      return [ind.code, ind.name, "—", "—", "—", "—", "0"];
    }

    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const median =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    return [
      ind.code,
      ind.name,
      `${min.toFixed(2)}%`,
      `${max.toFixed(2)}%`,
      `${mean.toFixed(2)}%`,
      `${median.toFixed(2)}%`,
      String(values.length),
    ];
  });

  autoTable(doc, {
    startY: 44,
    head: [["Código", "Indicador", "Mín", "Máx", "Media", "Mediana", "N"]],
    body,
    theme: "grid",
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: [220, 220, 220],
      lineWidth: 0.15,
      textColor: [40, 40, 40] as RGB,
    },
    headStyles: {
      fillColor: TABLE_HEADER_BG,
      textColor: WHITE,
      fontStyle: "bold",
      halign: "center",
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 16, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 50 },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 22, halign: "center", fontStyle: "bold" },
      5: { cellWidth: 22, halign: "center" },
      6: { cellWidth: 12, halign: "center" },
    },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: margin, right: margin },
  });
}

// ── Statistical helpers (enriched mode) ──────────────────────────

interface FullStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  stdDev: number;
  iqr: number;
  n: number;
}

function computeFullStats(values: number[]): FullStats | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const quantile = (p: number): number => {
    if (n === 1) return sorted[0];
    const idx = (n - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  };

  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const variance =
    n > 1 ? sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);
  const q1 = quantile(0.25);
  const median = quantile(0.5);
  const q3 = quantile(0.75);

  return {
    min: sorted[0],
    q1,
    median,
    q3,
    max: sorted[n - 1],
    mean,
    stdDev,
    iqr: q3 - q1,
    n,
  };
}

function computeLabAverage(
  reports: ReportData["reports"],
  indicatorId: string,
  labId: string,
): number | null {
  const labReports = reports.filter((r) => (r.lab?.id ?? r.id) === labId);
  const values: number[] = [];
  for (const report of labReports) {
    const val = report.values.find((v) => v.indicator.id === indicatorId);
    if (val?.doesNotReport) continue;
    const pct = computePercentage(val?.numerator, val?.denominator);
    if (pct != null) values.push(pct);
  }
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function computeLabAverages(
  reports: ReportData["reports"],
  indicatorId: string,
): { labId: string; value: number }[] {
  const uniqueLabIds = [...new Set(reports.map((r) => r.lab?.id ?? r.id))];
  const out: { labId: string; value: number }[] = [];
  for (const labId of uniqueLabIds) {
    const avg = computeLabAverage(reports, indicatorId, labId);
    if (avg != null) out.push({ labId, value: avg });
  }
  return out;
}

interface LabPosition {
  ownValue: number;
  mean: number;
  delta: number;
  rank: number;
  total: number;
  percentile: number;
}

function computeLabPosition(
  reports: ReportData["reports"],
  indicatorId: string,
  highlightLabId: string,
): LabPosition | null {
  const labAvgs = computeLabAverages(reports, indicatorId);
  const own = labAvgs.find((l) => l.labId === highlightLabId);
  if (!own) return null;
  const values = labAvgs.map((l) => l.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sorted = [...values].sort((a, b) => b - a);
  const rank = sorted.indexOf(own.value) + 1;
  const percentile =
    values.length === 1
      ? 100
      : Math.round(
          ((values.length - rank) / Math.max(values.length - 1, 1)) * 100,
        );
  return {
    ownValue: own.value,
    mean,
    delta: own.value - mean,
    rank,
    total: values.length,
    percentile,
  };
}

interface MonthTrend {
  direction: "up" | "down" | "flat" | "none";
  deltaPp: number;
}

function computeOwnTrend(
  reports: ReportData["reports"],
  indicatorId: string,
  highlightLabId: string,
): MonthTrend {
  const labReports = reports
    .filter((r) => (r.lab?.id ?? r.id) === highlightLabId)
    .sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
  const series: number[] = [];
  for (const r of labReports) {
    const val = r.values.find((v) => v.indicator.id === indicatorId);
    if (val?.doesNotReport) continue;
    const pct = computePercentage(val?.numerator, val?.denominator);
    if (pct != null) series.push(pct);
  }
  if (series.length < 2) return { direction: "none", deltaPp: 0 };
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const deltaPp = last - prev;
  if (Math.abs(deltaPp) < 0.01) return { direction: "flat", deltaPp };
  return { direction: deltaPp > 0 ? "up" : "down", deltaPp };
}

// ── Drawing helpers (enriched mode) ──────────────────────────────

function drawBoxPlot(
  doc: JsPdfDoc,
  stats: FullStats,
  x: number,
  y: number,
  width: number,
  height: number,
  chartTitle: string,
) {
  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(chartTitle, x + width / 2, y + 6, { align: "center" });

  const axisLeft = x + 18;
  const axisRight = x + width - 8;
  const axisY = y + height / 2 + 4;
  const axisW = axisRight - axisLeft;

  // Use data range for scale (with small padding)
  const pad = Math.max((stats.max - stats.min) * 0.1, 0.5);
  const scaleMin = Math.max(stats.min - pad, 0);
  const scaleMax = stats.max + pad;
  const range = Math.max(scaleMax - scaleMin, 0.01);
  const toX = (v: number) => axisLeft + ((v - scaleMin) / range) * axisW;

  // Background
  doc.setFillColor(250, 251, 253);
  doc.roundedRect(axisLeft - 2, y + 12, axisW + 4, height - 18, 1, 1, "F");

  // Axis line
  doc.setDrawColor(180, 185, 190);
  doc.setLineWidth(0.3);
  doc.line(axisLeft, axisY + 14, axisRight, axisY + 14);

  // Axis ticks (5)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...GRAY_TEXT);
  for (let i = 0; i <= 4; i++) {
    const v = scaleMin + (i / 4) * range;
    const px = axisLeft + (i / 4) * axisW;
    doc.setDrawColor(200, 205, 210);
    doc.setLineWidth(0.15);
    doc.line(px, axisY + 13, px, axisY + 15);
    doc.text(`${v.toFixed(1)}%`, px, axisY + 19, { align: "center" });
  }

  const boxTop = axisY - 6;
  const boxBottom = axisY + 6;
  const boxHeight = boxBottom - boxTop;

  // Whiskers
  doc.setDrawColor(...BRAND_BLUE);
  doc.setLineWidth(0.5);
  const minX = toX(stats.min);
  const maxX = toX(stats.max);
  const q1X = toX(stats.q1);
  const q3X = toX(stats.q3);
  const medianX = toX(stats.median);
  const meanX = toX(stats.mean);

  doc.line(minX, axisY, q1X, axisY);
  doc.line(q3X, axisY, maxX, axisY);
  doc.line(minX, axisY - 3, minX, axisY + 3);
  doc.line(maxX, axisY - 3, maxX, axisY + 3);

  // Box (Q1 to Q3)
  doc.setFillColor(...BRAND_BLUE_LIGHT);
  doc.rect(q1X, boxTop, q3X - q1X, boxHeight, "F");
  doc.setDrawColor(...BRAND_BLUE);
  doc.setLineWidth(0.5);
  doc.rect(q1X, boxTop, q3X - q1X, boxHeight, "S");

  // Median line
  doc.setDrawColor(...BRAND_BLUE);
  doc.setLineWidth(0.8);
  doc.line(medianX, boxTop, medianX, boxBottom);

  // Mean (diamond)
  doc.setFillColor(...MEAN_RED);
  doc.triangle(meanX, axisY - 1.5, meanX - 1.5, axisY, meanX + 1.5, axisY, "F");
  doc.triangle(meanX, axisY + 1.5, meanX - 1.5, axisY, meanX + 1.5, axisY, "F");

  // Labels
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(`Min ${stats.min.toFixed(1)}%`, minX, boxTop - 2, {
    align: "center",
  });
  doc.text(`Q1 ${stats.q1.toFixed(1)}%`, q1X, boxTop - 2, { align: "center" });
  doc.text(`Med ${stats.median.toFixed(1)}%`, medianX, boxBottom + 4.5, {
    align: "center",
  });
  doc.text(`Q3 ${stats.q3.toFixed(1)}%`, q3X, boxTop - 2, { align: "center" });
  doc.text(`Max ${stats.max.toFixed(1)}%`, maxX, boxTop - 2, {
    align: "center",
  });

  // Legend
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(
    `n=${stats.n} | IQR=${stats.iqr.toFixed(2)}% | σ=${stats.stdDev.toFixed(2)}%`,
    x + width / 2,
    y + height - 2,
    { align: "center" },
  );
}

function drawHistogram(
  doc: JsPdfDoc,
  values: number[],
  x: number,
  y: number,
  width: number,
  height: number,
  chartTitle: string,
) {
  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(chartTitle, x + width / 2, y + 6, { align: "center" });

  if (values.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_TEXT);
    doc.text("Sin datos.", x + width / 2, y + height / 2, { align: "center" });
    return;
  }

  // Bucket count: sqrt(n), min 3, max 8
  const binCount = Math.max(
    3,
    Math.min(8, Math.round(Math.sqrt(values.length))),
  );
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.01);
  const binWidth = span / binCount;

  const bins: number[] = new Array(binCount).fill(0);
  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / binWidth), binCount - 1);
    bins[idx]++;
  }
  const maxBin = niceMax(Math.max(...bins));

  const chartLeft = x + 18;
  const chartRight = x + width - 8;
  const chartTop = y + 14;
  const chartBottom = y + height - 18;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  // Background
  doc.setFillColor(250, 251, 253);
  doc.roundedRect(
    chartLeft - 2,
    chartTop - 2,
    chartW + 4,
    chartH + 4,
    1,
    1,
    "F",
  );

  // Y-axis gridlines
  const yTicks = 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...GRAY_TEXT);
  for (let i = 0; i <= yTicks; i++) {
    const tickY = chartBottom - (i / yTicks) * chartH;
    const tickVal = (i / yTicks) * maxBin;
    doc.setDrawColor(225, 230, 235);
    doc.setLineWidth(0.1);
    doc.line(chartLeft, tickY, chartRight, tickY);
    doc.text(tickVal.toFixed(0), chartLeft - 2, tickY + 1, { align: "right" });
  }

  // Axes
  doc.setDrawColor(180, 185, 190);
  doc.setLineWidth(0.3);
  doc.line(chartLeft, chartTop, chartLeft, chartBottom);
  doc.line(chartLeft, chartBottom, chartRight, chartBottom);

  // Bars
  const barWidth = chartW / binCount;
  for (let i = 0; i < binCount; i++) {
    const count = bins[i];
    const barX = chartLeft + i * barWidth + 0.5;
    const barH = maxBin > 0 ? (count / maxBin) * chartH : 0;
    const barY = chartBottom - barH;
    if (count > 0) {
      doc.setFillColor(...BAR_BLUE);
      doc.roundedRect(barX, barY, barWidth - 1, barH, 0.3, 0.3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(...BRAND_BLUE);
      doc.text(String(count), barX + (barWidth - 1) / 2, barY - 1, {
        align: "center",
      });
    }
    // X label (bin range)
    const binLo = min + i * binWidth;
    const binHi = binLo + binWidth;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(80, 80, 80);
    doc.text(
      `${binLo.toFixed(1)}-${binHi.toFixed(1)}`,
      barX + (barWidth - 1) / 2,
      chartBottom + 4,
      { align: "center" },
    );
  }

  // Axis caption
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(
    "Distribución del valor por laboratorio (%)",
    x + width / 2,
    y + height - 2,
    { align: "center" },
  );
}

function drawPositionCard(
  doc: JsPdfDoc,
  indicatorCode: string,
  position: LabPosition,
  trend: MonthTrend,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  // Card background
  doc.setFillColor(255, 250, 230);
  doc.setDrawColor(...HIGHLIGHT_GOLD);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 1.5, 1.5, "FD");

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(`Mi Laboratorio — ${indicatorCode}`, x + 4, y + 5);

  // Cells: own value | mean | delta | rank | percentile
  const cellWidth = (width - 8) / 5;
  const contentY = y + 9;
  const labelY = contentY + 3.5;
  const valueY = contentY + 10;

  const cells = [
    {
      label: "Valor propio",
      value: `${position.ownValue.toFixed(2)}%`,
      color: BRAND_BLUE,
    },
    {
      label: "Media",
      value: `${position.mean.toFixed(2)}%`,
      color: GRAY_TEXT,
    },
    {
      label: "Dif. vs media",
      value: `${position.delta >= 0 ? "+" : ""}${position.delta.toFixed(2)} pp`,
      color:
        position.delta >= 0 ? ([34, 139, 34] as RGB) : ([211, 47, 47] as RGB),
    },
    {
      label: "Ranking",
      value: `${position.rank}º de ${position.total}`,
      color: BRAND_BLUE,
    },
    {
      label: "Percentil",
      value: `${position.percentile}`,
      color: BRAND_BLUE,
    },
  ];

  for (let i = 0; i < cells.length; i++) {
    const cellX = x + 4 + i * cellWidth;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(cells[i].label, cellX + cellWidth / 2, labelY, {
      align: "center",
    });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...cells[i].color);
    doc.text(cells[i].value, cellX + cellWidth / 2, valueY, {
      align: "center",
    });
  }

  // Trend footer
  if (trend.direction !== "none") {
    const trendY = y + height - 2.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    let label: string;
    let color: RGB;
    if (trend.direction === "up") {
      label = `Tendencia: ^ +${trend.deltaPp.toFixed(2)} pp vs periodo anterior`;
      color = [34, 139, 34];
    } else if (trend.direction === "down") {
      label = `Tendencia: v ${trend.deltaPp.toFixed(2)} pp vs periodo anterior`;
      color = [211, 47, 47];
    } else {
      label = "Tendencia: = estable vs periodo anterior";
      color = GRAY_TEXT;
    }
    doc.setTextColor(...color);
    doc.text(label, x + width / 2, trendY, { align: "center" });
  }
}

// ── Enriched bar chart with Q1/Q3 bands ──────────────────────────

function drawBarChartEnriched(
  doc: JsPdfDoc,
  chartData: HighlightedBarChartData,
  stats: FullStats | null,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const { labels, values, highlighted, chartTitle } = chartData;
  const validValues = values.filter((v): v is number => v != null);
  if (validValues.length === 0 || !stats) {
    drawBarChartHighlighted(doc, chartData, x, y, width, height);
    return;
  }

  const maxValue = niceMax(Math.max(...validValues));

  const chartLeft = x + 20;
  const chartRight = x + width - 8;
  const chartTop = y + 14;
  const chartBottom = y + height - 22;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(chartTitle, x + width / 2, y + 6, { align: "center" });

  // Background
  doc.setFillColor(250, 251, 253);
  doc.roundedRect(
    chartLeft - 2,
    chartTop - 2,
    chartW + 4,
    chartH + 4,
    1,
    1,
    "F",
  );

  // Q1/Q3 band (tenuous)
  if (stats.q1 <= maxValue && stats.q3 <= maxValue) {
    const bandTop = chartBottom - (stats.q3 / maxValue) * chartH;
    const bandBottom = chartBottom - (stats.q1 / maxValue) * chartH;
    doc.setFillColor(220, 232, 248);
    doc.rect(chartLeft, bandTop, chartW, bandBottom - bandTop, "F");
  }

  // Y-axis
  const yTicks = 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...GRAY_TEXT);
  for (let i = 0; i <= yTicks; i++) {
    const tickY = chartBottom - (i / yTicks) * chartH;
    const tickVal = (i / yTicks) * maxValue;
    doc.setDrawColor(225, 230, 235);
    doc.setLineWidth(0.1);
    doc.line(chartLeft, tickY, chartRight, tickY);
    let label: string;
    if (maxValue >= 1) label = tickVal.toFixed(maxValue >= 10 ? 0 : 2);
    else label = tickVal.toFixed(4);
    doc.text(label, chartLeft - 2, tickY + 1, { align: "right" });
  }

  // Axes
  doc.setDrawColor(180, 185, 190);
  doc.setLineWidth(0.3);
  doc.line(chartLeft, chartTop, chartLeft, chartBottom);
  doc.line(chartLeft, chartBottom, chartRight, chartBottom);

  // Bars
  const barCount = labels.length;
  const groupWidth = chartW / barCount;
  const barWidth = Math.min(groupWidth * 0.6, 14);
  const barGap = (groupWidth - barWidth) / 2;

  for (let i = 0; i < barCount; i++) {
    const val = values[i];
    const isHL = highlighted[i];
    const barX = chartLeft + i * groupWidth + barGap;

    if (val != null && val > 0) {
      const barH = (val / maxValue) * chartH;
      const barY = chartBottom - barH;
      doc.setFillColor(...(isHL ? HIGHLIGHT_GOLD : BAR_GRAY));
      doc.roundedRect(barX, barY, barWidth, barH, 0.5, 0.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(...(isHL ? HIGHLIGHT_GOLD : BRAND_BLUE));
      doc.text(`${val.toFixed(2)}%`, barX + barWidth / 2, barY - 1.5, {
        align: "center",
      });
    }

    doc.setFont("helvetica", isHL ? "bold" : "normal");
    doc.setFontSize(isHL ? 6.5 : 6);
    doc.setTextColor(...(isHL ? ([0, 0, 0] as RGB) : ([60, 60, 60] as RGB)));
    doc.text(
      labels[i],
      chartLeft + i * groupWidth + groupWidth / 2,
      chartBottom + 5,
      { align: "center" },
    );
  }

  // Mean line (dashed)
  if (stats.mean > 0 && stats.mean <= maxValue) {
    const meanY = chartBottom - (stats.mean / maxValue) * chartH;
    doc.setDrawColor(...MEAN_RED);
    doc.setLineWidth(0.5);
    let cx = chartLeft + 2;
    while (cx < chartRight - 2) {
      const endX = Math.min(cx + 2, chartRight - 2);
      doc.line(cx, meanY, endX, meanY);
      cx = endX + 1.5;
    }
  }

  // Legend
  const legendY = chartBottom + 12;
  const legendCenterX = x + width / 2;
  const hasHighlight = highlighted.some(Boolean);

  if (hasHighlight) {
    doc.setFillColor(...HIGHLIGHT_GOLD);
    doc.roundedRect(legendCenterX - 70, legendY - 2, 5, 3, 0.5, 0.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(60, 60, 60);
    doc.text("Mi lab", legendCenterX - 63, legendY + 0.5);
  }
  doc.setFillColor(...BAR_GRAY);
  doc.roundedRect(legendCenterX - 46, legendY - 2, 5, 3, 0.5, 0.5, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(60, 60, 60);
  doc.text("Otros", legendCenterX - 39, legendY + 0.5);

  doc.setFillColor(220, 232, 248);
  doc.roundedRect(legendCenterX - 22, legendY - 2, 5, 3, 0.5, 0.5, "F");
  doc.text("Banda Q1-Q3", legendCenterX - 15, legendY + 0.5);

  doc.setDrawColor(...MEAN_RED);
  doc.setLineWidth(0.5);
  doc.line(
    legendCenterX + 18,
    legendY - 0.5,
    legendCenterX + 24,
    legendY - 0.5,
  );
  doc.text(
    `Media (${stats.mean.toFixed(2)}%)`,
    legendCenterX + 26,
    legendY + 0.5,
  );
}

// ── Enriched per-indicator pages ─────────────────────────────────

function addIndicatorPageAnonymousEnriched(
  doc: JsPdfDoc,
  indicator: ReportData["indicators"][0],
  reports: ReportData["reports"],
  period: string,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  logo: string | null,
  highlightLabId?: string,
  highlightLabName?: string,
) {
  doc.addPage();
  addPageHeader(doc, period, pageWidth, margin, logo);

  let y = 28;

  // Indicator title
  doc.setFillColor(...BRAND_BLUE);
  doc.roundedRect(margin, y - 3.5, 3, 8, 0.5, 0.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(`${indicator.code} — ${indicator.name}`, margin + 6, y + 2);
  y += 8;

  // Formula
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_BLUE);
  doc.text("Cálculo:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  const formulaLines = doc.splitTextToSize(
    indicator.formula,
    pageWidth - margin * 2 - 18,
  );
  doc.text(formulaLines, margin + 18, y);
  y += formulaLines.length * 3.5 + 2;

  // Lab averages for this indicator (for stats, box plot, histogram)
  const labAvgs = computeLabAverages(reports, indicator.id);
  const labValues = labAvgs.map((l) => l.value);
  const stats = computeFullStats(labValues);

  // Position card (only if own lab has data for this indicator)
  if (highlightLabId) {
    const position = computeLabPosition(reports, indicator.id, highlightLabId);
    const trend = computeOwnTrend(reports, indicator.id, highlightLabId);
    if (position) {
      drawPositionCard(
        doc,
        indicator.code,
        position,
        trend,
        margin,
        y,
        pageWidth - margin * 2,
        22,
      );
      y += 25;
    }
  }

  // Bar chart with Q1/Q3 band
  const ordered = orderedLabsWithNumber(reports);
  const labEntries = ordered.map(({ labId, pilaNumber }, idx) => {
    const avg = computeLabAverage(reports, indicator.id, labId);
    const isHighlighted = highlightLabId === labId;
    return {
      label: labLabelFor(pilaNumber, idx, isHighlighted, highlightLabName),
      pct: avg,
      isHighlighted,
    };
  });

  const availableH = pageHeight - y - 20;
  const chartH = Math.min(availableH * 0.45, 75);
  drawBarChartEnriched(
    doc,
    {
      labels: labEntries.map((e) => e.label),
      values: labEntries.map((e) => e.pct),
      highlighted: labEntries.map((e) => e.isHighlighted),
      chartTitle: `${indicator.code} — Comparativa entre laboratorios`,
    },
    stats,
    margin,
    y,
    pageWidth - margin * 2,
    chartH,
  );
  y += chartH + 3;

  // Box plot + histogram side by side
  if (stats && availableH - chartH > 55) {
    const halfW = (pageWidth - margin * 2 - 4) / 2;
    const sideH = Math.min(availableH - chartH - 5, 55);
    drawBoxPlot(
      doc,
      stats,
      margin,
      y,
      halfW,
      sideH,
      `${indicator.code} — Diagrama de caja`,
    );
    drawHistogram(
      doc,
      labValues,
      margin + halfW + 4,
      y,
      halfW,
      sideH,
      `${indicator.code} — Distribución`,
    );
  }
}

function addIndicatorPagePersonalizedEnriched(
  doc: JsPdfDoc,
  indicator: ReportData["indicators"][0],
  reports: ReportData["reports"],
  autoTable: Awaited<ReturnType<typeof loadJsPdf>>["autoTable"],
  period: string,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  logo: string | null,
) {
  doc.addPage();
  addPageHeader(doc, period, pageWidth, margin, logo);

  let y = 28;

  // Title
  doc.setFillColor(...BRAND_BLUE);
  doc.roundedRect(margin, y - 3.5, 3, 8, 0.5, 0.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(`${indicator.code} — ${indicator.name}`, margin + 6, y + 2);
  y += 10;

  // Formula
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_BLUE);
  doc.text("Cálculo:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  const formulaLines = doc.splitTextToSize(
    indicator.formula,
    pageWidth - margin * 2 - 18,
  );
  doc.text(formulaLines, margin + 18, y);
  y += formulaLines.length * 3.5 + 2;

  // Compute series + stats
  const sortedReports = [...reports].sort(
    (a, b) => a.year * 100 + a.month - (b.year * 100 + b.month),
  );
  const series: { label: string; pct: number | null }[] = sortedReports.map(
    (r) => {
      const val = r.values.find((v) => v.indicator.id === indicator.id);
      return {
        label: `${MONTHS[r.month - 1].substring(0, 3)} ${String(r.year).slice(2)}`,
        pct: val?.doesNotReport
          ? null
          : computePercentage(val?.numerator, val?.denominator),
      };
    },
  );

  const validPcts: number[] = series
    .map((s) => s.pct)
    .filter((v): v is number => v != null);
  const stats = computeFullStats(validPcts);
  const trend = (() => {
    if (validPcts.length < 2) return null;
    const last = validPcts[validPcts.length - 1];
    const prev = validPcts[validPcts.length - 2];
    const delta = last - prev;
    if (Math.abs(delta) < 0.01) return { direction: "=", deltaPp: delta };
    return {
      direction: delta > 0 ? "^" : "v",
      deltaPp: delta,
    };
  })();

  // Stats bar
  if (stats) {
    doc.setFillColor(245, 248, 253);
    doc.setDrawColor(...BRAND_BLUE_LIGHT);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 1, 1, "FD");

    const cellW = (pageWidth - margin * 2) / 6;
    const cells = [
      { label: "Media", value: `${stats.mean.toFixed(2)}%` },
      { label: "Mediana", value: `${stats.median.toFixed(2)}%` },
      { label: "Mín", value: `${stats.min.toFixed(2)}%` },
      { label: "Máx", value: `${stats.max.toFixed(2)}%` },
      { label: "Desv. est.", value: `${stats.stdDev.toFixed(2)}%` },
      {
        label: "Tendencia",
        value: trend
          ? `${trend.direction} ${trend.deltaPp >= 0 ? "+" : ""}${trend.deltaPp.toFixed(2)} pp`
          : "—",
      },
    ];
    for (let i = 0; i < cells.length; i++) {
      const cx = margin + i * cellW + cellW / 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(...GRAY_TEXT);
      doc.text(cells[i].label, cx, y + 4, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...BRAND_BLUE);
      doc.text(cells[i].value, cx, y + 10.5, { align: "center" });
    }
    y += 18;
  }

  // Data table
  const tableBody = sortedReports.map((report) => {
    const val = report.values.find((v) => v.indicator.id === indicator.id);
    const pct = val?.doesNotReport
      ? null
      : computePercentage(val?.numerator, val?.denominator);
    return [
      `${MONTHS[report.month - 1]} ${report.year}`,
      val?.doesNotReport
        ? "N/R"
        : val?.numerator != null
          ? String(val.numerator)
          : "—",
      val?.doesNotReport
        ? "N/R"
        : val?.denominator != null
          ? String(val.denominator)
          : "—",
      formatPct(pct),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Periodo",
        indicator.numeratorLabel || "Numerador",
        indicator.denominatorLabel || "Denominador",
        "%",
      ],
    ],
    body: tableBody,
    theme: "grid",
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: [220, 220, 220],
      lineWidth: 0.15,
      textColor: [40, 40, 40] as RGB,
    },
    headStyles: {
      fillColor: TABLE_HEADER_LIGHT,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: "bold" },
      1: { halign: "center", cellWidth: 35 },
      2: { halign: "center", cellWidth: 35 },
      3: { halign: "center", cellWidth: 25, fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: margin, right: margin },
  });

  // biome-ignore lint/suspicious/noExplicitAny: jspdf-autotable extends doc
  const tableEndY = (doc as any).lastAutoTable?.finalY ?? y + 30;
  y = tableEndY + 4;

  // Line chart for evolution
  const chartAvailableH = Math.min(pageHeight - y - 22, 65);
  if (chartAvailableH > 30) {
    drawLineChart(
      doc,
      {
        labels: series.map((s) => s.label),
        values: series.map((s) => s.pct),
        chartTitle: `Evolución — ${indicator.code}`,
      },
      margin,
      y,
      pageWidth - margin * 2,
      chartAvailableH,
    );
  }
}

// ── Enriched summary page (with std dev + IQR) ───────────────────

function addSummaryPageEnriched(
  doc: JsPdfDoc,
  data: ReportData,
  autoTable: Awaited<ReturnType<typeof loadJsPdf>>["autoTable"],
  period: string,
  pageWidth: number,
  margin: number,
  logo: string | null,
) {
  doc.addPage();
  addPageHeader(doc, period, pageWidth, margin, logo);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BRAND_BLUE);
  doc.text("Resumen Estadístico", margin, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(
    "Estadísticas descriptivas por indicador para el periodo evaluado.",
    margin,
    38,
  );

  const { reports, indicators } = data;

  const body = indicators.map((ind) => {
    const values: number[] = [];
    for (const report of reports) {
      const val = report.values.find((v) => v.indicator.id === ind.id);
      if (val?.doesNotReport) continue;
      const pct = computePercentage(val?.numerator, val?.denominator);
      if (pct != null) values.push(pct);
    }

    const stats = computeFullStats(values);
    if (!stats) {
      return [ind.code, ind.name, "—", "—", "—", "—", "—", "—", "0"];
    }

    return [
      ind.code,
      ind.name,
      `${stats.min.toFixed(2)}%`,
      `${stats.max.toFixed(2)}%`,
      `${stats.mean.toFixed(2)}%`,
      `${stats.median.toFixed(2)}%`,
      `${stats.stdDev.toFixed(2)}%`,
      `${stats.iqr.toFixed(2)}%`,
      String(stats.n),
    ];
  });

  autoTable(doc, {
    startY: 44,
    head: [
      [
        "Código",
        "Indicador",
        "Mín",
        "Máx",
        "Media",
        "Mediana",
        "Desv. est.",
        "IQR",
        "N",
      ],
    ],
    body,
    theme: "grid",
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: [220, 220, 220],
      lineWidth: 0.15,
      textColor: [40, 40, 40] as RGB,
    },
    headStyles: {
      fillColor: TABLE_HEADER_BG,
      textColor: WHITE,
      fontStyle: "bold",
      halign: "center",
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 14, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 42 },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 18, halign: "center", fontStyle: "bold" },
      5: { cellWidth: 18, halign: "center" },
      6: { cellWidth: 18, halign: "center" },
      7: { cellWidth: 15, halign: "center" },
      8: { cellWidth: 10, halign: "center" },
    },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: margin, right: margin },
  });
}

// ── Insights page (enriched) ─────────────────────────────────────

function addInsightsPage(
  doc: JsPdfDoc,
  data: ReportData,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  period: string,
  logo: string | null,
  highlightLabId?: string,
  highlightLabName?: string,
) {
  doc.addPage();
  addPageHeader(doc, period, pageWidth, margin, logo);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BRAND_BLUE);
  doc.text("Puntos Clave", margin, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(
    "Hallazgos automáticos basados en los datos del periodo.",
    margin,
    38,
  );

  const { reports, indicators } = data;

  // Generate bullets
  const bullets: { label: string; detail: string; tone: RGB }[] = [];

  for (const ind of indicators) {
    const values: number[] = [];
    for (const report of reports) {
      const val = report.values.find((v) => v.indicator.id === ind.id);
      if (val?.doesNotReport) continue;
      const pct = computePercentage(val?.numerator, val?.denominator);
      if (pct != null) values.push(pct);
    }
    const stats = computeFullStats(values);
    if (!stats || stats.n < 2) continue;

    // Dispersion insight
    if (stats.stdDev > stats.mean * 0.5 && stats.mean > 0) {
      bullets.push({
        label: `${ind.code} — Alta dispersión`,
        detail: `Desviación estándar de ${stats.stdDev.toFixed(2)}% sobre una media de ${stats.mean.toFixed(2)}%. Los laboratorios muestran resultados muy diferentes para este indicador.`,
        tone: MEAN_RED,
      });
    }

    // Own lab position
    if (highlightLabId) {
      const position = computeLabPosition(reports, ind.id, highlightLabId);
      if (position) {
        const labelName = highlightLabName ?? "tu laboratorio";
        if (position.delta > stats.stdDev) {
          bullets.push({
            label: `${ind.code} — ${labelName} por encima de la media`,
            detail: `Valor ${position.ownValue.toFixed(2)}% (${position.delta > 0 ? "+" : ""}${position.delta.toFixed(2)} pp vs media). Ranking ${position.rank}º de ${position.total}.`,
            tone: [34, 139, 34],
          });
        } else if (position.delta < -stats.stdDev) {
          bullets.push({
            label: `${ind.code} — ${labelName} por debajo de la media`,
            detail: `Valor ${position.ownValue.toFixed(2)}% (${position.delta.toFixed(2)} pp vs media). Ranking ${position.rank}º de ${position.total}.`,
            tone: MEAN_RED,
          });
        }

        const trend = computeOwnTrend(reports, ind.id, highlightLabId);
        if (
          trend.direction !== "none" &&
          trend.direction !== "flat" &&
          Math.abs(trend.deltaPp) > 1
        ) {
          bullets.push({
            label: `${ind.code} — Tendencia en ${labelName}`,
            detail: `${trend.direction === "up" ? "Subió" : "Bajó"} ${Math.abs(trend.deltaPp).toFixed(2)} pp vs el periodo anterior.`,
            tone: trend.direction === "up" ? [34, 139, 34] : MEAN_RED,
          });
        }
      }
    }

    // Outlier mention
    if (stats.max - stats.q3 > stats.iqr * 1.5 && stats.n >= 4) {
      bullets.push({
        label: `${ind.code} — Posible outlier alto`,
        detail: `El valor máximo (${stats.max.toFixed(2)}%) supera Q3 (${stats.q3.toFixed(2)}%) en más de 1,5 × IQR. Podría requerir revisión.`,
        tone: [180, 110, 0],
      });
    }
  }

  if (bullets.length === 0) {
    bullets.push({
      label: "Sin hallazgos automáticos destacables",
      detail:
        "No se detectaron desviaciones significativas en los indicadores del periodo.",
      tone: GRAY_TEXT,
    });
  }

  // Render bullets
  let y = 46;
  const maxY = pageHeight - 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  for (const b of bullets) {
    if (y > maxY - 18) break;
    // Bullet marker
    doc.setFillColor(...b.tone);
    doc.circle(margin + 2, y + 1, 1.2, "F");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_BLUE);
    doc.text(b.label, margin + 6, y + 2);
    y += 4.5;

    // Detail
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    const detailLines = doc.splitTextToSize(
      b.detail,
      pageWidth - margin * 2 - 6,
    );
    doc.text(detailLines, margin + 6, y);
    y += detailLines.length * 3.5 + 3;
  }

  // Footer note
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(
    "Los hallazgos son heurísticos y sirven como guía, no reemplazan el análisis profesional.",
    margin,
    maxY,
  );
}

// ── Internal builders ────────────────────────────────────────────

type PdfVariantResult = { blob: Blob; filename: string };

async function buildPdf(
  opts: ExportPdfOptions & { variant: "standard" | "enriched" },
): Promise<PdfVariantResult> {
  const {
    data,
    showLabName,
    title,
    subtitle,
    highlightLabId,
    highlightLabName,
    variant,
  } = opts;
  const { jsPDF, autoTable } = await loadJsPdf();
  const { reports, indicators } = data;

  const logo = await loadLogoBase64();
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const period = buildPeriodString(reports);

  // Cover
  const coverTitle = highlightLabName ? `${title}\n${highlightLabName}` : title;
  addCoverPage(doc, coverTitle, subtitle, pageWidth, pageHeight, logo);

  // Indicator list
  addIndicatorListPage(
    doc,
    indicators,
    autoTable,
    period,
    pageWidth,
    margin,
    logo,
  );

  // Per-indicator pages
  if (variant === "enriched") {
    if (showLabName) {
      for (const indicator of indicators) {
        addIndicatorPagePersonalizedEnriched(
          doc,
          indicator,
          reports,
          autoTable,
          period,
          pageWidth,
          pageHeight,
          margin,
          logo,
        );
      }
    } else {
      for (const indicator of indicators) {
        addIndicatorPageAnonymousEnriched(
          doc,
          indicator,
          reports,
          period,
          pageWidth,
          pageHeight,
          margin,
          logo,
          highlightLabId,
          highlightLabName,
        );
      }
    }
  } else {
    if (showLabName) {
      for (const indicator of indicators) {
        addIndicatorPagePersonalized(
          doc,
          indicator,
          reports,
          autoTable,
          period,
          pageWidth,
          pageHeight,
          margin,
          logo,
        );
      }
    } else {
      for (const indicator of indicators) {
        addIndicatorPageAnonymous(
          doc,
          indicator,
          reports,
          period,
          pageWidth,
          pageHeight,
          margin,
          logo,
          highlightLabId,
          highlightLabName,
        );
      }
    }
  }

  // Summary
  if (variant === "enriched") {
    addSummaryPageEnriched(
      doc,
      data,
      autoTable,
      period,
      pageWidth,
      margin,
      logo,
    );
    addInsightsPage(
      doc,
      data,
      pageWidth,
      pageHeight,
      margin,
      period,
      logo,
      highlightLabId,
      highlightLabName,
    );
  } else {
    addSummaryPage(doc, data, autoTable, period, pageWidth, margin, logo);
  }

  // Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter(doc, i, totalPages, pageWidth, pageHeight, margin);
  }

  const safeTitle = title
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, "")
    .replace(/\s+/g, "-");
  const suffix = variant === "enriched" ? "-enriquecido" : "-standard";
  const filename = `${safeTitle}${suffix}.pdf`;
  const blob = doc.output("blob");
  return { blob, filename };
}

// ── Main export function ─────────────────────────────────────────

export interface ExportPilaPdfResult {
  standard: PdfVariantResult;
  enriched: PdfVariantResult;
}

export async function exportPilaPdf(
  options: ExportPdfOptions,
): Promise<ExportPilaPdfResult | null> {
  if (options.data.reports.length === 0) return null;

  const [standard, enriched] = await Promise.all([
    buildPdf({ ...options, variant: "standard" }),
    buildPdf({ ...options, variant: "enriched" }),
  ]);

  return { standard, enriched };
}

/** Trigger a browser download from a Blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
