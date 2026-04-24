const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function safeExec(command, fallback = '') {
  try {
    return execSync(command).toString().trim();
  } catch {
    return fallback;
  }
}

const buildSha = safeExec('git rev-parse --short HEAD', 'unknown');
const buildDate = new Date().toISOString();

const content = `export const versionInfo = {
  buildSha: '${buildSha}',
  buildDate: '${buildDate}'
};
`;

const outputPath = path.join(__dirname, '../src/environments/version.ts');
fs.writeFileSync(outputPath, content);

console.log('version.ts updated');