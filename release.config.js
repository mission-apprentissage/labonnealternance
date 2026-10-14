// biome-ignore lint/style/noCommonJs: migration
module.exports = {
  branches: ["main", { name: "hotfix", channel: "hotfix", prerelease: "hotfix" }],
  repositoryUrl: "https://github.com/mission-apprentissage/labonnealternance.git",
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        // Le déploiement lit .infra sur main mais l'image de la dernière release : un refactor sans release
        // déploie des secrets et un .env_server que l'image en cours ne connaît pas (#5650).
        releaseRules: [
          { breaking: true, release: "major" },
          { type: "refactor", release: "patch" },
        ],
      },
    ],
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        prepareCmd: `.bin/mna app:release \${nextRelease.version} \${nextRelease.gitHead} push`,
      },
    ],
    "@semantic-release/github",
    [
      "semantic-release-slack-bot",
      {
        notifyOnSuccess: true,
        notifyOnFail: true,
        // biome-ignore lint/style/noCommonJs: fonction injectée dans semantic-release-slack-bot
        onSuccessFunction: require("./.github/scripts/slack-release-payload.cjs"),
      },
    ],
  ],
}
