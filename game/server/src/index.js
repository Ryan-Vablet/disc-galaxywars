import http from "node:http";

const PORT = Number(process.env.PORT ?? 8787);

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      ok: true,
      service: "disc-galaxywars-server",
      status: "mock",
    }),
  );
});

server.listen(PORT, () => {
  console.log(`[server] mock server listening on :${PORT}`);
  console.log("[server] TODO: implement HTTP/WebSocket backend here.");
});
