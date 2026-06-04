export async function onRequestGet(context) {
  const { env } = context;
  const kv = env?.MESSAGES;
  if (!kv) {
    return Response.json({ error: "KV binding MESSAGES is missing" }, { status: 500 });
  }

  try {
    const listing = await kv.list({ prefix: "" });
    const keys = listing.keys.slice().sort((a, b) => b.name.localeCompare(a.name));
    const messages = [];

    for (const key of keys.slice(0, 100)) {
      const value = await kv.get(key.name);
      if (!value) continue;
      try {
        messages.push(JSON.parse(value));
      } catch {
        continue;
      }
    }

    return Response.json({ messages });
  } catch (error) {
    return Response.json(
      { error: "Failed to load messages", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env?.MESSAGES;
  if (!kv) {
    return Response.json({ error: "KV binding MESSAGES is missing" }, { status: 500 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let payload = {};

    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else {
      const formData = await request.formData();
      payload = {
        name: formData.get("name"),
        message: formData.get("message"),
      };
    }

    const name = String(payload?.name || "匿名用户").trim().slice(0, 50) || "匿名用户";
    const message = String(payload?.message || "").trim().slice(0, 2000);

    if (!message) {
      return Response.json({ error: "留言内容不能为空" }, { status: 400 });
    }

    const record = {
      id: `${Date.now()}-${crypto.randomUUID()}`,
      name,
      message,
      createdAt: new Date().toISOString(),
    };

    await kv.put(record.id, JSON.stringify(record));
    return Response.json({ ok: true, message: record });
  } catch (error) {
    return Response.json(
      { error: "Failed to save message", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
