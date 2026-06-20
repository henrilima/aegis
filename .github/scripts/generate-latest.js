const fs = require("fs");
const path = require("path");

const [assetsDir, outputPath, tag, repo] = process.argv.slice(2);

if (!assetsDir || !outputPath || !tag || !repo) {
  console.error(
    "Usage: node .github/scripts/generate-latest.js <assetsDir> <outputPath> <tag> <owner/repo>",
  );
  process.exit(1);
}

const version = tag.replace(/^v/, "");
const releaseBaseUrl = `https://github.com/${repo}/releases/download/${tag}`;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function normalize(value) {
  return value.replace(/\\/g, "/").toLowerCase();
}

function findAsset(files, predicate) {
  return files.find((file) => predicate(normalize(file)));
}

function readSignature(assetPath) {
  const sigPath = `${assetPath}.sig`;
  if (!fs.existsSync(sigPath)) {
    throw new Error(`Missing updater signature for ${assetPath}`);
  }

  return fs.readFileSync(sigPath, "utf8").trim();
}

function releaseUrl(assetPath) {
  return `${releaseBaseUrl}/${encodeURIComponent(path.basename(assetPath))}`;
}

function addPlatform(platforms, key, assetPath) {
  if (!assetPath) return;

  platforms[key] = {
    signature: readSignature(assetPath),
    url: releaseUrl(assetPath),
  };
}

const files = walk(assetsDir);
const platforms = {};

const windowsAsset = findAsset(
  files,
  (file) => file.endsWith(".exe") && !file.endsWith(".exe.sig"),
);
const linuxAsset = findAsset(
  files,
  (file) => file.endsWith(".appimage") && !file.endsWith(".appimage.sig"),
);
const macAsset = findAsset(files, (file) => file.endsWith(".app.tar.gz"));

addPlatform(platforms, "windows-x86_64", windowsAsset);
addPlatform(platforms, "linux-x86_64", linuxAsset);

if (macAsset) {
  const macPath = normalize(macAsset);
  const macPlatform =
    macPath.includes("arm64") || macPath.includes("aarch64")
      ? "darwin-aarch64"
      : "darwin-x86_64";
  addPlatform(platforms, macPlatform, macAsset);
}

if (Object.keys(platforms).length === 0) {
  throw new Error(`No updater assets found in ${assetsDir}`);
}

const latest = {
  version,
  notes: "Atualizacao automatica do Sistema Aegis.",
  pub_date: new Date().toISOString(),
  platforms,
};

fs.writeFileSync(outputPath, `${JSON.stringify(latest, null, 2)}\n`);
console.log(`Generated ${outputPath} for: ${Object.keys(platforms).join(", ")}`);
