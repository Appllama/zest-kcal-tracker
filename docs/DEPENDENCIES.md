# Dependency notes

The template retains the verified Expo SDK 57 / React Native 0.86 / Reanimated 4.5 stack. The lockfile is independent of the source chat collection. NativeWind, unused form/UI packages, MMKV, and unrelated study dependencies are not included.

## Compatibility adapters

- `packages/decode-uri-component-compat` exposes the patched upstream URI decoder's CommonJS function for Expo Router's query-string dependency. It does not implement a decoder. The actual installed parser is exercised by `tests/dependency-compatibility.test.cjs`, including malformed URI input.
- The Xcode tooling UUID override uses `11.1.1`; regression checks validate generated project identifiers and buffer bounds.
- `plugins/with-quoted-ios-paths.js` quotes Expo's generated native build paths so a checkout in a folder containing spaces also builds. It adjusts the installed Expo Constants pod script and generated Xcode phase during prebuild; no system/global packages are changed.
- `enableSceneSupport` is required for the verified native material. Reanimated synchronous UI props stay disabled to preserve the approved native glass/keyboard path.
- npm's `allowScripts` entries are limited to the installed Skia native-library setup and the ESLint resolver's install script. They are version-specific and need review when updating those packages.

## Audit on October 6, 2026

`npm audit` reports **20 high-severity affected dependency entries**, stemming from two transitive advisories:

| Dependency | Installed version | Advisory | Published patched version at validation |
| --- | --- | --- | --- |
| `braces` | 3.0.3 | [Nested-pattern stack exhaustion](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | None reported by the registry. |
| `node-forge` | 1.4.0 | [RSA signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | None reported by the registry. |

These are reached through the Expo/Metro development and native-build tooling graph, not imported by Zest's feature code. The audit is **not clean**. The registry's force-fix suggestions downgrade Expo/React Native to older incompatible major releases; those were not applied. Recheck with `npm audit` before publishing or upgrading and adopt patched compatible releases once available. CI currently checks functional compatibility, not a clean security audit.

Dependencies retain their own license terms. The project-owned MIT license is not a replacement for those notices.
