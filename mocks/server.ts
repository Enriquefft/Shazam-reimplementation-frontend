const server = Bun.serve({
  port: 0,
  async fetch(req) {
    const path = new URL(req.url).pathname;
    if (req.method === "POST" && path === "/form") {
      const data = await req.formData();
      console.log(data.get("audio_data"));
      console.log(data.get("type"));

      for (const [key, value] of data.entries()) {
        console.log(key, value);
      }

      return new Response("Success");
    }
    return new Response("Page not found", { status: 404 });
  },
});

console.log(server.port);
console.log(server.url);
