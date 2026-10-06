const fs = require("node:fs");
const path = require("node:path");
const { withDangerousMod, withXcodeProject } = require("expo/config-plugins");

// Expo SDK 57 leaves these build-script paths unquoted. Keep the workaround
// in prebuild so folders such as "2 Oct" also work after regeneration.
module.exports = function withQuotedIosPaths(config) {
  config = withDangerousMod(config, [
    "ios",
    async (c) => {
      const constantsRoot = path.dirname(
        require.resolve("expo-constants/package.json", {
          paths: [c.modRequest.projectRoot],
        }),
      );
      const podspecPath = path.join(constantsRoot, "ios/EXConstants.podspec");
      const podspec = fs.readFileSync(podspecPath, "utf8");
      const quotedPodspec = podspec.replace(
        /^    :script => .*get-app-config-ios\.sh.*,$/m,
        `    :script => 'bash -l "$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh"',`,
      );
      if (quotedPodspec !== podspec)
        fs.writeFileSync(podspecPath, quotedPodspec);

      const scriptPath = path.join(
        constantsRoot,
        "scripts/get-app-config-ios.sh",
      );
      const script = fs.readFileSync(scriptPath, "utf8");
      const quotedScript = script.replace(
        "basename $PROJECT_DIR",
        'basename "$PROJECT_DIR"',
      );
      if (quotedScript !== script) fs.writeFileSync(scriptPath, quotedScript);
      return c;
    },
  ]);

  return withXcodeProject(config, (c) => {
    const phases = c.modResults.hash.project.objects.PBXShellScriptBuildPhase;
    for (const phase of Object.values(phases)) {
      if (typeof phase !== "object" || !phase.shellScript) continue;
      const script = JSON.parse(phase.shellScript);
      phase.shellScript = JSON.stringify(
        script.replace(/^(`[^\n]*react-native-xcode\.sh[^\n]*`)$/m, '"$1"'),
      );
    }
    return c;
  });
};
