export async function onRequestGet(context) {
  const { env } = context;
  const listing = await env.MESSAGES.list({ prefix: "" });
  const keys = listing.keys.slice().sort((a, b) => b.name.localeCompare(a.name));
  const messages = [];
  for (const key of keys.slice(0, 100)) {
    const value = await env.MESSAGES.get(key.name);
    if (!value) continue;
    try {
      messages.push(JSON.parse(value));
    } catch {
      continue;
    }
  }
  return Response.json({ messages });
}
export async function onRequestPost(context) {
  const { request, env } = context;
  const formData = await request.formData();
  const name = String(formData.get("name") || "匿名用户").trim().slice(0, 50) || "匿名用户";
  const message = String(formData.get("message") || "").trim().slice(0, 2000);
  if (!message) return Response.json({ error: "留言内容不能为空" }, { status: 400 });
  const record = { id: `${Date.now()}-${crypto.randomUUID()}`, name, message, createdAt: new Date().toISOString() };
  await env.MESSAGES.put(record.id, JSON.stringify(record));
  return Response.json({ ok: true, message: record });
}