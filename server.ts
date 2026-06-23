import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server } from "socket.io";
import { attachSocketHandlers } from "./server/socket-handlers";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "", true);
    void handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: dev ? true : (process.env.CLIENT_ORIGIN ?? `http://${hostname}:${port}`),
      methods: ["GET", "POST"],
    },
  });

  attachSocketHandlers(io);

  httpServer.listen(port, () => {
    console.log(`> App ready on http://${hostname}:${port}`);
    console.log(`> Socket.io on http://${hostname}:${port}/socket.io`);
  });
});
