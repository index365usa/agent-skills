#!/usr/bin/env node
/**
 * Lint the index365 skills repo. Zero dependencies (node: builtins only).
 *
 * Checks, per skill:
 *   - skills/<dir>/SKILL.md exists
 *   - YAML frontmatter present (--- … ---) and <= 1024 chars (agentskills.io spec)
 *   - `name:` present, matches ^[a-z0-9-]+$, and equals the directory name
 *   - `description:` present and non-trivial
 *   - `allowed-tools:` present
 *   - body (after frontmatter) < 500 lines
 * Plus repo-level:
 *   - .claude-plugin/plugin.json and marketplace.json each list EXACTLY the skill
 *     dirs (no drift, no missing, no extras)
 *   - no stray top-level entries under skills/ that aren't directories with a SKILL.md
 *   - no version-pinned install line for a watched package in any .md (see below)
 *
 * Exit 0 = clean, 1 = one or more failures.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(ROOT, "skills");
const MAX_FRONTMATTER_CHARS = 1024;
const MAX_BODY_LINES = 500;
const NAME_RE = /^[a-z0-9-]+$/;

/**
 * Version-pin drift guard.
 *
 * Docs must not pin a version for these packages. A pinned install line in
 * Markdown goes stale the moment the package publishes, and this repo shipped a
 * stale README pin twice. Unpinned lines cannot drift, and the index365 CLI
 * reports its own updates, so there is nothing to gain by pinning here.
 *
 * The default check is OFFLINE and is what CI runs: a pin for a watched package
 * is a failure on its own, no registry lookup needed. That keeps the required
 * `lint-skills` gate hermetic, so a registry outage can never turn it red.
 *
 * `--check-latest` (or LINT_CHECK_LATEST=1) additionally resolves each watched
 * package's published `latest` from the npm registry and reports drift. Use it
 * locally or in a scheduled job, not in the required gate.
 *
 * If a pin is ever genuinely required, add it to ALLOWED_PINS. Offline runs then
 * accept it and `--check-latest` is what proves it still matches `latest`.
 */
const WATCHED_PACKAGES = ["@index365/cli", "@index365/mcp", "skills"];
/** @type {Record<string, string>} package -> deliberately pinned version */
const ALLOWED_PINS = {};
const CHECK_LATEST = process.argv.includes("--check-latest") || process.env.LINT_CHECK_LATEST === "1";

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

/** Split a SKILL.md into { frontmatter, body } or return null if no frontmatter. */
function splitFrontmatter(text) {
	if (!text.startsWith("---\n")) return null;
	const end = text.indexOf("\n---", 3);
	if (end === -1) return null;
	const frontmatter = text.slice(4, end + 1);
	const body = text.slice(text.indexOf("\n", end + 1) + 1);
	return { frontmatter, body };
}

/** Pull a single-line scalar value for `key:` from frontmatter (no full YAML parse). */
function scalar(frontmatter, key) {
	const m = frontmatter.match(new RegExp(`^${key}:[ \\t]*(.*)$`, "m"));
	return m ? m[1].trim() : null;
}

function listSkillDirs() {
	return readdirSync(SKILLS_DIR)
		.filter((entry) => {
			const full = join(SKILLS_DIR, entry);
			return statSync(full).isDirectory();
		})
		.sort();
}

function lintSkill(dir) {
	const where = `skills/${dir}`;
	const skillPath = join(SKILLS_DIR, dir, "SKILL.md");
	let text;
	try {
		text = readFileSync(skillPath, "utf8");
	} catch {
		fail(where, "missing SKILL.md");
		return;
	}
	const split = splitFrontmatter(text);
	if (!split) {
		fail(where, "missing or malformed YAML frontmatter (--- … ---)");
		return;
	}
	const { frontmatter, body } = split;

	if (frontmatter.length > MAX_FRONTMATTER_CHARS) {
		fail(where, `frontmatter ${frontmatter.length} chars > ${MAX_FRONTMATTER_CHARS} max`);
	}

	const name = scalar(frontmatter, "name");
	if (!name) fail(where, "frontmatter missing `name`");
	else {
		if (!NAME_RE.test(name)) fail(where, `name "${name}" must match ${NAME_RE}`);
		if (name !== dir) fail(where, `name "${name}" must equal directory "${dir}"`);
	}

	const description = scalar(frontmatter, "description");
	const hasBlockDescription = /^description:[ \t]*\|/m.test(frontmatter);
	if (!hasBlockDescription && (!description || description.length < 20)) {
		fail(where, "frontmatter `description` missing or too short");
	}
	if (description && /^use when/i.test(description) === false && !hasBlockDescription) {
		// soft norm: descriptions should be trigger-first
		fail(where, 'description should start with "Use when…" (triggers, not a workflow summary)');
	}

	if (!/^allowed-tools:/m.test(frontmatter)) {
		fail(where, "frontmatter missing `allowed-tools`");
	}

	const bodyLines = body.split("\n").length;
	if (bodyLines >= MAX_BODY_LINES) {
		fail(where, `body ${bodyLines} lines >= ${MAX_BODY_LINES} max`);
	}
}

/** Every .md in the repo, excluding VCS and dependency dirs. */
function listMarkdownFiles(dir = ROOT, found = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === ".git" || entry.name === "node_modules") continue;
		const full = join(dir, entry.name);
		if (entry.isDirectory()) listMarkdownFiles(full, found);
		else if (entry.name.endsWith(".md")) found.push(full);
	}
	return found;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Find `<pkg>@<version>` occurrences. The lookbehind stops `agent-skills@1.2.3`
 * from matching the `skills` package.
 */
function findPins(text, pkg) {
	const re = new RegExp(`(?<![\\w.@/-])${escapeRe(pkg)}@(\\d[\\w.+-]*)`, "g");
	return [...text.matchAll(re)].map((m) => m[1]);
}

/** Resolve a package's published `latest`. Network. Returns null on any failure. */
async function fetchLatest(pkg) {
	try {
		const res = await fetch(`https://registry.npmjs.org/${pkg.replace("/", "%2F")}`, {
			headers: { accept: "application/vnd.npm.install-v1+json" },
		});
		if (!res.ok) return null;
		return (await res.json())?.["dist-tags"]?.latest ?? null;
	} catch {
		return null;
	}
}

/**
 * Offline: any un-allowlisted pin fails. With --check-latest, allowlisted pins
 * are additionally compared against the published `latest`.
 */
async function lintVersionPins() {
	/** @type {Map<string, Map<string, Set<string>>>} pkg -> version -> files */
	const pins = new Map();
	for (const file of listMarkdownFiles()) {
		const text = readFileSync(file, "utf8");
		const where = relative(ROOT, file);
		for (const pkg of WATCHED_PACKAGES) {
			for (const version of findPins(text, pkg)) {
				if (!pins.has(pkg)) pins.set(pkg, new Map());
				const byVersion = pins.get(pkg);
				if (!byVersion.has(version)) byVersion.set(version, new Set());
				byVersion.get(version).add(where);
			}
		}
	}

	for (const [pkg, byVersion] of pins) {
		for (const [version, files] of byVersion) {
			if (ALLOWED_PINS[pkg] === version) continue;
			fail(
				[...files].sort().join(", "),
				`pins \`${pkg}@${version}\`. Drop the version so the docs cannot go stale ` +
					`(this repo shipped a stale pin twice). If the pin is deliberate, add it to ` +
					`ALLOWED_PINS in scripts/lint-skills.mjs and verify it with --check-latest.`,
			);
		}
	}

	if (!CHECK_LATEST) return false;
	let verified = true;
	for (const pkg of WATCHED_PACKAGES) {
		const pinned = ALLOWED_PINS[pkg] ?? [...(pins.get(pkg)?.keys() ?? [])][0];
		if (!pinned) continue;
		const latest = await fetchLatest(pkg);
		if (!latest) {
			// Unreachable registry is not a lint failure, but it is also not proof.
			console.error(`  ! could not resolve latest for ${pkg}; drift NOT checked`);
			verified = false;
			continue;
		}
		if (pinned !== latest) {
			fail("version pins", `\`${pkg}\` pinned at ${pinned} but npm latest is ${latest}.`);
		}
	}
	return verified;
}

function lintManifest(relPath, skillsArray, skillDirs) {
	const listed = skillsArray
		.map((s) => s.replace(/^\.\/skills\//, "").replace(/\/$/, ""))
		.sort();
	const expected = skillDirs.join(",");
	if (listed.join(",") !== expected) {
		fail(relPath, `skills list drift.\n    expected: ${expected}\n    found:    ${listed.join(",")}`);
	}
}

// ---- run ----
const skillDirs = listSkillDirs();
if (skillDirs.length === 0) fail("skills/", "no skill directories found");
for (const dir of skillDirs) lintSkill(dir);

try {
	const plugin = JSON.parse(readFileSync(join(ROOT, ".claude-plugin/plugin.json"), "utf8"));
	lintManifest(".claude-plugin/plugin.json", plugin.skills ?? [], skillDirs);
} catch (err) {
	fail(".claude-plugin/plugin.json", `unreadable: ${err.message}`);
}
try {
	const market = JSON.parse(readFileSync(join(ROOT, ".claude-plugin/marketplace.json"), "utf8"));
	const arr = market.plugins?.[0]?.skills ?? [];
	lintManifest(".claude-plugin/marketplace.json", arr, skillDirs);
} catch (err) {
	fail(".claude-plugin/marketplace.json", `unreadable: ${err.message}`);
}

const latestVerified = await lintVersionPins();

if (errors.length > 0) {
	console.error(`✗ ${errors.length} problem(s):\n`);
	for (const e of errors) console.error(`  - ${e}`);
	process.exit(1);
}
console.log(`✓ ${skillDirs.length} skills lint clean: ${skillDirs.join(", ")}`);
console.log(
	`✓ no version pins for ${WATCHED_PACKAGES.join(", ")}${latestVerified ? " (latest verified)" : ""}`,
);
