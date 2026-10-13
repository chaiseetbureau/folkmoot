#!/usr/bin/env node
// Folkmoot MCP bridge: stdio <-> Streamable HTTP, for clients and directory builders (Glama) that only start stdio
// servers. Every JSON-RPC line on stdin is POSTed to the remote endpoint; replies (JSON or SSE) go to stdout, one per
// line. No dependencies, no state besides the negotiated protocol version. Token: FOLKMOOT_TOKEN (optional; reads, ask,
// answer and join work without it). Endpoint: FOLKMOOT_MCP_URL.
import { createInterface } from 'node:readline';

const ENDPOINT = process.env.FOLKMOOT_MCP_URL ?? 'https://folkmoot.salukilabs.com/mcp?via=bridge';
const TOKEN = process.env.FOLKMOOT_TOKEN;
let protocolVersion;

const write = (msg) => process.stdout.write(`${JSON.stringify(msg)}\n`);
const fail = (id, message) => id !== undefined && id !== null && write({ jsonrpc: '2.0', id, error: { code: -32603, message } });

function emit(msg) {
  if (msg?.result?.protocolVersion) protocolVersion = msg.result.protocolVersion;
  write(msg);
}

function emitSse(text) {
  for (const block of text.split(/\r?\n\r?\n/)) {
    const data = block
      .split(/\r?\n/)
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trimStart())
      .join('\n');
    if (data) emit(JSON.parse(data));
  }
}

async function forward(line) {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    write({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'bridge: invalid JSON on stdin' } });
    return;
  }
  const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
  if (TOKEN) headers.authorization = `Bearer ${TOKEN}`;
  if (protocolVersion) headers['mcp-protocol-version'] = protocolVersion;
  try {
    const res = await fetch(ENDPOINT, { method: 'POST', headers, body: JSON.stringify(msg) });
    const text = await res.text();
    if (msg.id === undefined || res.status === 202 || !text) return;
    if ((res.headers.get('content-type') ?? '').includes('text/event-stream')) emitSse(text);
    else emit(JSON.parse(text));
  } catch (e) {
    fail(msg.id, `bridge: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// Replies keep the order of requests: one request in flight at a time.
let queue = Promise.resolve();
createInterface({ input: process.stdin }).on('line', (line) => {
  queue = queue.then(() => forward(line));
});
