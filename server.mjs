import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicRoot = path.normalize(path.join(__dirname, "public"));
const srcRoot = path.normalize(path.join(__dirname, "src"));

const requestedPort = Number(process.env.PORT || 5500);
const maxPortAttempts = 20;

const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
    const rawPath = req.url?.split("?")[0] ?? "/";
    const normalizedPath = rawPath === "/" || rawPath === "/example.html" ? "/index.html" : rawPath;

    let filePath;
    if (normalizedPath.startsWith("/src/")) {
        const relativeSrcPath = normalizedPath.replace(/^\/+/, "");
        filePath = path.normalize(path.join(__dirname, relativeSrcPath));
    } else {
        const relativePublicPath = normalizedPath.replace(/^\/+/, "");
        filePath = path.normalize(path.join(publicRoot, relativePublicPath));
    }

    const isAllowed =
        filePath.startsWith(publicRoot) ||
        filePath.startsWith(srcRoot);

    if (!isAllowed) {
        res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Forbidden");
        return;
    }

    fs.readFile(filePath, (error, data) => {
        if (error) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end(`Not found: ${normalizedPath}`);
            return;
        }

        const extension = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[extension] || "application/octet-stream";

        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    });
});

let currentPort = requestedPort;
let attempts = 0;
const explicitPort = Boolean(process.env.PORT);

server.on("error", (error) => {
    if (error.code !== "EADDRINUSE") {
        console.error("Erro ao iniciar servidor:", error);
        process.exit(1);
    }

    if (explicitPort) {
        console.error(`Porta ${requestedPort} já está em uso. Defina outra com PORT=xxxx.`);
        process.exit(1);
    }

    attempts += 1;
    if (attempts > maxPortAttempts) {
        console.error(
            `Não foi possível iniciar o servidor após ${maxPortAttempts} tentativas de porta.`
        );
        process.exit(1);
    }

    currentPort += 1;
    console.warn(`Porta em uso. Tentando http://localhost:${currentPort} ...`);
    server.listen(currentPort);
});

server.listen(currentPort, () => {
    console.log(`Servidor local em http://localhost:${currentPort}`);
    console.log("Abra /index.html para testar a biblioteca.");
});
