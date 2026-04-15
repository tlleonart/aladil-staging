import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "mail.aladil.org",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const FROM_ADDRESS = `"Intranet ALADIL" <${process.env.MAIL_USER || "intranet@aladil.org"}>`;

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
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn(
      "[Email] MAIL_USER/MAIL_PASS not configured, skipping email.",
      `MAIL_USER=${process.env.MAIL_USER ? "set" : "missing"}, MAIL_PASS=${process.env.MAIL_PASS ? "set" : "missing"}`,
    );
    return;
  }

  const recipients = Array.isArray(to) ? to.join(", ") : to;

  console.log(
    `[Email] Sending to=${recipients} subject="${subject}" from=${FROM_ADDRESS} via ${transporter.options.host}:${transporter.options.port}`,
  );

  try {
    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to: recipients,
      subject,
      html,
    });
    console.log(
      `[Email] Sent OK — messageId=${info.messageId} accepted=${info.accepted} rejected=${info.rejected}`,
    );
  } catch (err) {
    console.error("[Email] Send failed:", err);
    throw err;
  }
}

export { ADMIN_RECIPIENTS };
