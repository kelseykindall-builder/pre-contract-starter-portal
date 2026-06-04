// Vercel serverless function — posts a Slack notification when a starter
// signals they're ready for their contract from the pre-contract landing page.
//
// Setup: add a Slack Incoming Webhook URL (pointed at #starter-economy) as the
// SLACK_WEBHOOK_URL environment variable in the Vercel project settings.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    return res.status(500).json({ ok: false, error: "Slack webhook not configured" });
  }

  // Vercel parses JSON bodies automatically; fall back to manual parse just in case.
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const followers = String(body.followers || "").trim();
  const tier = String(body.tier || "").trim();
  const petitionIdea = String(body.petitionIdea || "").trim();
  const starterToken = String(body.starterToken || "").trim();
  const type = body.type === "petition-idea" ? "petition-idea" : "contract";

  if (type === "contract" && (!name || !email)) {
    return res.status(400).json({ ok: false, error: "Name and email are required" });
  }

  // Build the Slack message.
  let text;
  const lines = [];
  if (type === "petition-idea") {
    if (!petitionIdea) {
      return res.status(400).json({ ok: false, error: "Petition idea is empty" });
    }
    text = `:bulb: *${name || "A starter"}* shared a petition idea`;
    lines.push(text);
    lines.push(`> ${petitionIdea}`);
    if (email) lines.push(`:email: ${email}`);
  } else {
    text = `:tada: *${name}* is ready for their contract!`;
    lines.push(text);
    lines.push(`:email: ${email}`);
    // Followers + tier come from the calculator on the page. If the starter
    // didn't use it, fall back to "unknown" so the line is always present.
    const followersText = followers ? `${followers} followers` : "Followers: unknown";
    const tierText = tier ? tier : "Tier: unknown";
    lines.push(`:busts_in_silhouette: ${followersText} · ${tierText}`);
    // Petition idea is only sent if they entered one — otherwise the line is omitted.
    if (petitionIdea) lines.push(`:bulb: Petition idea: ${petitionIdea}`);
    if (starterToken) lines.push(`:link: starter token: \`${starterToken}\``);
    lines.push(`_Sent from the pre-contract landing page — send the DocuSign agreement._`);
  }

  // Send both shapes so the same function works whether SLACK_WEBHOOK_URL is a
  // classic Incoming Webhook (renders `text`) or a Slack Workflow Builder webhook
  // (maps the named string fields to its own message template).
  const payload = {
    text: lines.join("\n"),
    type,
    name,
    email,
    followers,
    tier,
    petitionIdea,
    starterToken,
  };

  try {
    const slackRes = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!slackRes.ok) {
      const detail = await slackRes.text();
      return res.status(502).json({ ok: false, error: "Slack rejected the message", detail });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Failed to reach Slack", detail: String(err) });
  }
}
