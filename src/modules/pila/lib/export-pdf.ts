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

type RGB = [number, number, number];
type JsPdfDoc = InstanceType<Awaited<ReturnType<typeof loadJsPdf>>["jsPDF"]>;

// ── Interfaces ───────────────────────────────────────────────────

interface ReportData {
  reports: Array<{
    id: string;
    year: number;
    month: number;
    lab?: { id: string; name: string; countryCode: string } | null;
    values: Array<{
      numerator: number | null;
      denominator: number | null;
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
  const uniqueLabIds = [...new Set(reports.map((r) => r.lab?.id ?? r.id))];
  const labEntries = uniqueLabIds.map((labId, idx) => {
    const labReports = reports.filter((r) => (r.lab?.id ?? r.id) === labId);
    const values: number[] = [];
    for (const report of labReports) {
      const val = report.values.find((v) => v.indicator.id === indicator.id);
      const pct = computePercentage(val?.numerator, val?.denominator);
      if (pct != null) values.push(pct);
    }
    const avgPct =
      values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null;
    return { label: `Lab ${idx + 1}`, pct: avgPct };
  });

  const chartHeight = Math.min(pageHeight - y - 22, 120);
  drawBarChart(
    doc,
    {
      labels: labEntries.map((e) => e.label),
      values: labEntries.map((e) => e.pct),
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

// ── Main export function ─────────────────────────────────────────

export async function exportPilaPdf({
  data,
  showLabName,
  title,
  subtitle,
}: ExportPdfOptions) {
  const { jsPDF, autoTable } = await loadJsPdf();
  const { reports, indicators } = data;

  if (reports.length === 0) return;

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

  // ── 1. Cover page ──────────────────────────────────────────────
  addCoverPage(doc, title, subtitle, pageWidth, pageHeight, logo);

  // ── 2. Indicator list page ─────────────────────────────────────
  addIndicatorListPage(
    doc,
    indicators,
    autoTable,
    period,
    pageWidth,
    margin,
    logo,
  );

  // ── 3. Per-indicator pages ─────────────────────────────────────
  if (showLabName) {
    // Personalized report: data table + line chart per indicator
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
    // Anonymous report: bar charts comparing labs
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
      );
    }
  }

  // ── 4. Summary statistics page ─────────────────────────────────
  addSummaryPage(doc, data, autoTable, period, pageWidth, margin, logo);

  // ── 5. Add footers to all pages ────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter(doc, i, totalPages, pageWidth, pageHeight, margin);
  }

  // ── 6. Save ────────────────────────────────────────────────────
  const safeTitle = title
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, "")
    .replace(/\s+/g, "-");
  doc.save(`${safeTitle}.pdf`);
}
