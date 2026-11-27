import { execFileSync, spawnSync } from "node:child_process"
import { copyFileSync, existsSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, utimesSync } from "node:fs"
import { isAbsolute, join, resolve } from "node:path"

import { isTestFile } from "./decide.mjs"

export const EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"

// Variables qui redirigeraient git vers un autre dépôt ou un autre index que ceux de la racine passée.
const GIT_REDIRECTS = ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_PREFIX", "GIT_COMMON_DIR", "GIT_OBJECT_DIRECTORY"]

function gitEnv(extra = {}) {
  const env = { ...process.env }
  for (const name of GIT_REDIRECTS) delete env[name]
  return { ...env, ...extra }
}

export function git(cwd, args, { env, input } = {}) {
  return execFileSync("git", args, { cwd, env: gitEnv(env), input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 })
}

export function tryGit(cwd, args, options) {
  try {
    return git(cwd, args, options)
  } catch {
    return null
  }
}

export function realpathOrSelf(path) {
  try {
    return realpathSync(path)
  } catch {
    return path
  }
}

/** Racine git du dossier, chemin réel, ou null hors dépôt. */
export function toplevel(dir) {
  if (!dir || !isAbsolute(dir) || !existsSync(dir)) return null
  const out = tryGit(dir, ["rev-parse", "--show-toplevel"])
  return out ? realpathOrSelf(out.trim()) : null
}

export function isLbaRoot(root) {
  if (!root || !existsSync(join(root, "biome.json"))) return false
  try {
    return JSON.parse(readFileSync(join(root, "package.json"), "utf8")).name === "mna-lba"
  } catch {
    return false
  }
}

export function gitDir(root) {
  return realpathOrSelf(git(root, ["rev-parse", "--absolute-git-dir"]).trim())
}

export function commonDir(root) {
  return realpathOrSelf(resolve(root, git(root, ["rev-parse", "--git-common-dir"]).trim()))
}

export function isIgnored(root, rel) {
  return spawnSync("git", ["check-ignore", "-q", "--", rel], { cwd: root, env: gitEnv(), stdio: "ignore" }).status === 0
}

/**
 * Empreinte de l'arbre de travail : arbre git des fichiers suivis et non suivis non ignorés, calculé dans un index temporaire
 * amorcé par l'index réel (les fichiers inchangés ne sont pas relus).
 */
export function fingerprint(root, scratchDir) {
  const index = join(scratchDir, `fingerprint-${process.pid}-${Date.now()}.index`)
  try {
    const real = join(gitDir(root), "index")
    if (existsSync(real)) {
      copyFileSync(real, index)
      // git relit un fichier dont la date n'est pas antérieure à celle de l'index (« racy git ») : une copie datée de
      // maintenant ferait passer pour inchangé un fichier de même taille modifié dans la seconde de la dernière écriture.
      const { atime, mtime } = statSync(real)
      utimesSync(index, atime, mtime)
    }
    const env = { GIT_INDEX_FILE: index }
    git(root, ["add", "-A", "--", "."], { env })
    return git(root, ["write-tree"], { env }).trim()
  } finally {
    rmSync(index, { force: true })
    rmSync(`${index}.lock`, { force: true })
  }
}

/** @returns {{status: string, path: string}[]} */
export function diffTrees(root, from, to) {
  const out = git(root, ["diff-tree", "-r", "-z", "--no-renames", "--name-status", from, to])
  const fields = out.split("\0").filter(Boolean)
  const changes = []
  for (let i = 0; i + 1 < fields.length; i += 2) changes.push({ status: fields[i], path: fields[i + 1] })
  return changes
}

export function headTree(root) {
  return tryGit(root, ["rev-parse", "--verify", "-q", "HEAD^{tree}"])?.trim() || null
}

/** Arbre du point de départ de la branche : merge-base avec la branche par défaut distante, sinon `main`. */
export function mergeBaseTree(root) {
  for (const upstream of ["refs/remotes/origin/HEAD", "refs/remotes/origin/main", "refs/heads/main"]) {
    if (!tryGit(root, ["rev-parse", "--verify", "-q", upstream])) continue
    const base = tryGit(root, ["merge-base", "HEAD", upstream])?.trim()
    if (base) return tryGit(root, ["rev-parse", `${base}^{tree}`])?.trim() || null
  }
  return null
}

export function hashFiles(root, rels) {
  if (!rels.length) return new Map()
  const out = git(root, ["hash-object", "--stdin-paths"], { input: `${rels.join("\n")}\n` })
    .trim()
    .split("\n")
  return new Map(rels.map((rel, i) => [rel, out[i]]))
}

export function headBlobs(root, rels) {
  const blobs = new Map()
  if (!rels.length || !headTree(root)) return blobs
  const out = git(root, ["ls-tree", "-z", "HEAD", "--", ...rels])
  for (const entry of out.split("\0").filter(Boolean)) {
    const [meta, path] = entry.split("\t")
    blobs.set(path, meta.split(" ")[2])
  }
  return blobs
}

export function listTestFiles(root, dir) {
  try {
    return readdirSync(join(root, dir))
      .filter((name) => isTestFile(name))
      .map((name) => `${dir}/${name}`)
  } catch {
    return []
  }
}

export function headCommit(root) {
  return tryGit(root, ["rev-parse", "--short", "HEAD"])?.trim() ?? "?"
}

/** @returns {string[]} chemins réels des worktrees du dépôt */
export function worktrees(root) {
  const out = git(root, ["worktree", "list", "--porcelain"])
  return out
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => realpathOrSelf(line.slice("worktree ".length)))
}
