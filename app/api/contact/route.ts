import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "info@globalkazgrouptechnology.kz";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const { name, email, phone, message } = body as Record<string, string>;

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Укажите имя (минимум 2 символа)." }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Укажите корректный email." }, { status: 400 });
  }
  if (!phone || phone.trim().length < 7) {
    return NextResponse.json({ error: "Укажите номер телефона." }, { status: 400 });
  }
  if (!message || message.trim().length < 5) {
    return NextResponse.json({ error: "Сообщение слишком короткое (минимум 5 символов)." }, { status: 400 });
  }

  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:10px 14px;font-weight:600;color:#94a3b8;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:10px 14px;color:#f0f4ff;">${value}</td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#050d1a;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050d1a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#080f1c;border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#06b6d4);padding:28px 32px;">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Новая заявка с сайта</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">GlobalKazGroup Technology</p>
          </td>
        </tr>
        <!-- Fields -->
        <tr><td style="padding:8px 18px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${row("Имя", esc(name.trim()))}
            ${row("Email", `<a href="mailto:${esc(email)}" style="color:#06b6d4;">${esc(email)}</a>`)}
            ${row("Телефон", `<a href="tel:${esc(phone.trim())}" style="color:#06b6d4;">${esc(phone.trim())}</a>`)}
            ${row("Сообщение", esc(message.trim()).replace(/\n/g, "<br>"))}
          </table>
        </td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.07);color:#475569;font-size:12px;">
            Заявка поступила автоматически с сайта globalkazgrouptechnology.kz
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: "GlobalKazGroup Website <onboarding@resend.dev>",
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `Новая заявка от ${name.trim()}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contact] resend error:", err);
    return NextResponse.json(
      { error: "Не удалось отправить сообщение. Попробуйте позже." },
      { status: 500 }
    );
  }
}
