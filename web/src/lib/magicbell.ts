export async function sendMagicBellNotifications(
  recipients: { email: string }[],
  title: string,
  content: string,
  category?: string
) {
  const apiKey = process.env.MAGICBELL_API_KEY;
  const apiSecret = process.env.MAGICBELL_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.warn("MAGICBELL_API_KEY or MAGICBELL_API_SECRET missing; skipping MagicBell notifications");
    return { skipped: true } as const;
  }

  const body = {
    notification: {
      title,
      content,
      category: category || "general",
      recipients,
    },
  };

  const res = await fetch("https://api.magicbell.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-MAGICBELL-API-KEY": apiKey,
      "X-MAGICBELL-API-SECRET": apiSecret,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MagicBell error ${res.status}: ${text}`);
  }

  return await res.json();
}


