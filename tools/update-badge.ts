import * as fs from 'fs';
import * as path from 'path';

const lcovPath = path.join(process.cwd(), 'coverage/lcov.info');
const readmePath = path.join(process.cwd(), 'README.md');

if (!fs.existsSync(lcovPath)) {
  console.error('LCOV info file not found at:', lcovPath);
  process.exit(1);
}

const lcovContent = fs.readFileSync(lcovPath, 'utf8');
let totalLF = 0;
let totalLH = 0;

const lines = lcovContent.split('\n');
lines.forEach((line) => {
  if (line.startsWith('LF:')) {
    totalLF += parseInt(line.substring(3), 10);
  } else if (line.startsWith('LH:')) {
    totalLH += parseInt(line.substring(3), 10);
  }
});

const coveragePct = totalLF === 0 ? 0 : (totalLH / totalLF) * 100;
// Format to 2 decimal places, but if integer, keep it integer-like in display if preferred,
// using toFixed(0) matches standard integer badges usually. Let's use toFixed(0) for cleanliness
// or toFixed(2) for precision. Let's go with integer for badge.
const totalCoverage = coveragePct.toFixed(0);

const color =
  coveragePct >= 80 ? 'brightgreen' : coveragePct >= 50 ? 'yellow' : 'red';
const badgeUrl = `https://img.shields.io/badge/Coverage-${totalCoverage}%25-${color}`;
const badgeMarkdown = `<img src="${badgeUrl}" alt="Coverage" />`;

let readmeContent = fs.readFileSync(readmePath, 'utf8');
const regex =
  /<img src="https:\/\/img\.shields\.io\/badge\/Coverage-.*?" alt="Coverage" \/>/;

if (regex.test(readmeContent)) {
  readmeContent = readmeContent.replace(regex, badgeMarkdown);
  fs.writeFileSync(readmePath, readmeContent);
  console.log(`Updated README with coverage badge: ${totalCoverage}%`);
} else {
  console.error('Badge placeholder not found in README.md');
  process.exit(1);
}
