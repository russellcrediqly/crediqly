#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const versionJsonPath = path.join(__dirname, '..', 'src', 'version.json');
const packageJsonPath = path.join(__dirname, '..', 'package.json');

try {
  let versionInfo = { version: '3.8.0', build: 0, updatedAt: new Date().toISOString() };
  if (fs.existsSync(versionJsonPath)) {
    try {
      versionInfo = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
    } catch (e) {}
  }

  const parts = (versionInfo.version || '3.8.0').split('.').map((p) => parseInt(p, 10) || 0);
  let major = Math.max(3, parts[0] || 3);
  let minor = major === 3 ? Math.max(8, parts[1] || 8) : parts[1] || 0;
  let patch = parts[2] !== undefined ? parts[2] : 0;
  let build = (versionInfo.build || 0) + 1;

  // On first build (build 1), start cleanly at 3.8.0; on subsequent builds increment patch
  if (build > 1) {
    patch += 1;
  }

  const newVersion = `${major}.${minor}.${patch}`;
  const updatedData = {
    version: newVersion,
    build,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(versionJsonPath, JSON.stringify(updatedData, null, 2) + '\n', 'utf8');

  // Also update package.json version
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    pkg.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }

  console.log(`[Crediqly Version Bump] Application version: v${newVersion} (Build #${build})`);
} catch (err) {
  console.warn('[Crediqly Version Bump] Warning: Could not update version file:', err.message);
}
