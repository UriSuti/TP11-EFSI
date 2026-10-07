// Hook "Stop" de Claude Code: vuelca la conversación (mensajes del usuario y
// respuestas de Claude) a chat-historial.md en la raíz del proyecto.
// Cada sesión ocupa su propio bloque delimitado y se regenera completo desde
// el transcript en cada turno, así nunca se duplica ni se pierde nada.
const fs = require("fs");
const path = require("path");

const OUTPUT_NAME = "chat-historial.md";

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

// Quita bloques que el IDE o el sistema inyectan en el mensaje del usuario.
function cleanUserText(text) {
  return text
    .replace(/<(system-reminder|ide_selection|ide_opened_file|ide_diagnostics)>[\s\S]*?<\/\1>/g, "")
    .trim();
}

function textBlocks(content) {
  if (typeof content === "string") return [content];
  if (!Array.isArray(content)) return [];
  return content.filter((b) => b && b.type === "text" && b.text).map((b) => b.text);
}

function isToolResult(content) {
  return Array.isArray(content) && content.some((b) => b && b.type === "tool_result");
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function buildTurns(transcriptPath) {
  const lines = fs.readFileSync(transcriptPath, "utf8").split("\n").filter(Boolean);
  const turns = [];
  let current = null;

  for (const line of lines) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry.isSidechain || entry.isMeta || entry.isCompactSummary) continue;
    const content = entry.message && entry.message.content;

    if (entry.type === "user") {
      // Avisos automáticos (p. ej. tareas en segundo plano) no los escribió el usuario.
      if (isToolResult(content) || entry.promptSource === "system") continue;
      const text = textBlocks(content).map(cleanUserText).filter(Boolean).join("\n\n");
      // Salidas de comandos locales (/hooks, /config...) no son mensajes reales.
      if (!text || /^<(local-command-|command-name>|task-notification>)/.test(text)) continue;
      current = { time: entry.timestamp, user: text, claude: [] };
      turns.push(current);
    } else if (entry.type === "assistant" && current) {
      for (const t of textBlocks(content)) {
        if (t.trim()) current.claude.push(t.trim());
      }
    }
  }
  return turns;
}

function renderSession(sessionId, turns) {
  const start = turns.length ? formatTime(turns[0].time) : "";
  let md = `## Sesión ${start} \`${sessionId.slice(0, 8)}\`\n\n`;
  turns.forEach((turn, i) => {
    md += `### Usuario — ${formatTime(turn.time)}\n\n${turn.user}\n\n`;
    md += `### Claude\n\n${turn.claude.length ? turn.claude.join("\n\n") : "_(sin respuesta de texto)_"}\n\n`;
    if (i < turns.length - 1) md += "---\n\n";
  });
  return md.trimEnd() + "\n";
}

function main() {
  const input = readStdin();
  const transcriptPath = input.transcript_path;
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return;

  const sessionId = input.session_id || path.basename(transcriptPath, ".jsonl");
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const outFile = path.join(projectDir, OUTPUT_NAME);

  const turns = buildTurns(transcriptPath);
  // Por si el transcript aún no tiene volcada la última respuesta.
  const last = turns[turns.length - 1];
  if (last && typeof input.last_assistant_message === "string") {
    const msg = input.last_assistant_message.trim();
    if (msg && !last.claude.some((t) => t.includes(msg))) last.claude.push(msg);
  }
  if (!turns.length) return;

  const begin = `<!-- session:${sessionId} -->`;
  const end = `<!-- /session:${sessionId} -->`;
  const block = `${begin}\n${renderSession(sessionId, turns)}${end}`;

  let doc = fs.existsSync(outFile)
    ? fs.readFileSync(outFile, "utf8")
    : "# Historial del chat con Claude\n";

  const startIdx = doc.indexOf(begin);
  const endIdx = doc.indexOf(end);
  if (startIdx !== -1 && endIdx > startIdx) {
    doc = doc.slice(0, startIdx) + block + doc.slice(endIdx + end.length);
  } else {
    doc = doc.trimEnd() + "\n\n" + block + "\n";
  }
  fs.writeFileSync(outFile, doc, "utf8");
}

main();
