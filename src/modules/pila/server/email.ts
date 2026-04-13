import { ADMIN_RECIPIENTS, sendEmail } from "@/modules/core/email";

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

interface ReportEmailData {
  reporterName: string;
  reporterEmail: string;
  labName: string;
  year: number;
  month: number;
  values: Array<{
    indicatorCode: string;
    indicatorName: string;
    numerator: number | null;
    denominator: number | null;
    doesNotReport: boolean;
  }>;
}

function computePercentage(num: number | null, den: number | null): string {
  if (num == null || den == null || den === 0) return "—";
  return `${((num / den) * 100).toFixed(2)}%`;
}

function buildReportTable(values: ReportEmailData["values"]): string {
  const rows = values
    .map(
      (v) => `
    <tr>
      <td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;color:#1e4078;">${v.indicatorCode}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;">${v.indicatorName}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">
        ${v.doesNotReport ? '<span style="color:#d97706;font-weight:600;">N/R</span>' : computePercentage(v.numerator, v.denominator)}
      </td>
    </tr>`,
    )
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr style="background:#1e4078;color:white;">
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Código</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Indicador</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;">Resultado</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export async function sendReportSubmittedToReporter(data: ReportEmailData) {
  const monthName = MONTHS[data.month - 1];
  const table = buildReportTable(data.values);

  await sendEmail({
    to: data.reporterEmail,
    subject: `PILA — Reporte ${monthName} ${data.year} enviado correctamente`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1e4078;color:white;padding:20px;text-align:center;">
          <h1 style="margin:0;font-size:18px;">Programa PILA — ALADIL</h1>
        </div>
        <div style="padding:24px;">
          <p>Hola <strong>${data.reporterName}</strong>,</p>
          <p>Tu reporte de indicadores PILA para <strong>${monthName} ${data.year}</strong> del laboratorio <strong>${data.labName}</strong> fue enviado correctamente.</p>
          <h3 style="color:#1e4078;">Resumen del reporte</h3>
          ${table}
          <p style="color:#6b7280;font-size:13px;margin-top:24px;">
            Este es un correo automático de la Intranet ALADIL. No responda a este mensaje.
          </p>
        </div>
      </div>`,
  });
}

export async function sendReportSubmittedToAdmin(data: ReportEmailData) {
  const monthName = MONTHS[data.month - 1];
  const table = buildReportTable(data.values);

  await sendEmail({
    to: ADMIN_RECIPIENTS,
    subject: `PILA — ${data.labName} envió reporte ${monthName} ${data.year}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1e4078;color:white;padding:20px;text-align:center;">
          <h1 style="margin:0;font-size:18px;">Programa PILA — Nuevo Reporte</h1>
        </div>
        <div style="padding:24px;">
          <p>El laboratorio <strong>${data.labName}</strong> ha enviado su reporte de indicadores PILA para <strong>${monthName} ${data.year}</strong>.</p>
          <p><strong>Enviado por:</strong> ${data.reporterName} (${data.reporterEmail})</p>
          <h3 style="color:#1e4078;">Resumen</h3>
          ${table}
          <p style="margin-top:24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://aladil.org"}/admin/pila" style="background:#1e4078;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;">
              Ver en la Intranet
            </a>
          </p>
        </div>
      </div>`,
  });
}
