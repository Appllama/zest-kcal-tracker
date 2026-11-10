# Dependency notes

The template uses Expo SDK 58, React Native 0.88, and Reanimated 4.7. The lockfile is independent of the source chat collection. NativeWind, unused form/UI packages, MMKV, and unrelated study dependencies are not included.

## Compatibility adapters

- The Xcode tooling generates project identifiers without the former UUID dependency. A regression check validates the generated identifier format.
- Expo SDK 58 quotes the generated iOS build scripts and enables UIKit scene support by default. Reanimated synchronous UI props stay disabled to preserve the approved native glass/keyboard path.
- npm's `allowScripts` entries are limited to the installed Skia native-library setup and the ESLint resolver's install script. They are version-specific and need review when updating those packages.

## Audit on November 9, 2026

`npm audit` reports 12 moderate affected entries stemming from two transitive advisories, with zero high or critical entries:

| Dependency | Advisory |
| --- | --- |
| `glob` | [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) |
| `minimatch` | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) |

These packages are transitive dependencies of the Expo toolchain. The registry's suggested automatic fix would downgrade Expo to SDK 52. CI checks functional compatibility.

Dependencies retain their own license terms. The project-owned MIT license is not a replacement for those notices.
