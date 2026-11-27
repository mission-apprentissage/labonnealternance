import { existsSync } from "node:fs"
import { join } from "node:path"

import { coverageText, inScope, planTests } from "./decide.mjs"
import { diffTrees, EMPTY_TREE, fingerprint, headTree, listTestFiles, mergeBaseTree, worktrees } from "./repo.mjs"
import { readJson, readText, sessionDir, sessionKey, stateDir } from "./state.mjs"
import { depsState, expectedNode } from "./tools.mjs"

export const STATUS_CODES = { green: 0, degraded: 3, red: 4, unverified: 5, absent: 6 }

/** État d'un worktree pour la coordinatrice : 0 vert à jour, 3 dégradé (en mode strict), 4 rouge, 5 non vérifié, 6 hooks absents. */
export function describeWorktree(root, { strict }) {
  const hasScripts = existsSync(join(root, ".claude", "hooks", "cli.mjs"))
  const state = stateDir(root)
  const last = readJson(join(state, "last-run.json"))
  if (!last) return { root, code: hasScripts ? STATUS_CODES.unverified : STATUS_CODES.absent, text: hasScripts ? "non vérifié (aucun run)" : "hooks absents, aucun run" }
  const tree = fingerprint(root, state)
  const causes = (last.causes ?? []).map((cause) => cause.id)
  const suffix = [causes.length ? `causes : ${causes.join(", ")}` : null, last.coverage ? coverageText(last.coverage) : null, last.log ? `journal : ${last.log}` : null]
    .filter(Boolean)
    .join(" ; ")
  if (last.tree !== tree) return { root, code: STATUS_CODES.unverified, text: `non vérifié : arbre modifié depuis le run du ${last.at} (${last.verdict})` }
  const text = `${last.verdict} (${last.at})${suffix ? ` ; ${suffix}` : ""}`
  switch (last.verdict) {
    case "red":
    case "released":
      return { root, code: STATUS_CODES.red, text }
    case "degraded":
      return { root, code: strict ? STATUS_CODES.degraded : STATUS_CODES.green, text }
    default:
      return { root, code: STATUS_CODES.green, text }
  }
}

const SEVERITY = [STATUS_CODES.red, STATUS_CODES.degraded, STATUS_CODES.unverified, STATUS_CODES.absent, STATUS_CODES.green]

export function status({ root, all, strict, json }) {
  const rows = (all ? worktrees(root) : [root]).filter((path) => existsSync(path)).map((path) => describeWorktree(path, { strict }))
  const exit = all ? (SEVERITY.find((code) => rows.some((row) => row.code === code)) ?? 0) : rows[0].code
  const stdout = json ? JSON.stringify(rows, null, 2) : rows.map((row) => `${row.code} ${row.root} : ${row.text}`).join("\n")
  return { exit, stdout }
}

/** Décision qu'aurait prise la garde de fin de tour, sans lancer aucun outil. */
export function explain({ payload, root }) {
  const state = stateDir(root)
  const key = sessionKey(payload)
  const session = sessionDir(state, key)
  const tree = fingerprint(root, state)
  const sessionGreen = readText(join(session, "verified"))
  const baseline = readText(join(session, "baseline"))
  const mergeBase = mergeBaseTree(root)
  const reference = sessionGreen ?? baseline ?? mergeBase ?? headTree(root) ?? EMPTY_TREE
  const kind = sessionGreen ? "dernier vert de la session" : baseline ? "base de session" : mergeBase ? "merge-base" : "HEAD (no-baseline)"
  const changes = reference === tree ? [] : diffTrees(root, reference, tree)
  const scoped = changes.filter((change) => inScope(change.path))
  const plan = planTests(scoped, { listTests: (dir) => listTestFiles(root, dir) })
  const last = readJson(join(state, "last-run.json"))
  const lines = [
    `racine : ${root}`,
    `session : ${key}`,
    `arbre : ${tree}`,
    `référence : ${reference} (${kind})`,
    `modifiés : ${changes.length}, dans le périmètre : ${scoped.map((change) => `${change.status} ${change.path}`).join(", ") || "aucun"}`,
    `tests : ${plan.args.join(" ") || "aucun"}${plan.projects.length ? ` --project ${plan.projects.join(" --project ")}` : ""}${plan.causes.length ? ` (${plan.causes.join(", ")})` : ""}`,
    `node_modules : ${depsState(root).status}, Node ${process.version} (attendu ${expectedNode(root) ?? "?"})`,
    `dernier run : ${last ? `${last.verdict} sur ${last.tree === tree ? "cet arbre" : "un autre arbre"} (${last.at})` : "aucun"}`,
  ]
  return { exit: 0, stdout: lines.join("\n") }
}
