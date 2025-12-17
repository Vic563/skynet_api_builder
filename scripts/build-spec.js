import fs from 'fs';
import path from 'path';

const DOC_PATH = process.env.DOC_PATH || '/Users/DT232381/Desktop/skynet-docs/network_api_docs.md';
const OUTPUT_PATH = process.env.OUTPUT_PATH || path.join(process.cwd(), 'src/data/skynetSpec.json');

function sanitizeParamName(name) {
  return name
    .replace(/\\_/g, '_') // unescape underscores
    .replace(/[`]/g, '') // drop backticks
    .replace(/[<>]/g, '') // drop angle brackets from placeholders
    .replace(/[:;,]$/g, '') // strip trailing punctuation
    .trim()
    .replace(/\s+/g, '_'); // collapse whitespace to underscores
}

function readDoc(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function isEndpointHeader(line) {
  return line.startsWith('## ') && !line.startsWith('## Network (Skynet) API Reference');
}

function parse(docText) {
  const lines = docText.split(/\r?\n/);
  const endpoints = [];
  let currentSection = 'General';

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('# ') && !line.startsWith('# Network')) {
      currentSection = line.replace(/^# +/, '').trim();
    }
    if (isEndpointHeader(line)) {
      const nameRaw = line.replace(/^## +/, '').trim();
      const section = currentSection;
      const start = i + 1;
      let end = lines.length;
      for (let j = i + 1; j < lines.length; j++) {
        if (isEndpointHeader(lines[j])) {
          end = j;
          break;
        }
      }
      const chunk = lines.slice(start, end);
      const { method, path: apiPath } = extractMethodAndPath(chunk);
      const params = extractParams(chunk, method, nameRaw);
      const example = extractExample(chunk);
      endpoints.push({
        id: slugify(nameRaw),
        title: nameRaw,
        section,
        method,
        path: apiPath,
        params,
        example
      });
      i = end - 1;
    }
    i += 1;
  }
  return endpoints.filter(e => e.method && e.path);
}

function extractMethodAndPath(chunkLines) {
  const joined = chunkLines.join('\n');
  const match = joined.match(/`(GET|POST|PUT|DELETE|PATCH)\s+([^`]+)`/i);
  if (match) {
    return { method: match[1].toUpperCase(), path: match[2].trim() };
  }
  return { method: null, path: null };
}

function extractParams(chunkLines, method, endpoint) {
  const params = [];
  for (let idx = 0; idx < chunkLines.length; idx++) {
    if (/^\| *Parameter\s*\|/i.test(chunkLines[idx])) {
      // skip header & separator line
      idx += 2;
      for (; idx < chunkLines.length; idx++) {
        const line = chunkLines[idx];
        if (!line.startsWith('|')) break;
        const cells = line.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length < 2) continue;
        const name = sanitizeParamName(cells[0]);
        const description = cells[1];
        const descLower = description.toLowerCase();

        // Determine if parameter is required based on description
        let required = false;

        // If starts with "optional", it's optional
        if (descLower.startsWith('optional')) {
          required = false;
        }
        // If contains "required if" or "required when", it's conditionally required (treat as optional)
        else if (/required\s+if\b/i.test(description) || /required\s+when\b/i.test(description)) {
          required = false;
        }
        // If starts with "Required." (with period) or "Required(" (with parenthesis), it's truly required
        else if (/^required[.(]/i.test(description.trim())) {
          required = true;
        }
        // HEURISTIC: If no marker exists, make educated guess based on context
        else if (!descLower.startsWith('optional') && !descLower.startsWith('required')) {
          // For POST/PUT endpoints (creation/update), assume required unless description suggests otherwise
          if (method === 'POST' || method === 'PUT') {
            // Check for patterns that suggest optional
            const optionalIndicators = [
              /\bdefault/i,
              /\bnull\b/i,
              /\boptional\b/i,
              /\bif\s+\w+/i,  // "if specified", "if provided", etc.
              /\bleft\s+out\b/i,
              /\bcan\s+be\s+left/i,
              /\bcan\s+be\s+null/i,
              /\bmay\s+be\b/i
            ];

            const hasOptionalIndicator = optionalIndicators.some(pattern => pattern.test(description));
            required = !hasOptionalIndicator;
          } else {
            // For GET/DELETE, default to optional
            required = false;
          }
        }
        // Otherwise, default to optional
        else {
          required = false;
        }

        params.push({ name, description, required });
      }
    }
  }
  return params;
}

function extractExample(chunkLines) {
  // Grab first JSON code block after "Example Request"
  const joined = chunkLines.join('\n');
  const reqIndex = joined.indexOf('Example Request');
  if (reqIndex === -1) return null;
  const after = joined.slice(reqIndex);
  const codeMatch = after.match(/```[\s\S]*?\n([\s\S]*?)```/);
  if (codeMatch && codeMatch[1]) {
    const code = codeMatch[1];
    try {
      const parsed = JSON.parse(code);
      return parsed;
    } catch (err) {
      return code.trim();
    }
  }
  return null;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function main() {
  const doc = readDoc(DOC_PATH);
  const endpoints = parse(doc);
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), endpoints }, null, 2));
  console.log(`Wrote ${endpoints.length} endpoints to ${OUTPUT_PATH}`);
}

main();
