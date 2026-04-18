import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const DEFAULT_PDF = "C:/Users/zadca/OneDrive/Desktop/MarvelStudios 2026.pdf";
const inputPath = process.argv[2] ?? DEFAULT_PDF;
const outputPath = process.argv[3] ?? path.resolve("clients.csv");

function inflateStreams(pdfBuffer) {
  const source = pdfBuffer.toString("latin1");
  const streams = [];
  const streamPattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;

  while ((match = streamPattern.exec(source)) !== null) {
    const streamBuffer = Buffer.from(match[1], "latin1");
    try {
      streams.push(zlib.inflateSync(streamBuffer).toString("latin1"));
    } catch {
      try {
        streams.push(zlib.inflateRawSync(streamBuffer).toString("latin1"));
      } catch {
        streams.push("");
      }
    }
  }

  return streams;
}

function buildCMap(streams) {
  const map = new Map();

  for (const stream of streams) {
    if (!stream.includes("begincmap")) {
      continue;
    }

    for (const match of stream.matchAll(
      /<([0-9A-Fa-f]{4})>\s*<([0-9A-Fa-f]{4})>/g
    )) {
      map.set(
        Number.parseInt(match[1], 16),
        String.fromCodePoint(Number.parseInt(match[2], 16))
      );
    }

    for (const match of stream.matchAll(
      /<([0-9A-Fa-f]{4})>\s*<([0-9A-Fa-f]{4})>\s*<([0-9A-Fa-f]{4})>/g
    )) {
      const start = Number.parseInt(match[1], 16);
      const end = Number.parseInt(match[2], 16);
      const mappedStart = Number.parseInt(match[3], 16);

      for (let code = start; code <= end; code += 1) {
        map.set(code, String.fromCodePoint(mappedStart + code - start));
      }
    }
  }

  return map;
}

function decodePdfLiteral(value, cmap) {
  const bytes = [];

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char === "\\") {
      const next = value[++index];
      if (next === undefined) {
        continue;
      }
      if (/[0-7]/.test(next)) {
        let octal = next;
        for (
          let count = 0;
          count < 2 && /[0-7]/.test(value[index + 1]);
          count += 1
        ) {
          octal += value[++index];
        }
        bytes.push(Number.parseInt(octal, 8));
        continue;
      }

      const escaped = {
        n: 10,
        r: 13,
        t: 9,
        b: 8,
        f: 12,
        "(": 40,
        ")": 41,
        "\\": 92,
      }[next];
      bytes.push(escaped ?? next.charCodeAt(0));
      continue;
    }

    bytes.push(char.charCodeAt(0) & 255);
  }

  let decoded = "";
  for (let index = 0; index < bytes.length; index += 2) {
    const code = ((bytes[index] ?? 0) << 8) | (bytes[index + 1] ?? 0);
    decoded += cmap.get(code) ?? String.fromCharCode(code);
  }

  return decoded;
}

function extractTextChunks(streams, cmap) {
  const chunks = [];

  streams.forEach((stream, pageIndex) => {
    if (!stream.includes("BT") || !stream.includes("ET")) {
      return;
    }

    for (const block of stream.matchAll(/BT([\s\S]*?)ET/g)) {
      const body = block[1];
      const tmMatches = [
        ...body.matchAll(
          /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+Tm/g
        ),
      ];
      const transform = tmMatches.at(-1);
      if (!transform) {
        continue;
      }

      let text = "";
      for (const literal of body.matchAll(/\(([^()]*(?:\\.[^()]*)*)\)/g)) {
        text += decodePdfLiteral(literal[1], cmap);
      }

      text = text.replace(/\s+/g, " ").trim();
      if (!text) {
        continue;
      }

      chunks.push({
        pageIndex,
        x: Number.parseFloat(transform[5]),
        y: Number.parseFloat(transform[6]),
        text,
      });
    }
  });

  return chunks;
}

function groupLines(chunks) {
  const byPage = new Map();
  for (const chunk of chunks) {
    const pageChunks = byPage.get(chunk.pageIndex) ?? [];
    pageChunks.push(chunk);
    byPage.set(chunk.pageIndex, pageChunks);
  }

  const lines = [];
  for (const [pageIndex, pageChunks] of byPage) {
    pageChunks.sort((a, b) => a.y - b.y || a.x - b.x);
    let current = [];
    let currentY = null;

    for (const chunk of pageChunks) {
      if (currentY === null || Math.abs(chunk.y - currentY) <= 4) {
        current.push(chunk);
        currentY = currentY === null ? chunk.y : currentY;
        continue;
      }

      lines.push({ pageIndex, chunks: current.sort((a, b) => a.x - b.x) });
      current = [chunk];
      currentY = chunk.y;
    }

    if (current.length > 0) {
      lines.push({ pageIndex, chunks: current.sort((a, b) => a.x - b.x) });
    }
  }

  return lines;
}

function normalizePhone(value) {
  const digits = value.replace(/\D/g, "");

  if (/^20?1[0125]\d{8}$/.test(digits)) {
    return digits.startsWith("20") ? `+${digits}` : `+20${digits.slice(1)}`;
  }

  if (/^1[0125]\d{8}$/.test(digits)) {
    return `+20${digits}`;
  }

  if (/^01[0125]\d{8}$/.test(digits)) {
    return `+20${digits.slice(1)}`;
  }

  return null;
}

const ignoredTokens = new Set([
  "active",
  "inactive",
  "hy",
  "hybrid",
  "strength",
  "private",
  "group",
  "sessions",
  "remaining",
  "fees",
  "date",
  "offer",
]);

function cleanName(value) {
  let name = value
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\bHy\b/gi, " ")
    .replace(/\bActive\b|\bInActive\b/gi, " ")
    .replace(/\bStrength\b|\bHybrid\b|\bPrivate\b|\bGroup\b/gi, " ")
    .replace(/\bOffer\b.*$/i, " ")
    .replace(/[|,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  name = name
    .split(" ")
    .map((part) => {
      let normalized = part.replace(/[^A-Za-z0-9'-]/g, "");
      if (/^4/i.test(normalized)) {
        normalized = `Y${normalized.slice(1)}`;
      }
      if (/^5/i.test(normalized)) {
        normalized = `S${normalized.slice(1)}`;
      }
      if (/^l[A-Z]/.test(normalized)) {
        normalized = `El ${normalized.slice(1)}`;
      }
      return normalized;
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!name || /\d/.test(name)) {
    return null;
  }

  const parts = name
    .split(" ")
    .filter((part) => part.length > 1)
    .filter((part) => !ignoredTokens.has(part.toLowerCase()));

  if (parts.length < 2) {
    return null;
  }

  return parts
    .slice(0, 4)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function candidateNamesForLine(textParts, phoneIndex) {
  const before = textParts.slice(0, phoneIndex).reverse();
  const after = textParts.slice(phoneIndex + 1);
  return [...before, ...after].map(cleanName).filter(Boolean);
}

function extractClients(lines) {
  const clients = [];
  const seenPhones = new Set();

  for (const line of lines) {
    const parts = line.chunks.map((chunk) => chunk.text);
    for (let index = 0; index < parts.length; index += 1) {
      const phone = normalizePhone(parts[index]);
      if (!phone || seenPhones.has(phone)) {
        continue;
      }

      const [name] = candidateNamesForLine(parts, index);
      if (!name) {
        continue;
      }

      clients.push({ fullName: name, phone });
      seenPhones.add(phone);

      if (clients.length === 100) {
        return clients;
      }
    }
  }

  return clients;
}

function csvValue(value) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const pdfBuffer = fs.readFileSync(inputPath);
const streams = inflateStreams(pdfBuffer);
const cmap = buildCMap(streams);
const chunks = extractTextChunks(streams, cmap);
const lines = groupLines(chunks);
const clients = extractClients(lines);

if (clients.length < 100) {
  console.warn(`Only extracted ${clients.length} high-confidence clients.`);
}

const csv = [
  "fullName,phone",
  ...clients.map((client) =>
    [client.fullName, client.phone].map(csvValue).join(",")
  ),
].join("\n");

fs.writeFileSync(outputPath, `${csv}\n`, "utf8");
console.log(`Wrote ${clients.length} clients to ${outputPath}`);
