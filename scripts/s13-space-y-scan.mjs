// Session-13 static sweep: the space-y trap-log #4 scan (a margin utility on
// a DIRECT child of a space-y-* container). Stack-based JSX walk per the
// session-12 lesson (=> in JSX attrs breaks naive tag regexes; grandchild
// margins are false positives — only direct children count).
//
// Reports: element + line + the margin class + the enclosing space-y class.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";
const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(tsx|jsx)$/.test(f)) files.push(p);
  }
})(ROOT);

// A JSX "open tag" ends at '>' that is not inside a string/attr — we track a
// char walk with quote/brace state and record the tag's class attr when it
// contains space-y-*, then watch its DIRECT children.
const hits = [];
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");

  // Simple stack-based scanner: track open elements with their class string +
  // line. When an element with space-y opens, look at subsequently opened
  // elements until the container's closing depth. Only depth-1 children count.
  const stack = []; // {tag, cls, line, depthAtOpen}
  let i = 0, line = 1;
  const n = src.length;
  let inStr = null; // quote char
  while (i < n) {
    const c = src[i];
    if (c === "\n") { line++; i++; continue; }
    if (inStr) {
      if (c === "\\") { i += 2; continue; }
      if (c === inStr) inStr = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { inStr = c; i++; continue; }
    if (c === "<" && src[i + 1] && /[A-Za-z]/.test(src[i + 1])) {
      // open tag: read until '>' honoring quotes
      let j = i + 1, tagStr = "";
      let q = null;
      while (j < n) {
        const d = src[j];
        if (q) { if (d === q) q = null; else { tagStr += d; j++; continue; } }
        else if (d === '"' || d === "'") { q = d; tagStr += d; }
        else if (d === ">") break;
        else tagStr += d;
        j++;
      }
      const tagMatch = tagStr.match(/^([A-Za-z][A-Za-z0-9.]*)/);
      const selfClose = /\/\s*$/.test(tagStr);
      const clsMatch = tagStr.match(/className=\{?"([^"]*)"/) || tagStr.match(/className=\{`([^`]*)`}/);
      const cls = clsMatch ? clsMatch[1] : "";
      stack.push({ tag: tagMatch ? tagMatch[1] : "?", cls, line, selfClose });
      if (selfClose) {
        // check the element itself as a potential child
        const parent = stack[stack.length - 2];
        check(parent, stack[stack.length - 1], file, lines, hits);
        stack.pop();
      }
      i = j + 1;
      continue;
    }
    if (c === "<" && src[i + 1] === "/") {
      // close tag: pop until matching
      let j = i + 2;
      while (j < n && src[j] !== ">") j++;
      const closeName = src.slice(i + 2, j).trim().split(/[\s>]/)[0];
      for (let k = stack.length - 1; k >= 0; k--) {
        if (stack[k].tag === closeName || stack[k].tag.split(".").pop() === closeName) {
          stack.length = k;
          break;
        }
      }
      i = j + 1;
      continue;
    }
    i++;
  }
}

function check(parent, child, file, lines, hits) {
  if (!parent) return;
  if (!/space-y-/.test(parent.cls)) return;
  const m = child.cls.match(/(^|\s)(-?(?:m|mt|mb|my)-\S+)/);
  if (m) {
    hits.push({ file, line: child.line, child: child.tag, margin: m[2], parentCls: parent.cls, context: (lines[child.line - 1] || "").trim().slice(0, 100) });
  }
}

console.log(hits.length === 0 ? "NO direct-child margin instances (clean)" : JSON.stringify(hits, null, 1));
