export type CardPersonaId =
  | "classic"
  | "curly"
  | "longhair"
  | "ponytail"
  | "bearded"
  | "hijabi"
  | "techie"
  | "hacker"
  | "boss"
  | "cheer"
  | "astronaut"
  | "robot";

export type CardBackgroundStyle = "blob" | "grid" | "dots" | "gradient" | "solid";
export type CardLayout = "split" | "centered";
export type CardAvatarMode = "persona" | "github" | "initials";
export type CardPose = "wave" | "peace" | "laptop";

export type ProfileCardSettings = {
  greeting: string;
  role: string;
  tagline: string;
  persona: CardPersonaId;
  pose: CardPose;
  skinTone: string;
  hairColor: string;
  shirtColor: string;
  accent: string;
  ink: string;
  soft: string;
  background: string;
  backgroundStyle: CardBackgroundStyle;
  layout: CardLayout;
  avatarMode: CardAvatarMode;
  font: string;
  showStats: boolean;
  showTech: boolean;
  animateWave: boolean;
};

export const cardPersonas: { id: CardPersonaId; name: string; note: string; emoji: string }[] = [
  { id: "classic", name: "Classic Waver", note: "short hair tee", emoji: "👋" },
  { id: "ponytail", name: "Ponytail Pro", note: "female · side ponytail", emoji: "🎀" },
  { id: "bearded", name: "Bearded Techie", note: "male · beard", emoji: "🧔" },
  { id: "curly", name: "Curly Creative", note: "big curly hair", emoji: "🌀" },
  { id: "longhair", name: "Long Hair Chill", note: "relaxed flow", emoji: "🦰" },
  { id: "hijabi", name: "Hijabi Dev", note: "headscarf", emoji: "🧕" },
  { id: "techie", name: "Techie", note: "glasses + headset", emoji: "🎧" },
  { id: "hacker", name: "Hoodie Hacker", note: "hood up + shades + laptop", emoji: "🕶️" },
  { id: "boss", name: "Boss Energy", note: "suit + tie · bossy point", emoji: "💼" },
  { id: "cheer", name: "Super Waver", note: "both hands up 🙌", emoji: "🙌" },
  { id: "astronaut", name: "Astronaut", note: "helmet explorer", emoji: "🧑‍🚀" },
  { id: "robot", name: "Robot Buddy", note: "antenna bot", emoji: "🤖" },
];

export const cardSkinTones = ["#FFDFC4", "#F0C8A0", "#C68642", "#8D5524", "#5C3A21"];
export const cardLayoutOptions: CardLayout[] = ["split", "centered"];
export const cardBackgroundOptions: CardBackgroundStyle[] = ["blob", "grid", "dots", "gradient", "solid"];

export const defaultProfileCardSettings: ProfileCardSettings = {
  greeting: "Hey there, I'm",
  role: "Product Engineer · TypeScript & Next.js",
  tagline: "I make thoughtful tools for noisy problems.",
  persona: "classic",
  pose: "wave",
  skinTone: "#F0C8A0",
  hairColor: "#172321",
  shirtColor: "#F26938",
  accent: "#F26938",
  ink: "#172321",
  soft: "#B8E0C2",
  background: "#FCFCF8",
  backgroundStyle: "blob",
  layout: "split",
  avatarMode: "persona",
  font: "DM Mono",
  showStats: true,
  showTech: true,
  animateWave: true,
};

function escapeXml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;" })[char] || char);
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "YOU";
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
  const channel = (i: number) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/** Illustrated character in a 320x340 box. Pose drives the arms; persona drives head/face/torso. */
function buildPersonaFigure(s: ProfileCardSettings): string {
  const skin = s.skinTone;
  const hair = s.hairColor;
  const shirt = s.shirtColor;

  // Wave rotation around a given joint — each character passes its own pivot
  // so the waving hand actually swings from where its arm is.
  const waveAt = (px: number, py: number, flip = false) =>
    s.animateWave
      ? `<animateTransform attributeName="transform" type="rotate" values="${flip ? "12" : "-12"} ${px} ${py};${flip ? "-18" : "18"} ${px} ${py};${flip ? "12" : "-12"} ${px} ${py}" dur="2.2s" repeatCount="indefinite"/>`
      : ``;

  // Hand with fingers at (hx,hy): wiggle fingers, or ✌ peace in peace pose.
  const handAt = (hx: number, hy: number) =>
    `<circle cx="${hx}" cy="${hy}" r="20" fill="${skin}"/>${
      s.pose === "peace"
        ? `<path d="M${hx - 8} ${hy - 16}l-6-18M${hx + 8} ${hy - 16}l6-18" stroke="${skin}" stroke-width="9" stroke-linecap="round"/><circle cx="${hx - 14}" cy="${hy - 36}" r="4.5" fill="${skin}"/><circle cx="${hx + 14}" cy="${hy - 36}" r="4.5" fill="${skin}"/>`
        : `<path d="M${hx - 12} ${hy - 16}q6-12 12 0M${hx} ${hy - 16}q6-12 12 0" stroke="${skin}" stroke-width="7" stroke-linecap="round" fill="none"/>`
    }`;

  // Right arm is per-persona: the wave pivot follows the hand, the boss
  // points, cheer throws that hand high, laptop pose reaches for keys.
  let arm: string;
  if (s.pose === "laptop") {
    arm = `<path d="M216 182 Q210 240 198 292" stroke="${shirt}" stroke-width="28" stroke-linecap="round" fill="none"/>`;
  } else if (s.persona === "boss") {
    // Bossy point with a subtle emphatic bob — "ship it."
    const bob = s.animateWave
      ? `<animateTransform attributeName="transform" type="rotate" values="-4 238 180;4 238 180;-4 238 180" dur="3s" repeatCount="indefinite"/>`
      : ``;
    arm = `<g>${bob}<path d="M238 180 L296 178" stroke="${shirt}" stroke-width="30" stroke-linecap="round" fill="none"/><circle cx="302" cy="178" r="17" fill="${skin}"/><line x1="310" y1="178" x2="336" y2="178" stroke="${skin}" stroke-width="10" stroke-linecap="round"/></g>`;
  } else if (s.persona === "cheer") {
    arm = `<g><g>${waveAt(268, 110)}${handAt(282, 72)}</g><path d="M240 168 Q264 130 274 88" stroke="${shirt}" stroke-width="30" stroke-linecap="round" fill="none"/></g>`;
  } else {
    arm = `<g><g>${waveAt(258, 150)}${handAt(278, 108)}</g><path d="M238 168 Q258 150 268 124" stroke="${shirt}" stroke-width="30" stroke-linecap="round" fill="none"/></g>`;
  }

  // Left arm: resting / crossed (boss) / raised (cheer) / keys (laptop) / mug (bearded).
  let leftArm: string;
  if (s.pose === "laptop") {
    leftArm = `<path d="M104 182 Q110 240 122 292" stroke="${shirt}" stroke-width="28" stroke-linecap="round" fill="none"/>`;
  } else if (s.persona === "boss") {
    // Arms crossed, bossy.
    leftArm = `<path d="M88 196 Q160 244 244 208" stroke="${shirt}" stroke-width="28" stroke-linecap="round" fill="none"/><circle cx="248" cy="206" r="16" fill="${skin}"/>`;
  } else if (s.persona === "cheer") {
    leftArm = `<g><g>${waveAt(52, 110, true)}${handAt(38, 72)}</g><path d="M80 168 Q56 130 46 88" stroke="${shirt}" stroke-width="30" stroke-linecap="round" fill="none"/></g>`;
  } else if (s.persona === "bearded") {
    // Coffee mug held in the resting hand.
    leftArm = `<path d="M92 176 Q70 220 84 258" stroke="${shirt}" stroke-width="28" stroke-linecap="round" fill="none"/><rect x="62" y="244" width="42" height="34" rx="6" fill="#ffffff" stroke="#0d1117" stroke-opacity=".25" stroke-width="2"/><rect x="104" y="252" width="12" height="18" rx="6" fill="none" stroke="#0d1117" stroke-width="3" opacity=".5"/><path d="M74 238 q3 -8 6 0 M86 238 q3 -8 6 0" stroke="#0d1117" stroke-width="2.5" opacity=".4" fill="none"/><circle cx="86" cy="264" r="17" fill="${skin}"/>`;
  } else {
    leftArm = `<path d="M92 176 Q70 220 84 258" stroke="${shirt}" stroke-width="28" stroke-linecap="round" fill="none"/><circle cx="86" cy="264" r="17" fill="${skin}"/>`;
  }

  // Torso (+ suit & tie for the boss, hoodie pocket for the hacker).
  let torso = `<path d="M70 190 Q160 168 250 190 L238 320 L82 320 Z" fill="${shirt}"/><path d="M140 184h40l-8 60h-24Z" fill="#ffffff" opacity=".28"/>`;
  if (s.persona === "boss") {
    torso = `<path d="M70 190 Q160 168 250 190 L238 320 L82 320 Z" fill="${shirt}"/><path d="M138 182 L160 230 L182 182 L172 178 L160 196 L148 178Z" fill="#ffffff" opacity=".9"/><rect x="154" y="208" width="12" height="66" rx="4" fill="${s.accent}"/><path d="M138 182 L160 230 M182 182 L160 230" stroke="#0d1117" stroke-width="3" opacity=".35" fill="none"/>`;
  } else if (s.persona === "hacker") {
    torso = `<path d="M70 190 Q160 168 250 190 L238 320 L82 320 Z" fill="${shirt}"/><rect x="118" y="252" width="84" height="44" rx="10" fill="#0d1117" opacity=".35"/><path d="M132 196 Q128 230 136 252 M188 196 Q192 230 184 252" stroke="#ffffff" stroke-width="4" opacity=".5" fill="none"/>`;
  }

  // Head base
  const head = `<circle cx="160" cy="110" r="62" fill="${skin}"/>`;

  // Face: robot LEDs / hacker shades / standard smile.
  let face: string;
  if (s.persona === "robot") {
    face = `<rect x="122" y="82" width="20" height="26" rx="8" fill="#0d1117"/><rect x="178" y="82" width="20" height="26" rx="8" fill="#0d1117"/><circle cx="132" cy="94" r="5" fill="${s.accent}"><animate attributeName="opacity" values="1;.2;1" dur="1.6s" repeatCount="indefinite"/></circle><circle cx="188" cy="94" r="5" fill="${s.accent}"><animate attributeName="opacity" values="1;.2;1" dur="1.6s" repeatCount="indefinite"/></circle><rect x="142" y="122" width="36" height="10" rx="5" fill="#0d1117" opacity=".7"/>`;
  } else if (s.persona === "hacker") {
    face = `<rect x="112" y="92" width="96" height="30" rx="12" fill="#0d1117"/><line x1="112" y1="104" x2="98" y2="100" stroke="#0d1117" stroke-width="6"/><line x1="208" y1="104" x2="222" y2="100" stroke="#0d1117" stroke-width="6"/><path d="M190 96 L198 96 L194 114 L186 114Z" fill="${s.accent}" opacity=".8"/><path d="M146 136 Q162 144 178 134" stroke="#0d1117" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  } else if (s.persona === "boss") {
    face = `<circle cx="138" cy="108" r="6" fill="#0d1117"/><circle cx="182" cy="108" r="6" fill="#0d1117"/><path d="M130 92 L146 94 M174 94 L190 92" stroke="#0d1117" stroke-width="4" stroke-linecap="round"/><path d="M144 134 Q162 142 180 132" stroke="#0d1117" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  } else {
    face = `<circle cx="138" cy="108" r="6" fill="#0d1117"/><circle cx="182" cy="108" r="6" fill="#0d1117"/><path d="M142 132 Q160 146 178 132" stroke="#0d1117" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="122" cy="124" r="7" fill="#ff9d9d" opacity=".55"/><circle cx="198" cy="124" r="7" fill="#ff9d9d" opacity=".55"/>`;
  }

  // Glasses / headset for the techie (over the face).
  let wearables = "";
  if (s.persona === "techie") {
    wearables = `<rect x="118" y="94" width="40" height="30" rx="8" fill="none" stroke="#0d1117" stroke-width="4"/><rect x="162" y="94" width="40" height="30" rx="8" fill="none" stroke="#0d1117" stroke-width="4"/><line x1="158" y1="106" x2="162" y2="106" stroke="#0d1117" stroke-width="4"/><path d="M104 108 Q104 30 160 28 Q216 30 216 108" fill="none" stroke="${s.accent}" stroke-width="7"/><circle cx="216" cy="118" r="10" fill="${s.accent}"/><line x1="216" y1="128" x2="196" y2="140" stroke="${s.accent}" stroke-width="5" stroke-linecap="round"/><circle cx="194" cy="141" r="5" fill="#0d1117"/>`;
  }

  // Hair / headgear.
  let hairLayer = "";
  switch (s.persona) {
    case "classic":
    case "cheer":
      hairLayer = `<path d="M98 108 Q100 40 160 38 Q220 40 222 108 Q200 74 160 72 Q120 74 98 108Z" fill="${hair}"/>`;
      break;
    case "boss":
      hairLayer = `<path d="M98 108 Q100 44 150 40 Q214 38 222 100 Q196 66 150 68 Q118 70 98 108Z" fill="${hair}"/><path d="M120 62 Q150 52 182 58" stroke="#ffffff" stroke-width="4" opacity=".35" fill="none"/>`;
      break;
    case "bearded":
      hairLayer = `<path d="M98 108 Q100 40 160 38 Q220 40 222 108 Q200 74 160 72 Q120 74 98 108Z" fill="${hair}"/><path d="M104 118 Q106 176 160 178 Q214 176 216 118 Q212 158 160 160 Q108 158 104 118Z" fill="${hair}"/><ellipse cx="160" cy="146" rx="16" ry="8" fill="${hair}"/>`;
      break;
    case "ponytail":
      hairLayer = `<path d="M98 108 Q100 40 160 38 Q220 40 222 108 Q200 74 160 72 Q120 74 98 108Z" fill="${hair}"/><path d="M214 70 Q258 110 236 176 Q226 190 218 176 Q232 120 206 84Z" fill="${hair}"/><circle cx="216" cy="74" r="10" fill="${s.accent}"/><circle cx="112" cy="128" r="5" fill="${s.accent}"/><circle cx="208" cy="128" r="5" fill="${s.accent}"/>`;
      break;
    case "techie":
      hairLayer = `<path d="M100 104 L112 52 L132 84 L148 44 L164 80 L182 46 L196 82 L212 56 L220 104 Q190 66 160 66 Q130 66 100 104Z" fill="${hair}"/>`;
      break;
    case "hacker":
      hairLayer = `<path d="M88 116 Q86 22 160 20 Q234 22 232 116 L232 190 Q214 176 210 150 L212 108 Q196 70 160 68 Q124 70 108 108 L110 150 Q106 176 88 190Z" fill="${shirt}"/><path d="M88 116 Q86 22 160 20 Q234 22 232 116" fill="none" stroke="#0d1117" stroke-width="5" opacity=".4"/><path d="M112 96 Q124 58 160 56 Q196 58 208 96 Q190 74 160 74 Q130 74 112 96Z" fill="#0d1117" opacity=".85"/>`;
      break;
    case "curly":
      hairLayer = `<circle cx="104" cy="80" r="26" fill="${hair}"/><circle cx="128" cy="52" r="28" fill="${hair}"/><circle cx="164" cy="42" r="28" fill="${hair}"/><circle cx="200" cy="54" r="26" fill="${hair}"/><circle cx="218" cy="84" r="24" fill="${hair}"/><path d="M108 96 Q160 60 212 96 L206 70 Q160 40 114 70Z" fill="${hair}"/>`;
      break;
    case "longhair":
      hairLayer = `<path d="M96 100 Q94 30 160 28 Q226 30 224 100 L224 190 Q210 170 206 120 Q190 80 160 78 Q130 80 114 120 Q110 170 96 190Z" fill="${hair}"/>`;
      break;
    case "hijabi":
      hairLayer = `<path d="M92 110 Q92 28 160 26 Q228 28 228 110 L228 200 Q200 178 192 140 L128 140 Q120 178 92 200Z" fill="${s.soft}"/><path d="M92 110 Q92 28 160 26 Q228 28 228 110" fill="none" stroke="${s.accent}" stroke-width="5" opacity=".8"/>`;
      break;
    case "astronaut":
      hairLayer = `<circle cx="160" cy="110" r="78" fill="none" stroke="#ffffff" stroke-width="10" opacity=".9"/><circle cx="160" cy="110" r="78" fill="none" stroke="${s.accent}" stroke-width="3" opacity=".7"/><rect x="86" y="176" width="30" height="60" rx="10" fill="#d7dde3"/><rect x="204" y="176" width="30" height="60" rx="10" fill="#d7dde3"/><circle cx="216" cy="52" r="10" fill="${s.accent}" opacity=".8"/>`;
      break;
    case "robot":
      hairLayer = `<rect x="104" y="30" width="112" height="40" rx="14" fill="#9aa6b2"/><line x1="160" y1="30" x2="160" y2="8" stroke="#9aa6b2" stroke-width="6"/><circle cx="160" cy="10" r="8" fill="${s.accent}"><animate attributeName="opacity" values="1;.3;1" dur="1.2s" repeatCount="indefinite"/></circle><rect x="104" y="60" width="112" height="14" rx="7" fill="#6b7684"/>`;
      break;
  }

  const screenGlow = s.persona === "hacker" ? "#00FF66" : s.accent;

  // Identity props drawn BEHIND the character — each personality gets its scene.
  let propsBehind = "";
  switch (s.persona) {
    case "curly":
      // Artist palette + brush for the creative.
      propsBehind = `<g><ellipse cx="36" cy="292" rx="32" ry="26" fill="#ffffff" stroke="#0d1117" stroke-opacity=".2" stroke-width="2"/><circle cx="24" cy="284" r="6" fill="${s.accent}"/><circle cx="42" cy="280" r="6" fill="${s.soft}"/><circle cx="50" cy="296" r="6" fill="#38BDF8"/><circle cx="30" cy="300" r="6" fill="${skin}"/><line x1="58" y1="248" x2="84" y2="286" stroke="${hair}" stroke-width="6" stroke-linecap="round"/></g>`;
      break;
    case "longhair":
      // Chill potted plant.
      propsBehind = `<g><path d="M262 288 L268 262 M292 288 L286 262 M277 288 L277 256" stroke="#2f9e44" stroke-width="5" stroke-linecap="round" fill="none"/><ellipse cx="266" cy="252" rx="13" ry="8" fill="#2f9e44" transform="rotate(-30 266 252)"/><ellipse cx="288" cy="252" rx="13" ry="8" fill="#40c057" transform="rotate(30 288 252)"/><path d="M258 288 L296 288 L290 322 L264 322Z" fill="${s.accent}"/></g>`;
      break;
    case "hijabi":
      // Stack of books.
      propsBehind = `<g><rect x="0" y="288" width="64" height="14" rx="3" fill="${s.accent}"/><rect x="5" y="274" width="56" height="14" rx="3" fill="${s.soft}"/><rect x="0" y="260" width="60" height="14" rx="3" fill="${shirt}"/></g>`;
      break;
    case "techie":
      // Desktop monitor with code.
      propsBehind = `<g><rect x="246" y="228" width="70" height="52" rx="6" fill="#0d1117"/><rect x="254" y="236" width="40" height="5" rx="2.5" fill="${s.accent}" opacity=".9"/><rect x="254" y="245" width="54" height="5" rx="2.5" fill="${s.accent}" opacity=".5"/><rect x="254" y="254" width="30" height="5" rx="2.5" fill="${s.accent}" opacity=".5"/><rect x="274" y="280" width="14" height="12" fill="#0d1117"/><rect x="262" y="292" width="38" height="6" rx="3" fill="#0d1117"/></g>`;
      break;
    case "boss":
      // Briefcase + rising chart.
      propsBehind = `<g><polyline points="252,66 272,50 284,56 306,30" fill="none" stroke="${s.accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><polygon points="306,30 294,32 302,42" fill="${s.accent}"/><rect x="4" y="272" width="60" height="44" rx="6" fill="#0d1117" opacity=".85"/><rect x="22" y="262" width="24" height="14" rx="5" fill="none" stroke="#0d1117" stroke-width="5"/><line x1="34" y1="274" x2="34" y2="316" stroke="#ffffff" stroke-width="2" opacity=".4"/></g>`;
      break;
    case "cheer":
      // Confetti.
      propsBehind = `<g><circle cx="28" cy="60" r="6" fill="${s.accent}"/><circle cx="292" cy="48" r="6" fill="${s.soft}"/><rect x="52" y="120" width="12" height="12" rx="2" fill="${s.soft}" transform="rotate(20 58 126)"/><rect x="256" y="120" width="12" height="12" rx="2" fill="${s.accent}" transform="rotate(-20 262 126)"/><circle cx="20" cy="190" r="5" fill="${s.soft}"/><circle cx="300" cy="200" r="5" fill="${s.accent}"/></g>`;
      break;
    case "astronaut":
      // Ringed planet + stars.
      propsBehind = `<g><circle cx="42" cy="56" r="18" fill="${s.accent}" opacity=".85"/><ellipse cx="42" cy="56" rx="32" ry="9" fill="none" stroke="${s.soft}" stroke-width="4" transform="rotate(-18 42 56)"/><path d="M96 30h16M104 22v16M268 40h14M275 33v14" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/></g>`;
      break;
    case "robot":
      // Spinning gears + circuit.
      propsBehind = `<g><circle cx="36" cy="292" r="20" fill="none" stroke="#9aa6b2" stroke-width="8" stroke-dasharray="8 7"><animateTransform attributeName="transform" type="rotate" from="0 36 292" to="360 36 292" dur="9s" repeatCount="indefinite"/></circle><circle cx="36" cy="292" r="6" fill="#9aa6b2"/><circle cx="78" cy="308" r="12" fill="none" stroke="#9aa6b2" stroke-width="6" stroke-dasharray="6 5"><animateTransform attributeName="transform" type="rotate" from="360 78 308" to="0 78 308" dur="7s" repeatCount="indefinite"/></circle></g>`;
      break;
    case "hacker":
      // Floating code fragments.
      propsBehind = `<g font-family="monospace" font-size="20" font-weight="bold" fill="${screenGlow}"><text x="6" y="60">&lt;/&gt;</text><text x="252" y="62">{;}</text></g>`;
      break;
    case "ponytail":
      // Creative sparkles.
      propsBehind = `<g stroke="${s.accent}" stroke-width="4" stroke-linecap="round"><path d="M20 60h20M30 50v20"/><path d="M52 96h14M59 89v14"/></g><circle cx="72" cy="42" r="5" fill="${s.soft}"/>`;
      break;
  }

  // Front laptop: the hacker's identity (always on), or anyone in laptop pose.
  // Typing hands + blinking cursor only when actually typing.
  const showLaptop = s.pose === "laptop" || s.persona === "hacker";
  const typing = s.pose === "laptop";
  const bounce = s.animateWave && typing
    ? `<animate attributeName="cy" values="300;295;300" dur=".45s" repeatCount="indefinite"/>`
    : ``;
  const propsFront = showLaptop
    ? `<g><rect x="100" y="232" width="120" height="76" rx="8" fill="#0d1117"/><rect x="110" y="242" width="70" height="7" rx="3.5" fill="${screenGlow}" opacity=".85"/><rect x="110" y="254" width="100" height="7" rx="3.5" fill="${screenGlow}" opacity=".5"/><rect x="110" y="266" width="52" height="7" rx="3.5" fill="${screenGlow}" opacity=".5"/>${typing ? `<rect x="166" y="264" width="7" height="12" fill="${screenGlow}"><animate attributeName="opacity" values="1;0;1" dur=".9s" repeatCount="indefinite"/></rect>` : ""}${s.persona === "hacker" ? `<text x="186" y="256" fill="${screenGlow}" font-family="monospace" font-size="17" font-weight="bold">&lt;/&gt;</text>` : ""}<rect x="88" y="308" width="144" height="12" rx="6" fill="#0d1117" opacity=".9"/>${typing ? `<circle cx="122" cy="300" r="13" fill="${skin}">${bounce}</circle><circle cx="198" cy="300" r="13" fill="${skin}">${bounce}</circle>` : ""}</g>`
    : "";

  return `<g>${propsBehind}${leftArm}${torso}${head}${hairLayer}${face}${wearables}${arm}${propsFront}</g>`;
}

/** Standalone mini figure used for the selectable persona boxes in the studio. */
export function buildPersonaPreviewSvg(persona: CardPersonaId, s: ProfileCardSettings): string {
  const settings: ProfileCardSettings = { ...s, persona, pose: "wave" };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 340">${buildPersonaFigure(settings)}</svg>`;
}

function buildBackground(s: ProfileCardSettings, fg: string): string {
  const bg = s.background;
  const accent = s.accent;
  if (s.backgroundStyle === "gradient") {
    return `<defs><linearGradient id="pcbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${s.soft}"/></linearGradient></defs><rect width="1200" height="630" rx="24" fill="url(#pcbg)"/>`;
  }
  let pattern = "";
  if (s.backgroundStyle === "grid") {
    pattern = `<defs><pattern id="pcgrid" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" fill="none" stroke="${fg}" stroke-opacity=".14"/></pattern></defs><rect width="1200" height="630" rx="24" fill="${bg}"/><rect width="1200" height="630" rx="24" fill="url(#pcgrid)"/>`;
  } else if (s.backgroundStyle === "dots") {
    pattern = `<defs><pattern id="pcdots" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.4" fill="${fg}" opacity=".16"/></pattern></defs><rect width="1200" height="630" rx="24" fill="${bg}"/><rect width="1200" height="630" rx="24" fill="url(#pcdots)"/>`;
  } else if (s.backgroundStyle === "blob") {
    pattern = `<rect width="1200" height="630" rx="24" fill="${bg}"/><circle cx="980" cy="315" r="250" fill="${s.soft}" opacity=".55"/><circle cx="980" cy="315" r="185" fill="${bg}"/><circle cx="150" cy="540" r="130" fill="${accent}" opacity=".12"/><circle cx="1050" cy="90" r="90" fill="${accent}" opacity=".16"/>`;
  } else {
    pattern = `<rect width="1200" height="630" rx="24" fill="${bg}"/>`;
  }
  return pattern;
}

export function buildProfileCardSvg(
  settings: ProfileCardSettings,
  profile: { name: string; handle: string; location: string },
  opts: { avatarUrl?: string; repos?: number; followers?: number; contributions?: string | number | null; headline?: string; tech?: string[] }
): string {
  const s = settings;
  const name = escapeXml(profile.name || "Your Name");
  const handle = escapeXml(profile.handle?.replace(/^@/, "") || "your-handle");
  // Uppercase BEFORE escaping — otherwise entities like &apos; become invalid &APOS;
  const greeting = escapeXml((s.greeting || "Hey there, I'm").toUpperCase());
  const role = escapeXml(s.role || opts.headline || "");
  const tagline = escapeXml(s.tagline || "");
  const location = escapeXml(profile.location || "");
  const centered = s.layout === "centered";

  // Auto-contrast: dark card backgrounds get light foreground text/pills.
  const dark = luminance(s.background) < 0.35;
  const fg = dark ? "#F7FAF7" : s.ink;
  const pillFill = dark ? "#FFFFFF" : s.ink;
  const pillText = dark ? s.ink : "#FFFFFF";

  const stats = [
    `${opts.repos ?? 48} repos`,
    `${opts.contributions ?? "1.2k"} contributions`,
    `${opts.followers ?? 128} followers`,
  ];
  const statsRow = s.showStats
    ? `<g font-family="${escapeXml(s.font)}" font-size="20">${stats
        .map((label, i) => {
          const x = centered ? 600 - 300 + i * 210 : 96 + i * 215;
          return `<g transform="translate(${x},0)"><rect x="0" y="0" width="195" height="52" rx="26" fill="${pillFill}"/><text x="97" y="33" text-anchor="middle" fill="${pillText}" font-weight="700">${escapeXml(String(label))}</text></g>`;
        })
        .join("")}</g>`
    : "";

  const techPills = s.showTech && (opts.tech ?? []).length
    ? `<g font-family="${escapeXml(s.font)}" font-size="17">${(opts.tech ?? []).slice(0, 4).map((t, i) => {
        const x = centered ? 600 - 260 + i * 135 : 96 + i * 135;
        return `<g transform="translate(${x},0)"><rect x="0" y="0" width="122" height="38" rx="19" fill="none" stroke="${s.accent}" stroke-width="2"/><text x="61" y="25" text-anchor="middle" fill="${s.accent}" font-weight="700">${escapeXml(t.slice(0, 12))}</text></g>`;
      }).join("")}</g>`
    : "";

  // Avatar / figure zone. Centered layout stacks a smaller figure on top, text below.
  const cx = centered ? 600 : 950;
  const cy = centered ? 300 : 315;
  const figK = centered ? 0.62 : 1;
  const figX = centered ? cx - 160 * figK : cx - 160;
  const figY = centered ? 30 : cy - 160;
  let figure = "";
  if (s.avatarMode === "github" && opts.avatarUrl) {
    figure = `<g><clipPath id="pcclip"><circle cx="${cx}" cy="${cy}" r="140"/></clipPath><circle cx="${cx}" cy="${cy}" r="148" fill="${s.accent}"/><image href="${escapeXml(opts.avatarUrl)}" x="${cx - 140}" y="${cy - 140}" width="280" height="280" clip-path="url(#pcclip)" preserveAspectRatio="xMidYMid slice"/>${s.animateWave ? `<g transform="translate(${cx + 118},${cy - 96})"><text font-size="64"><animateTransform attributeName="transform" type="rotate" values="-14;16;-14" dur="2.2s" repeatCount="indefinite"/>👋</text></g>` : ""}</g>`;
  } else if (s.avatarMode === "initials") {
    figure = `<g><circle cx="${cx}" cy="${cy}" r="140" fill="${s.ink}"/><circle cx="${cx}" cy="${cy}" r="140" fill="none" stroke="${s.accent}" stroke-width="6" stroke-dasharray="10 10"><animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="20s" repeatCount="indefinite"/></circle><text x="${cx}" y="${cy + 30}" text-anchor="middle" fill="#ffffff" font-family="${escapeXml(s.font)}" font-size="84" font-weight="700">${escapeXml(initialsOf(profile.name))}</text></g>`;
  } else {
    figure = `<g transform="translate(${figX},${figY}) scale(${figK})">${buildPersonaFigure(s)}</g>`;
  }

  const textAnchor = centered ? "middle" : "start";
  const tx = centered ? 600 : 96;
  const nameSize = centered ? 64 : name.length > 18 ? 64 : 84;
  const textBlock = `
    <text x="${tx}" y="${centered ? 300 : 150}" text-anchor="${textAnchor}" fill="${s.accent}" font-family="${escapeXml(s.font)}" font-size="22" letter-spacing="4">${greeting} 👋</text>
    <text x="${tx}" y="${centered ? 372 : 245}" text-anchor="${textAnchor}" fill="${fg}" font-family="sans-serif" font-size="${nameSize}" font-weight="800" letter-spacing="-2">${name}</text>
    <text x="${tx}" y="${centered ? 408 : 292}" text-anchor="${textAnchor}" fill="${fg}" opacity=".75" font-family="${escapeXml(s.font)}" font-size="24">${role.slice(0, 60)}</text>
    <text x="${tx}" y="${centered ? 438 : 330}" text-anchor="${textAnchor}" fill="${fg}" opacity=".6" font-family="sans-serif" font-size="20">${tagline.slice(0, 72)}</text>
    <g transform="translate(0,${centered ? 460 : 372})">${statsRow}</g>
    <g transform="translate(0,${centered ? 528 : 444})">${techPills}</g>
    <text x="${tx}" y="${centered ? 600 : 560}" text-anchor="${textAnchor}" fill="${fg}" opacity=".55" font-family="${escapeXml(s.font)}" font-size="19">github.com/${handle}${location ? `  ·  ${location}` : ""}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect x="2" y="2" width="1196" height="626" rx="26" fill="none" stroke="${fg}" stroke-opacity=".25" stroke-width="2"/>${buildBackground(s, fg)}${centered ? "" : figure}<g>${textBlock}</g>${centered ? `<g opacity=".92">${figure}</g>` : ""}<rect x="${centered ? 540 : 96}" y="${centered ? 610 : 578}" width="120" height="5" fill="${s.accent}"/><text x="1104" y="606" text-anchor="end" fill="${fg}" opacity=".6" font-family="${escapeXml(s.font)}" font-size="14" letter-spacing="1">made with readme/studio · icedmist.tech</text></svg>`;
}
