import { Skia } from "@shopify/react-native-skia";

/**
 * The page is one quiet grey, lit the way a studio backdrop is: a soft white
 * light behind the companion and a shadow where it stands. The only colour is
 * a pale cut of the companion's own, faint and low behind the composer, where
 * the glass can pick it up.
 *
 * While a reply is on its way that colour gathers under the composer: a body
 * of light runs its length behind the glass, a little faster each pass. When
 * the reply starts, one pale wave carries up the page and fades.
 */
export const backdropEffect = Skia.RuntimeEffect.Make(`
uniform vec2 size;
uniform vec3 paper;
uniform vec3 glow;
uniform vec2 spot;
uniform float radius;
uniform vec2 feet;
uniform float figure;
uniform vec2 dock;
uniform float dockHalf;
uniform float energy;
uniform float spin;
uniform float release;
uniform float settle;

float bloom(vec2 p, vec2 centre, vec2 reach) {
  vec2 q = (p - centre) / reach;
  return exp(-dot(q, q));
}

half4 main(vec2 xy) {
  vec2 uv = xy / size;
  // Paper, a little brighter toward the top, as if lit from above.
  vec3 col = mix(paper, vec3(1.0), 0.3 * smoothstep(0.8, 0.0, uv.y));

  // The studio light behind the companion. It is white, never coloured.
  float halo = bloom(xy, spot, vec2(radius, radius * 0.92));
  col = mix(col, vec3(1.0), halo * 0.75 * (1.0 - 0.7 * settle));

  // The companion's colour, low behind the composer and barely there.
  float low = bloom(xy, vec2(dock.x, dock.y + 34.0), vec2(size.x * 0.6, 96.0 + 44.0 * energy));
  col = mix(col, glow, low * (0.22 + 0.3 * energy));

  // The wait: a body of light running the composer's length and back behind
  // the glass, gathering pace the way a motor's note climbs.
  if (energy > 0.001) {
    // It turns well short of either end, so the light stays inside the glass.
    float run = dock.x + sin(spin * 2.6) * dockHalf * 0.6;
    float core = bloom(xy, vec2(run, dock.y), vec2(50.0 + 22.0 * energy, 24.0));
    col = mix(col, glow, core * energy * 0.95);
    // Each pass lifts a breath of light off the composer.
    float up = dock.y - xy.y;
    float phase = fract(spin * 0.5);
    float crest = phase * 150.0;
    float w = (up - crest) / (34.0 + crest * 0.3);
    float wave = exp(-w * w) * (1.0 - phase) * step(0.0, up) * bloom(xy, dock, vec2(dockHalf * 1.1, 400.0));
    col = mix(col, mix(glow, vec3(1.0), 0.3), wave * energy * 0.3);
  }
  // Letting go: one pale wave carries up the page.
  if (release > 0.0 && release < 1.0) {
    float up = dock.y - xy.y;
    float e = (up - release * (dock.y + 60.0)) / (64.0 + release * 70.0);
    col = mix(col, mix(vec3(1.0), glow, 0.25), exp(-e * e) * (1.0 - release) * 0.5);
  }

  // Where the figure stands: a wide soft shadow, and a closer, darker one.
  vec2 at = xy - feet - vec2(0.0, -figure * 0.3);
  vec2 wide = at / vec2(19.0 * figure, 4.6 * figure);
  vec2 near = at / vec2(12.0 * figure, 2.4 * figure);
  float ground = 0.1 * exp(-dot(wide, wide)) + 0.13 * exp(-dot(near, near) * 1.4);
  col *= 1.0 - ground * (1.0 - settle);
  // Gradients this gentle would show as steps; a grain finer than one level
  // of grey breaks them up.
  float grain = fract(52.9829189 * fract(dot(xy * 3.0, vec2(0.06711056, 0.00583715))));
  col += (grain - 0.5) / 255.0;
  return half4(col, 1.0);
}
`);
