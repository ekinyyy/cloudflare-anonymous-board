export async function onRequestGet(context) {
  const { env } = context;
  const list = await env.MESSAGES.list({ limit: 1000 });
  const items = [];
  for (const key of list.keys) {
    const value = await env.MESSAGES.get(key.name, "json");
    if (value) items.push(value);
  }
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return Response.json({ messages: items });
}
export async function onRequestPost(context) {
  const { request, env } = context;
  const formData = await request.formData();
  const name = String(formData.get("name") || "Anonymous").trim().slice(0, 50);
  const message = String(formData.get("message") || "").trim().slice(0, 2000);
  if (!message) return Response.json({ error: "Message is required" }, { status: 400 });
  const record = { id: crypto.randomUUID(), name: name || "Anonymous", message, createdAt: new Date().toISOString() };
  await env.MESSAGES.put(record.id, JSON.stringify(record));
  return Response.json({ ok: true, message: record });
}