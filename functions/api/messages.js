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
  const cf = (request && request.cf) || (context.request && context.request.cf) || {};
  const location = getChineseLocation(cf.city, cf.country);
  const record = { id: `${Date.now()}-${crypto.randomUUID()}`, name, message, location, createdAt: new Date().toISOString() };
  await env.MESSAGES.put(record.id, JSON.stringify(record));
  return Response.json({ ok: true, message: record });
}
function getChineseLocation(city, country) {
  if (typeof city === "string" && city.trim()) return city.trim();
  if (typeof country !== "string" || !country.trim()) return "未知";
  const code = country.trim().toUpperCase();
  const map = { CN: "中国", JP: "日本", KR: "韩国", US: "美国", HK: "中国香港", MO: "中国澳门", TW: "中国台湾", SG: "新加坡", MY: "马来西亚", TH: "泰国", VN: "越南", PH: "菲律宾", ID: "印度尼西亚", AU: "澳大利亚", CA: "加拿大", GB: "英国", DE: "德国", FR: "法国", IT: "意大利", ES: "西班牙", RU: "俄罗斯", IN: "印度", BR: "巴西", NZ: "新西兰", NL: "荷兰", SE: "瑞典", CH: "瑞士", DK: "丹麦", NO: "挪威", FI: "芬兰", MX: "墨西哥", TR: "土耳其", SA: "沙特阿拉伯", AE: "阿联酋" };
  return map[code] || "未知";
}