const fs = require('fs');
const content = fs.readFileSync('artifacts/erkan-ai/src/lib/i18n.tsx', 'utf8');

// Use a simple regex to extract keys from each dictionary
function extractKeys(lang) {
  const marker = lang + ": {";
  const start = content.indexOf(marker);
  if (start === -1) return [];
  const end = content.indexOf("},", start);
  const block = content.slice(start, end);
  const keys = [];
  const regex = /^\s*([a-zA-Z0-9_]+):/gm;
  let match;
  while ((match = regex.exec(block)) !== null) {
    keys.push(match[1]);
  }
  return keys;
}

const syrianKeys = extractKeys('syrian');
const turkishKeys = extractKeys('turkish');

const missingInTurkish = syrianKeys.filter(k => !turkishKeys.includes(k));
console.log("Missing in Turkish:", missingInTurkish);

const missingInSaudi = syrianKeys.filter(k => !extractKeys('saudi').includes(k));
console.log("Missing in Saudi:", missingInSaudi);

