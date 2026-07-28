const fs = require("node:fs");
const path = require("node:path");

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
  if (fs.existsSync(sigPath)) {
    return fs.readFileSync(sigPath, "utf8").trim();
  }

  const dir = path.dirname(assetPath);
  const baseName = path.basename(assetPath);
  if (fs.existsSync(dir)) {
    const candidateSig = fs
      .readdirSync(dir)
      .find((f) => f.startsWith(baseName) && f.endsWith(".sig"));
    if (candidateSig) {
      return fs.readFileSync(path.join(dir, candidateSig), "utf8").trim();
    }
  }

  console.warn(`[WARNING] Missing updater signature for ${assetPath}`);
  return "";
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
  (file) => file.endsWith(".exe") && !file.endsWith(".sig"),
);
const linuxAsset = findAsset(
  files,
  (file) =>
    (file.endsWith(".deb") ||
      file.endsWith(".appimage") ||
      file.endsWith(".tar.gz")) &&
    !file.endsWith(".sig"),
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
console.log(
  `Generated ${outputPath} for: ${Object.keys(platforms).join(", ")}`,
);
