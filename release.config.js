module.exports = {
  branches: ["main", { name: "hotfix", channel: "hotfix", prerelease: "hotfix" }],
  repositoryUrl: "https://github.com/mission-apprentissage/labonnealternance.git",
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        prepareCmd: `.bin/mna-lba app:release \${nextRelease.version} \${nextRelease.gitHead} push`,
      },
    ],
    "@semantic-release/github",
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
