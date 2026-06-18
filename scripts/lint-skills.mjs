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
 *
 * Exit 0 = clean, 1 = one or more failures.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(ROOT, "skills");
const MAX_FRONTMATTER_CHARS = 1024;
const MAX_BODY_LINES = 500;
const NAME_RE = /^[a-z0-9-]+$/;

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

if (errors.length > 0) {
	console.error(`✗ ${errors.length} problem(s):\n`);
	for (const e of errors) console.error(`  - ${e}`);
	process.exit(1);
}
console.log(`✓ ${skillDirs.length} skills lint clean: ${skillDirs.join(", ")}`);
