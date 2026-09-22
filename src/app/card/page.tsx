"use client";

import { useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import { TechItem, techStackLibrary } from "../data/techStack";
import {
  buildProfileCardSvg,
  buildPersonaPreviewSvg,
  cardPersonas,
  cardSkinTones,
  defaultProfileCardSettings,
  ProfileCardSettings,
} from "../data/profileCard";
import { parseReadmeDetails } from "../data/readmeImport";

type GithubProfile = {
  username: string;
  name: string;
  bio: string;
  avatarUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
  contributions: number | null;
  profileUrl: string;
};

function pickDefaults(ids: string[]): TechItem[] {
  const found = ids
    .map((id) => techStackLibrary.find((t) => t.id === id))
    .filter((t): t is TechItem => Boolean(t));
  return found.length ? found : techStackLibrary.slice(0, 4);
}

function svgData(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function CardStudio() {
  const [profile, setProfile] = useState({
    name: "Maya Okafor",
    handle: "maya-builds",
    headline: "I make thoughtful tools for noisy problems.",
    bio: "Product engineer exploring the space between useful software, good questions, and a little bit of magic.",
    location: "Lagos, Nigeria",
  });
  const [cardSettings, setCardSettings] = useState<ProfileCardSettings>(defaultProfileCardSettings);
  const [selectedTech, setSelectedTech] = useState<TechItem[]>(() => pickDefaults(["ts", "react", "nextjs", "nodejs"]));

  const [githubProfile, setGithubProfile] = useState<GithubProfile | null>(null);
  const [githubStatus, setGithubStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const [tab, setTab] = useState<"preview" | "markdown">("preview");
  const [copied, setCopied] = useState(false);
  const [bundleStatus, setBundleStatus] = useState<"idle" | "creating" | "done">("idle");
  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "success" | "error">("idle");
  const [publishError, setPublishError] = useState("");

  const setField = (field: keyof typeof profile, value: string) =>
    setProfile((current) => ({ ...current, [field]: value }));
  const setCardField = <K extends keyof ProfileCardSettings>(key: K, value: ProfileCardSettings[K]) =>
    setCardSettings((current) => ({ ...current, [key]: value }));

  // Live GitHub profile whenever the handle changes.
  useEffect(() => {
    const username = profile.handle.trim().replace(/^@/, "");
    if (!username) {
      setGithubProfile(null);
      setGithubStatus("idle");
      return;
    }
    const controller = new AbortController();
    setGithubStatus("loading");
    fetch(`/api/github/profile?username=${encodeURIComponent(username)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("GitHub profile unavailable");
        return response.json() as Promise<GithubProfile>;
      })
      .then((data) => {
        setGithubProfile(data);
        setGithubStatus("ready");
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setGithubProfile(null);
          setGithubStatus("error");
        }
      });
    return () => controller.abort();
  }, [profile.handle]);

  const cardSvg = useMemo(
    () =>
      buildProfileCardSvg(cardSettings, profile, {
        avatarUrl: githubProfile?.avatarUrl,
        repos: githubProfile?.publicRepos ?? 48,
        followers: githubProfile?.followers ?? 128,
        contributions: githubProfile?.contributions?.toLocaleString() ?? "1.2k",
        headline: profile.headline,
        tech: selectedTech.map((t) => t.name),
      }),
    [cardSettings, profile, githubProfile, selectedTech]
  );

  const markdown = useMemo(
    () => `![Hi, I'm ${profile.name}](./assets/profile-card.svg)\n`,
    [profile.name]
  );

  // Pull name / bio / handle from the live GitHub profile, plus role,
  // tagline and location parsed out of the user's current README.
  const importFromGithub = async () => {
    if (!githubProfile) return;
    setImportStatus("loading");
    let details = {};
    try {
      const res = await fetch(`/api/github/readme?username=${encodeURIComponent(githubProfile.username)}`);
      if (res.ok) {
        const payload = await res.json();
        if (typeof payload.content === "string") details = parseReadmeDetails(payload.content);
      }
    } catch {
      // No README (or private) — profile data alone is still a good import.
    }
    const { name, headline, bio, location } = details as { name?: string; headline?: string; bio?: string; location?: string };
    const role = headline || githubProfile.bio || profile.headline;
    const tagline = bio || githubProfile.bio || profile.bio;
    setProfile((current) => ({
      ...current,
      name: name || githubProfile.name || current.name,
      handle: githubProfile.username,
      bio: tagline,
      headline: role,
      location: location || current.location,
    }));
    setCardSettings((current) => ({ ...current, role, tagline }));
    setImportStatus("success");
    window.setTimeout(() => setImportStatus("idle"), 2200);
  };

  const toggleTech = (item: TechItem) => {
    setSelectedTech((current) => {
      if (current.some((t) => t.id === item.id)) return current.filter((t) => t.id !== item.id);
      if (current.length >= 8) return current;
      return [...current, item];
    });
  };

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const downloadBundle = async () => {
    setBundleStatus("creating");
    const zip = new JSZip();
    zip.file("README.md", markdown);
    zip.folder("assets")?.file("profile-card.svg", cardSvg);
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.handle || "profile"}-card-bundle.zip`;
    link.click();
    URL.revokeObjectURL(url);
    setBundleStatus("done");
    window.setTimeout(() => setBundleStatus("idle"), 2200);
  };

  const publishToGitHub = async () => {
    setPublishStatus("publishing");
    setPublishError("");
    const response = await fetch("/api/github/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown, assets: [{ path: "assets/profile-card.svg", content: cardSvg }] }),
    });
    if (response.status === 401) {
      window.location.href = "/api/auth/github/start";
      return;
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: "GitHub could not publish this card." }));
      setPublishError(payload.error || "GitHub could not publish this card.");
    }
    setPublishStatus(response.ok ? "success" : "error");
  };

  return (
    <main className="builder-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <a href="/" style={{ color: "inherit", textDecoration: "none" }}>
            <span className="brand-mark">✳</span> <span>readme / studio</span>
          </a>
          <span style={{ color: "#9aa39b" }}>/ single-card</span>
        </div>
        <div className="topbar-meta">
          <span className="status-dot" />{" "}
          {githubStatus === "loading"
            ? "Refreshing GitHub data…"
            : githubStatus === "ready"
              ? `Live data from @${githubProfile?.username}`
              : "One SVG as your whole profile"}
          <a className="github-login" href="/" style={{ textDecoration: "none" }}>
            Full studio <span>↗</span>
          </a>
        </div>
      </header>

      <section className="intro-row">
        <div>
          <p className="eyebrow">Single-card mode</p>
          <h1>
            One picture,
            <br />
            <em>thats your README.</em>
          </h1>
        </div>
        <div className="intro-side">
          <p>Your name plus a waving character in one fully-customizable SVG. Pick a persona, tune the colors, ship it.</p>
          <div className="publish-panel">
            <strong>Publish this card</strong>
            <small>README with just your card, plus the SVG asset.</small>
            <button onClick={publishToGitHub}>
              {publishStatus === "publishing" ? "Publishing…" : publishStatus === "success" ? "Published" : "Add to GitHub"} <span>↗</span>
            </button>
          </div>
        </div>
      </section>

      <div className="workspace-grid">
        <aside className="editor-panel">
          <div className="panel-heading">
            <div>
              <span className="section-number">01</span>
              <h2>Your details</h2>
            </div>
          </div>
          <Field label="Name" value={profile.name} onChange={(v) => setField("name", v)} />
          <Field label="GitHub handle" prefix="github.com/" value={profile.handle} onChange={(v) => setField("handle", v)} />
          <Field label="Role line" multiline value={profile.headline} onChange={(v) => { setField("headline", v); setCardField("role", v); }} />
          <Field label="Tagline" multiline value={profile.bio} onChange={(v) => { setField("bio", v); setCardField("tagline", v); }} />
          <Field label="Based in" value={profile.location} onChange={(v) => setField("location", v)} />
          <button className="sync-profile" onClick={importFromGithub} disabled={!githubProfile}>
            {importStatus === "success" ? "✓ Imported from GitHub" : importStatus === "loading" ? "Importing…" : githubProfile ? `Import @${githubProfile.username} details` : "Enter a handle to import"} <span>↗</span>
          </button>

          <div className="panel-divider small" />

          <div className="panel-heading compact">
            <div>
              <span className="section-number">02</span>
              <h2>Character</h2>
            </div>
          </div>
          <small>PERSONA — PICK YOUR CHARACTER:</small>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, margin: "8px 0 12px" }}>
            {cardPersonas.map((persona) => {
              const selected = cardSettings.persona === persona.id;
              return (
                <button
                  key={persona.id}
                  onClick={() => setCardField("persona", persona.id)}
                  title={`${persona.name} — ${persona.note}`}
                  style={{
                    border: selected ? "2px solid var(--orange)" : "1px solid var(--line)",
                    borderRadius: 8,
                    background: selected ? "#fff4ef" : "var(--cream)",
                    padding: 6,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <img src={svgData(buildPersonaPreviewSvg(persona.id, cardSettings))} alt={persona.name} style={{ width: "100%", height: 84, objectFit: "contain" }} />
                  <strong style={{ fontSize: 10, color: selected ? "var(--orange)" : "var(--ink)" }}>{persona.emoji} {persona.name}</strong>
                  <small style={{ fontSize: 8, color: "#9aa39b", fontFamily: "'DM Mono', monospace" }}>{persona.note}</small>
                </button>
              );
            })}
          </div>
          <small>POSE:</small>
          <div className="tech-picker-chips" style={{ margin: "8px 0 12px" }}>
            {(["wave", "peace", "laptop"] as const).map((pose) => (
              <button
                key={pose}
                className={`tech-chip ${cardSettings.pose === pose ? "active" : ""}`}
                onClick={() => setCardField("pose", pose)}
                style={cardSettings.pose === pose ? { borderColor: "var(--orange)", color: "var(--orange)" } : undefined}
              >
                {pose === "wave" ? "👋 wave" : pose === "peace" ? "✌️ peace" : "💻 laptop"}
              </button>
            ))}
          </div>
          <small>FACE:</small>
          <div className="tech-picker-chips" style={{ margin: "8px 0 12px" }}>
            {(["persona", "github", "initials"] as const).map((avatarMode) => (
              <button
                key={avatarMode}
                className={`tech-chip ${cardSettings.avatarMode === avatarMode ? "active" : ""}`}
                onClick={() => setCardField("avatarMode", avatarMode)}
                style={cardSettings.avatarMode === avatarMode ? { borderColor: "var(--orange)", color: "var(--orange)" } : undefined}
              >
                {avatarMode === "persona" ? "🎨 Illustrated" : avatarMode === "github" ? "🐙 GitHub avatar" : "🔤 Initials"}
              </button>
            ))}
          </div>
          <small>SKIN TONE:</small>
          <div style={{ display: "flex", gap: 6, margin: "8px 0 12px" }}>
            {cardSkinTones.map((tone) => (
              <button
                key={tone}
                title={tone}
                onClick={() => setCardField("skinTone", tone)}
                style={{ width: 26, height: 26, borderRadius: "50%", border: cardSettings.skinTone === tone ? "2px solid var(--orange)" : "1px solid var(--line)", backgroundColor: tone }}
              />
            ))}
          </div>
          <div className="color-row">
            <ColorField label="Hair" value={cardSettings.hairColor} onChange={(v) => setCardField("hairColor", v)} />
            <ColorField label="Shirt" value={cardSettings.shirtColor} onChange={(v) => setCardField("shirtColor", v)} />
            <ColorField label="Card bg" value={cardSettings.background} onChange={(v) => setCardField("background", v)} />
          </div>

          <div className="panel-divider small" />

          <div className="panel-heading compact">
            <div>
              <span className="section-number">03</span>
              <h2>Card style</h2>
            </div>
          </div>
          <SvgTextField label="Greeting" value={cardSettings.greeting} onChange={(v) => setCardField("greeting", v)} />
          <small>LAYOUT + BACKDROP:</small>
          <div className="tech-picker-chips" style={{ margin: "8px 0 12px" }}>
            {(["split", "centered"] as const).map((layout) => (
              <button
                key={layout}
                className={`tech-chip ${cardSettings.layout === layout ? "active" : ""}`}
                onClick={() => setCardField("layout", layout)}
                style={cardSettings.layout === layout ? { borderColor: "var(--orange)", color: "var(--orange)" } : undefined}
              >
                {layout}
              </button>
            ))}
            {(["blob", "grid", "dots", "gradient", "solid"] as const).map((backgroundStyle) => (
              <button
                key={backgroundStyle}
                className={`tech-chip ${cardSettings.backgroundStyle === backgroundStyle ? "active" : ""}`}
                onClick={() => setCardField("backgroundStyle", backgroundStyle)}
                style={cardSettings.backgroundStyle === backgroundStyle ? { borderColor: "var(--orange)", color: "var(--orange)" } : undefined}
              >
                {backgroundStyle}
              </button>
            ))}
          </div>
          <div className="color-row">
            <ColorField label="Accent" value={cardSettings.accent} onChange={(v) => setCardField("accent", v)} />
            <ColorField label="Ink" value={cardSettings.ink} onChange={(v) => setCardField("ink", v)} />
            <ColorField label="Soft" value={cardSettings.soft} onChange={(v) => setCardField("soft", v)} />
          </div>
          <ComponentToggle label="Show live stats pills" note="repos · contributions · followers" active={cardSettings.showStats} onClick={() => setCardField("showStats", !cardSettings.showStats)} />
          <ComponentToggle label="Show tech pills" note="up to 8, pick below" active={cardSettings.showTech} onClick={() => setCardField("showTech", !cardSettings.showTech)} />
          <ComponentToggle label="Animate wave" note="SMIL waving hand" active={cardSettings.animateWave} onClick={() => setCardField("animateWave", !cardSettings.animateWave)} />

          <div className="panel-divider small" />

          <div className="panel-heading compact">
            <div>
              <span className="section-number">04</span>
              <h2>Tech pills</h2>
            </div>
          </div>
          <p className="panel-subtext">Tap to toggle — first 8 show on the card.</p>
          <div className="tech-picker-chips">
            {techStackLibrary.slice(0, 24).map((item) => {
              const active = selectedTech.some((t) => t.id === item.id);
              return (
                <button
                  key={item.id}
                  className={`tech-chip ${active ? "active" : ""}`}
                  onClick={() => toggleTech(item)}
                  style={active ? { borderColor: "var(--orange)", color: "var(--orange)" } : undefined}
                >
                  {active ? "✓ " : "+ "}{item.name}
                </button>
              );
            })}
          </div>

          <div className="svg-downloads">
            <button onClick={() => downloadFile("profile-card.svg", cardSvg, "image/svg+xml;charset=utf-8")}>Profile card ↓</button>
          </div>
        </aside>

        <section className="preview-panel">
          <div className="preview-toolbar">
            <div className="window-dots"><span /><span /><span /></div>
            <div className="mode-tabs">
              <button className={tab === "preview" ? "selected" : ""} onClick={() => setTab("preview")}>Preview</button>
              <button className={tab === "markdown" ? "selected" : ""} onClick={() => setTab("markdown")}>Markdown</button>
            </div>
            <div className="toolbar-actions">
              <button title="Download SVG" onClick={() => downloadFile("profile-card.svg", cardSvg, "image/svg+xml;charset=utf-8")}>↓</button>
              <button title="Copy Markdown" onClick={copyMarkdown}>{copied ? "✓" : "↗"}</button>
            </div>
          </div>

          {tab === "preview" ? (
            <div className="github-frame">
              <div className="github-label">
                Single-card render <span>●</span>{" "}
                <small>{githubStatus === "loading" ? "Refreshing GitHub data…" : githubStatus === "ready" ? `Live data from @${githubProfile?.username}` : "Static preview data"}</small>
              </div>
              <img src={svgData(cardSvg)} alt="Single-card profile preview" style={{ width: "100%", marginTop: 24, border: "1px solid #e5e8e2", borderRadius: 8, background: "#fff" }} />
            </div>
          ) : (
            <pre className="source-view"><code>{markdown}</code></pre>
          )}

          {publishError && <div className="notice publish-notice">{publishError}</div>}

          <div className="preview-footer">
            <span>README.md + assets/profile-card.svg</span>
            <div>
              <button className="publish-button" onClick={publishToGitHub}>
                {publishStatus === "publishing" ? "Publishing…" : publishStatus === "success" ? "Published" : "Add to GitHub"} <span>↗</span>
              </button>
              <button onClick={copyMarkdown}>{copied ? "Copied" : "Copy Markdown"} <span>↗</span></button>
              <button onClick={() => downloadFile(`${profile.handle || "profile"}-README.md`, markdown, "text/markdown;charset=utf-8")}>README <span>↓</span></button>
              <button onClick={downloadBundle}>{bundleStatus === "creating" ? "Building…" : bundleStatus === "done" ? "Bundled" : "ZIP bundle"} <span>↓</span></button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, multiline = false, prefix }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; prefix?: string }) {
  return (
    <label>
      {label}
      {prefix ? (
        <div className="input-prefix">
          <span>{prefix}</span>
          <input value={value} onChange={(event) => onChange(event.target.value)} />
        </div>
      ) : multiline ? (
        <textarea rows={2} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function SvgTextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="asset-field">{label}<input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="color-field">{label}<input type="color" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function ComponentToggle({ label, note, active, onClick }: { label: string; note: string; active: boolean; onClick: () => void }) {
  return (
    <button className="component-row" onClick={onClick}>
      <span>
        <strong>{label}</strong>
        <small>{note}</small>
      </span>
      <span className={`toggle ${active ? "active" : ""}`}><i /></span>
    </button>
  );
}
