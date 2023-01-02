const mainConfig = {
  branches: ["main", { name: "develop", channel: "beta", prerelease: "beta" }],
  repositoryUrl: "https://github.com/mission-apprentissage/cerfa.git",
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
      },
    ],
    "@semantic-release/npm",
    [
      "@semantic-release/exec",
      {
        prepareCmd: "./scripts/prepare-release.sh ${nextRelease.version}",
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["ui/package.json", "server/package.json", "ui_espace_pro/package.json", "ui/CHANGELOG.md", "ui_espace_pro/CHANGELOG.md", "CHANGELOG.md", "package.json"],
        message:
          // eslint-disable-next-line no-template-curly-in-string
          "chore(release): bump ${nextRelease.version}",
      },
    ],
    "@semantic-release/github",
    [
      "@semantic-release/exec",
      {
        publishCmd: "git checkout -- package.json",
      },
    ],
    [
      "semantic-release-slack-bot",
      {
        notifyOnSuccess: true,
        notifyOnFail: true,
        markdownReleaseNotes: true,
      },
    ],
  ],
}

const { execSync } = require("child_process")
const { createHash } = require("crypto")

const branch = execSync("git branch --show-current").toString().trimEnd("\n")
const channel = createHash("md5").update(branch).digest("hex")

const localConfig = {
  branches: [
    "main",
    { name: "develop", channel: "beta", prerelease: "beta" },
    {
      name: branch,
      channel,
      prerelease: channel,
    },
  ],
  repositoryUrl: "https://github.com/mission-apprentissage/doctrina.git",
  plugins: ["@semantic-release/commit-analyzer"],
}

module.exports = process.env.LOCAL_RELEASE ? localConfig : mainConfig
