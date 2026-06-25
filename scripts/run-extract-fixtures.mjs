import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturesPath = path.join(rootDir, "tests", "extract-fixtures.json");
const promptPath = path.join(rootDir, "lib", "extraction", "prompt.md");
const schemaPath = path.join(rootDir, "lib", "extraction", "schema.json");

const apiKey = process.env.LLM_API_KEY;
const model = process.env.LLM_MODEL;
const apiUrl = process.env.LLM_API_URL ?? "https://api.openai.com/v1/chat/completions";

if (!apiKey || !model) {
  console.error("Missing LLM_API_KEY or LLM_MODEL.");
  console.error("");
  console.error("Example:");
  console.error("  LLM_API_KEY=... LLM_MODEL=... node scripts/run-extract-fixtures.mjs");
  console.error("");
  console.error("Optional:");
  console.error("  LLM_API_URL=https://api.openai.com/v1/chat/completions");
  process.exit(1);
}

const [fixturesRaw, systemPrompt, schemaRaw] = await Promise.all([
  readFile(fixturesPath, "utf8"),
  readFile(promptPath, "utf8"),
  readFile(schemaPath, "utf8")
]);

const fixtures = JSON.parse(fixturesRaw);
const schema = JSON.parse(schemaRaw);

let failed = 0;

for (const testCase of fixtures.tests) {
  const actual = await extract(testCase);
  const expected = testCase.expected;
  const expectedJson = stableStringify(expected);
  const actualJson = stableStringify(actual);
  const passed = expectedJson === actualJson;

  console.log(`${passed ? "PASS" : "FAIL"} ${testCase.name}`);

  if (!passed) {
    failed += 1;
    console.log(diffLines(expectedJson, actualJson));
  }
}

if (failed > 0) {
  console.error(`\n${failed} fixture(s) failed.`);
  process.exit(1);
}

console.log("\nAll extraction fixtures passed.");

async function extract(testCase) {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            "Extract the invoice JSON for this transcript.",
            "",
            "The output must match this JSON Schema:",
            JSON.stringify(schema),
            "",
            "Canonical menu:",
            JSON.stringify(fixtures.canonical_menu),
            "",
            "Transcript:",
            transcriptToText(testCase.transcript)
          ].join("\n")
        }
      ]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error(`Could not find model JSON content in response: ${JSON.stringify(payload)}`);
  }

  return JSON.parse(content);
}

function transcriptToText(transcript) {
  return transcript.map((turn) => `${turn.speaker}: ${turn.text}`).join("\n");
}

function stableStringify(value) {
  return JSON.stringify(sortKeys(value), null, 2);
}

function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nestedValue]) => [key, sortKeys(nestedValue)])
    );
  }

  return value;
}

function diffLines(expectedJson, actualJson) {
  const expectedLines = expectedJson.split("\n");
  const actualLines = actualJson.split("\n");
  const max = Math.max(expectedLines.length, actualLines.length);
  const output = ["--- expected", "+++ actual"];

  for (let i = 0; i < max; i += 1) {
    const expectedLine = expectedLines[i];
    const actualLine = actualLines[i];

    if (expectedLine === actualLine) {
      continue;
    }

    if (expectedLine !== undefined) {
      output.push(`- ${expectedLine}`);
    }

    if (actualLine !== undefined) {
      output.push(`+ ${actualLine}`);
    }
  }

  return output.join("\n");
}
