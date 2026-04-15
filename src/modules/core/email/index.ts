import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS =
  process.env.RESEND_FROM || "Intranet ALADIL <intranet@aladil.org>";

const ADMIN_RECIPIENTS = [
  "admin@aladil.org",
  "coordinacionejecutiva@aladil.org",
];

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping email");
    return;
  }

  const recipients = Array.isArray(to) ? to : [to];

  console.log(`[Email] Sending to=${recipients.join(", ")} subject="${subject}"`);

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: recipients,
    subject,
    html,
  });

  if (error) {
    console.error("[Email] Send failed:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  console.log(`[Email] Sent OK — id=${data?.id}`);
}

export { ADMIN_RECIPIENTS };
