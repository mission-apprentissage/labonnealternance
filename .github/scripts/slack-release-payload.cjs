"use strict"

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function parseSection(notes, heading) {
  if (!notes) return []
  const regex = new RegExp(`### ${escapeRegex(heading)}\\s*\\n([\\s\\S]*?)(?=\\n###|\\n##|$)`)
  const match = notes.match(regex)
  if (!match) return []
  return match[1]
    .split("\n")
    .map((l) =>
      l
        .replace(/^\*\s+/, "")
        .replace(/\s*\(?\[.*?\]\(.*?\)\)?\s*$/, "")
        .trim()
    )
    .filter(Boolean)
}

module.exports = function slackReleasePayload(_pluginConfig, context) {
  const { nextRelease, options } = context
  const today = new Date().toISOString().slice(0, 10)
  const repoUrl = options.repositoryUrl.replace(/\.git$/, "")
  const releaseUrl = `${repoUrl}/releases/tag/${nextRelease.gitTag}`
  const features = parseSection(nextRelease.notes, "Features")
  const fixes = parseSection(nextRelease.notes, "Bug Fixes")

  const blocks = [
    { type: "header", text: { type: "plain_text", text: `📦 Nouvelle release — ${nextRelease.gitTag}` } },
    { type: "section", text: { type: "mrkdwn", text: `\`mna-lba\` · ${nextRelease.gitTag} · ${today}` } },
    { type: "divider" },
  ]

  if (features.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:large_green_circle: *Features*\n${features.map((f) => `• ${f}`).join("\n")}`,
      },
    })
  }

  if (fixes.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:red_circle: *Bug Fixes*\n${fixes.map((f) => `• ${f}`).join("\n")}`,
      },
    })
  }

  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: `<${releaseUrl}|Voir la release →>` }],
  })

  return { attachments: [{ color: "#e3e3fd", blocks }] }
}
