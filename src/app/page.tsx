"use client";

import { useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import JSZip from "jszip";
import { TechItem, techStackLibrary, buildTechStackBadgeMarkdown } from "./data/techStack";
import { buildTechOrbitSvg, buildTerminalSvg, buildRadarSvg, buildPulseWaveSvg, SvgThemeSettings } from "./data/animatedComponents";
import { themePresets, ThemePreset } from "./data/themes";
import { readyMadeTemplates, ProfileTemplate } from "./data/templates";

type Project = { name: string; description: string; tech: string };
type ComponentKey = "typing" | "snake" | "divider" | "signals" | "projects" | "footer" | "techOrbit" | "terminal" | "pulseWave";
type Mode = "studio" | "github" | "source";
type AssetKey = "hero" | "process" | "community" | "techOrbit" | "terminal" | "pulseWave";
type GithubRepository = { name: string; description: string; tech: string; url: string; stars: number };
type GithubProfile = { username: string; name: string; bio: string; avatarUrl: string; publicRepos: number; followers: number; following: number; contributions: number | null; profileUrl: string; repositories: GithubRepository[] };
type GithubAuthUser = { login: string; name: string; avatarUrl: string; profileUrl: string };

const initialState = {
  name: "Maya Okafor",
  handle: "maya-builds",
  headline: "I make thoughtful tools for noisy problems.",
  bio: "Product engineer exploring the space between useful software, good questions, and a little bit of magic.",
  location: "Lagos, Nigeria",
};

const starterProjects: Project[] = [
  { name: "signal-garden", description: "A tiny observability layer for calm, useful software.", tech: "TypeScript · Next.js" },
  { name: "field-notes", description: "A searchable notebook for ideas that want to become real.", tech: "Python · SQLite" },
];

function escapeXml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;" })[character] || character);
}

function svgData(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildHeroSvg(settings: SvgThemeSettings) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 260"><rect width="1200" height="260" rx="10" fill="${settings.ink}"/><circle cx="1050" cy="130" r="190" fill="none" stroke="${settings.soft}" stroke-width="2" opacity=".7"><animateTransform attributeName="transform" type="rotate" from="0 1050 130" to="360 1050 130" dur="18s" repeatCount="indefinite"/></circle><circle cx="1050" cy="130" r="125" fill="none" stroke="${settings.accent}" stroke-width="2" stroke-dasharray="8 12"><animateTransform attributeName="transform" type="rotate" from="360 1050 130" to="0 1050 130" dur="10s" repeatCount="indefinite"/></circle><text x="72" y="112" fill="${settings.soft}" font-family="${escapeXml(settings.font)}" font-size="16" letter-spacing="5">PERSONAL README</text><text x="72" y="170" fill="white" font-family="sans-serif" font-size="48" font-weight="700">${escapeXml(settings.heroLabel)}</text><path d="M72 198h210" stroke="${settings.accent}" stroke-width="4"/></svg>`;
}

function buildProcessSvg(settings: SvgThemeSettings) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 180"><rect width="1200" height="180" rx="8" fill="${settings.soft}"/><g fill="${settings.ink}" font-family="${escapeXml(settings.font)}" font-size="18"><text x="70" y="96">${escapeXml(settings.processLabel)}</text></g><path d="M70 125h1060" stroke="${settings.ink}" opacity=".25"/><circle cx="70" cy="125" r="7" fill="${settings.accent}"/><circle cx="565" cy="125" r="7" fill="${settings.accent}"/><circle cx="1130" cy="125" r="7" fill="${settings.accent}"/><path d="M90 125h450m45 0h525" stroke="${settings.accent}" stroke-width="3" stroke-dasharray="10 12"><animate attributeName="stroke-dashoffset" from="0" to="-44" dur="1.5s" repeatCount="indefinite"/></path></svg>`;
}

function buildProjectsSvg(settings: SvgThemeSettings, projects: Project[]) {
  const cards = projects.slice(0, 3).map((project, index) => {
    const x = 40 + index * 380;
    return `<g><rect x="${x}" y="35" width="340" height="150" rx="7" fill="white" stroke="${settings.ink}" stroke-opacity=".15"/><text x="${x + 24}" y="70" fill="${settings.accent}" font-family="${escapeXml(settings.font)}" font-size="13">0${index + 1}</text><text x="${x + 24}" y="102" fill="${settings.ink}" font-family="sans-serif" font-size="22" font-weight="700">${escapeXml(project.name)}</text><text x="${x + 24}" y="130" fill="${settings.ink}" opacity=".65" font-family="sans-serif" font-size="12">${escapeXml(project.tech)}</text><path d="M${x + 24} 153h${100 + index * 22}" stroke="${settings.accent}" stroke-width="3" stroke-dasharray="180" stroke-dashoffset="180"><animate attributeName="stroke-dashoffset" values="180;0;180" dur="4s" repeatCount="indefinite"/></path></g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 220"><rect width="1200" height="220" rx="8" fill="${settings.soft}"/>${cards}</svg>`;
}

function buildSignalsSvg(settings: SvgThemeSettings, githubProfile: GithubProfile | null) {
  const values = [githubProfile?.publicRepos ?? 48, githubProfile?.contributions?.toLocaleString() ?? "1.2k", githubProfile?.followers ?? 7];
  const labels = ["REPOSITORIES", "CONTRIBUTIONS", "FOLLOWERS"];
  const cells = values.map((value, index) => `<g transform="translate(${index * 385},0)"><text x="30" y="58" fill="${settings.accent}" font-family="${escapeXml(settings.font)}" font-size="34" font-weight="700">${escapeXml(String(value))}</text><text x="30" y="90" fill="${settings.ink}" opacity=".65" font-family="${escapeXml(settings.font)}" font-size="13" letter-spacing="2">${labels[index]}</text></g>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120"><rect width="1200" height="120" rx="8" fill="${settings.soft}"/>${cells}<path d="M385 20v80M770 20v80" stroke="${settings.ink}" opacity=".15"/><path d="M30 106h1140" stroke="${settings.accent}" stroke-width="2" stroke-dasharray="8 10"><animate attributeName="stroke-dashoffset" from="0" to="-36" dur="2s" repeatCount="indefinite"/></path></svg>`;
}

function buildFooterSvg(settings: SvgThemeSettings) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 150"><path d="M0 55 Q300 140 600 55 T1200 55V150H0Z" fill="${settings.ink}"><animate attributeName="d" dur="7s" repeatCount="indefinite" values="M0 55 Q300 140 600 55 T1200 55V150H0Z;M0 75 Q300 20 600 75 T1200 75V150H0Z;M0 55 Q300 140 600 55 T1200 55V150H0Z"/></path><text x="600" y="105" text-anchor="middle" fill="white" font-family="${escapeXml(settings.font)}" font-size="17" letter-spacing="4">${escapeXml(settings.footerLabel)}</text></svg>`;
}

export default function Home() {
  const [profile, setProfile] = useState(initialState);
  const [projects, setProjects] = useState(starterProjects);
  const [components, setComponents] = useState<Record<ComponentKey, boolean>>({
    typing: true,
    snake: true,
    divider: true,
    signals: true,
    projects: true,
    footer: true,
    techOrbit: true,
    terminal: true,
    pulseWave: false,
  });
  
  // Theme & SVG Settings
  const [activeTheme, setActiveTheme] = useState<ThemePreset>(themePresets[0]);
  const [svgSettings, setSvgSettings] = useState<SvgThemeSettings>(themePresets[0].settings);

  // Tech Stack & Drag and Drop state
  const [selectedTech, setSelectedTech] = useState<TechItem[]>([
    techStackLibrary[0], // JS
    techStackLibrary[1], // TS
    techStackLibrary[11], // React
    techStackLibrary[12], // Next.js
    techStackLibrary[19], // Node.js
    techStackLibrary[27], // Docker
  ]);
  const [draggedTechIdx, setDraggedTechIdx] = useState<number | null>(null);

  // Ready-Made Templates
  const [activeTemplateId, setActiveTemplateId] = useState<string>("fullstack");

  // Preload README state
  const [showPreloadModal, setShowPreloadModal] = useState(false);
  const [preloadUsername, setPreloadUsername] = useState("");
  const [preloadStatus, setPreloadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [preloadError, setPreloadError] = useState("");
  const [preloadedContent, setPreloadedContent] = useState<string | null>(null);

  // Editor modes & status
  const [showStats, setShowStats] = useState(true);
  const [showProjects, setShowProjects] = useState(true);
  const [showContact, setShowContact] = useState(true);
  const [mode, setMode] = useState<Mode>("studio");
  const [darkPreview, setDarkPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "success" | "error">("idle");
  const [publishError, setPublishError] = useState("");
  const [authError, setAuthError] = useState("");
  const [bundleStatus, setBundleStatus] = useState<"idle" | "creating" | "done">("idle");
  const [githubProfile, setGithubProfile] = useState<GithubProfile | null>(null);
  const [profileSynced, setProfileSynced] = useState(false);
  const [githubStatus, setGithubStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [authUser, setAuthUser] = useState<GithubAuthUser | null>(null);

  const setField = (field: keyof typeof profile, value: string) => setProfile((current) => ({ ...current, [field]: value }));
  const toggleComponent = (key: ComponentKey) => setComponents((current) => ({ ...current, [key]: !current[key] }));
  const setSvgField = (key: keyof SvgThemeSettings, value: string) => setSvgSettings((current) => ({ ...current, [key]: value }));

  // Theme application helper
  const applyTheme = (theme: ThemePreset) => {
    setActiveTheme(theme);
    setSvgSettings(theme.settings);
    setDarkPreview(theme.darkPreview);
  };

  // Template application helper
  const applyTemplate = (template: ProfileTemplate) => {
    setActiveTemplateId(template.id);
    setProfile(template.profile);
    setProjects(template.projects);
    setSelectedTech(template.selectedTech);
    setComponents(template.enabledComponents);
    applyTheme(template.theme);
  };

  // Generated SVG Files
  const svgFiles = useMemo(
    () => ({
      hero: buildHeroSvg(svgSettings),
      process: buildProcessSvg(svgSettings),
      signals: buildSignalsSvg(svgSettings, githubProfile),
      projects: buildProjectsSvg(svgSettings, projects),
      community: buildFooterSvg(svgSettings),
      techOrbit: buildTechOrbitSvg(svgSettings, selectedTech),
      terminal: buildTerminalSvg(svgSettings, profile.headline, profile.bio),
      radar: buildRadarSvg(svgSettings, githubProfile?.publicRepos ?? 48, githubProfile?.contributions?.toLocaleString() ?? "1.2k", githubProfile?.followers ?? 7),
      pulseWave: buildPulseWaveSvg(svgSettings),
    }),
    [githubProfile, profile.bio, profile.headline, projects, selectedTech, svgSettings]
  );

  // Preload live user README from GitHub
  const fetchUserReadme = async () => {
    const username = (preloadUsername || profile.handle).trim().replace(/^@/, "");
    if (!username) return;
    setPreloadStatus("loading");
    setPreloadError("");
    try {
      const res = await fetch(`/api/github/readme?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch README");
      }
      setPreloadedContent(data.content);
      setPreloadStatus("success");
      setMode("source"); // Switch to source view so user sees preloaded markdown
    } catch (err: unknown) {
      setPreloadStatus("error");
      setPreloadError(err instanceof Error ? err.message : "Error fetching README");
    }
  };

  useEffect(() => {
    const username = profile.handle.trim().replace(/^@/, "");
    if (!username) { setGithubProfile(null); setGithubStatus("idle"); return; }
    const controller = new AbortController();
    setGithubStatus("loading");
    fetch(`/api/github/profile?username=${encodeURIComponent(username)}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("GitHub profile unavailable"); return response.json() as Promise<GithubProfile>; })
      .then((data) => { setGithubProfile(data); setGithubStatus("ready"); })
      .catch((error: Error) => { if (error.name !== "AbortError") { setGithubProfile(null); setGithubStatus("error"); } });
    return () => controller.abort();
  }, [profile.handle]);

  useEffect(() => {
    fetch("/api/auth/github/me")
      .then((response) => (response.ok ? (response.json() as Promise<{ login: string; name: string; avatarUrl: string; profileUrl: string }>) : null))
      .then((user) => setAuthUser(user));
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const controller = new AbortController();
    fetch(`/api/github/profile?username=${encodeURIComponent(authUser.login)}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("GitHub profile unavailable"); return response.json() as Promise<GithubProfile>; })
      .then((data) => {
        setGithubProfile(data);
        setProfile((current) => ({ ...current, name: data.name, handle: data.username, bio: data.bio || current.bio }));
        if (data.repositories.length) setProjects(data.repositories.slice(0, 3).map(({ name, description, tech }) => ({ name, description, tech })));
        setProfileSynced(true);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [authUser]);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("github");
    if (status === "not-configured") setAuthError("GitHub login needs to be configured on this deployment. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET, then try again.");
    if (status === "auth-error") setAuthError("GitHub could not complete the login. Check the OAuth callback URL and try again.");
    if (status === "connected") window.history.replaceState({}, "", window.location.pathname);
  }, []);

  // Markdown output assembly
  const markdown = useMemo(() => {
    if (preloadedContent) return preloadedContent; // Raw preloaded content override if loaded

    const work = projects.map((project, index) => `### ${index + 1}. ${project.name}\n\n${project.description}\n\n**${project.tech}**`).join("\n\n");
    const typing = components.typing ? `![Animated typing introduction](https://readme-typing-svg.demolab.com?font=${encodeURIComponent(svgSettings.font)}&size=20&duration=3200&pause=900&color=${svgSettings.accent.replace("#", "")}&center=false&vCenter=true&width=700&lines=${encodeURIComponent(profile.headline)})\n\n` : "";
    const techOrbit = components.techOrbit ? "![Interactive Tech Orbit](./assets/tech-orbit.svg)\n\n" : "";
    const terminal = components.terminal ? "![Animated Cyberpunk Terminal](./assets/animated-terminal.svg)\n\n" : "";
    const pulseWave = components.pulseWave ? "![Activity Pulse Line](./assets/pulse-wave.svg)\n\n" : "";
    const techStackBadges = buildTechStackBadgeMarkdown(selectedTech);
    const divider = components.divider ? "![Visual process divider](./assets/process-flow.svg)\n\n" : "";
    const snake = components.snake ? `## Contribution trail\n\n![Animated contribution snake](https://raw.githubusercontent.com/platane/snk/output/github-contribution-grid-snake.svg)\n\n` : "";
    const footer = components.footer ? "\n![Visual community footer](./assets/community-footer.svg)\n" : "";
    const hero = "![Profile hero](./assets/profile-hero.svg)\n\n";
    const projectImage = showProjects && components.projects ? "![Visual project showcase](./assets/projects-showcase.svg)\n\n" : "";
    const stats = components.signals ? "![GitHub signals](./assets/github-signals.svg)\n\n" : `| ${githubProfile?.publicRepos ?? 48} repositories | ${githubProfile?.contributions?.toLocaleString() ?? "1.2k"} contributions | ${githubProfile?.followers ?? 7} followers |\n| --- | --- | --- |\n\n`;

    return `${hero}${typing}${terminal}# Hey, I'm ${profile.name} 👋\n\n> ${profile.headline}\n\n${profile.bio}\n\n📍 ${profile.location} · [GitHub](https://github.com/${profile.handle})\n\n${techStackBadges}${techOrbit}${pulseWave}${divider}${showStats ? `## A few signals\n\n${stats}` : ""}${showProjects ? `## Things I'm building\n\n${projectImage}${work}\n\n` : ""}${snake}${showContact ? `## Find me\n\n[GitHub](https://github.com/${profile.handle}) · [LinkedIn](https://linkedin.com/in/${profile.handle}) · hello@example.com\n` : ""}${footer}`;
  }, [components, githubProfile, preloadedContent, profile, projects, selectedTech, showContact, showProjects, showStats, svgSettings.accent, svgSettings.font]);

  // Drag & Drop reordering logic for Tech Stack
  const handleDragStart = (index: number) => {
    setDraggedTechIdx(index);
  };
  const handleDragOver = (event: React.DragEvent, index: number) => {
    event.preventDefault();
    if (draggedTechIdx === null || draggedTechIdx === index) return;
    const items = [...selectedTech];
    const item = items[draggedTechIdx];
    items.splice(draggedTechIdx, 1);
    items.splice(index, 0, item);
    setDraggedTechIdx(index);
    setSelectedTech(items);
  };
  const handleDragEnd = () => {
    setDraggedTechIdx(null);
  };
  const addTechItem = (item: TechItem) => {
    if (!selectedTech.find((t) => t.id === item.id)) {
      setSelectedTech([...selectedTech, item]);
    }
  };
  const removeTechItem = (id: string) => {
    setSelectedTech(selectedTech.filter((t) => t.id !== id));
  };
  const moveTechItem = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= selectedTech.length) return;
    const items = [...selectedTech];
    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;
    setSelectedTech(items);
  };

  const updateProject = (index: number, key: keyof Project, value: string) => setProjects((current) => current.map((project, projectIndex) => (projectIndex === index ? { ...project, [key]: value } : project)));
  const copyMarkdown = async () => { await navigator.clipboard.writeText(markdown); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  const downloadFile = (filename: string, content: string, type: string) => { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); };
  const downloadMarkdown = () => downloadFile(`${profile.handle || "profile"}-README.md`, markdown, "text/markdown;charset=utf-8");
  const downloadSvg = (filename: string, content: string) => downloadFile(filename, content, "image/svg+xml;charset=utf-8");

  const downloadBundle = async () => {
    setBundleStatus("creating");
    const zip = new JSZip();
    zip.file("README.md", markdown);
    const assetsFolder = zip.folder("assets");
    assetsFolder?.file("profile-hero.svg", svgFiles.hero);
    assetsFolder?.file("process-flow.svg", svgFiles.process);
    assetsFolder?.file("projects-showcase.svg", svgFiles.projects);
    assetsFolder?.file("community-footer.svg", svgFiles.community);
    if (components.techOrbit) assetsFolder?.file("tech-orbit.svg", svgFiles.techOrbit);
    if (components.terminal) assetsFolder?.file("animated-terminal.svg", svgFiles.terminal);
    if (components.pulseWave) assetsFolder?.file("pulse-wave.svg", svgFiles.pulseWave);

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.handle || "profile"}-readme-bundle.zip`;
    link.click();
    URL.revokeObjectURL(url);
    setBundleStatus("done");
    window.setTimeout(() => setBundleStatus("idle"), 2200);
  };

  const publishToGitHub = async () => {
    setPublishStatus("publishing");
    setPublishError("");
    const assets = [
      { path: "assets/profile-hero.svg", content: svgFiles.hero },
      { path: "assets/process-flow.svg", content: svgFiles.process },
      { path: "assets/projects-showcase.svg", content: svgFiles.projects },
      { path: "assets/community-footer.svg", content: svgFiles.community },
    ];
    if (components.techOrbit) assets.push({ path: "assets/tech-orbit.svg", content: svgFiles.techOrbit });
    if (components.terminal) assets.push({ path: "assets/animated-terminal.svg", content: svgFiles.terminal });
    if (components.pulseWave) assets.push({ path: "assets/pulse-wave.svg", content: svgFiles.pulseWave });

    const response = await fetch("/api/github/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown, assets }),
    });

    if (response.status === 401) { window.location.href = "/api/auth/github/start"; return; }
    if (!response.ok) { const payload = await response.json().catch(() => ({ error: "GitHub could not publish this profile." })); setPublishError(payload.error || "GitHub could not publish this profile."); }
    setPublishStatus(response.ok ? "success" : "error");
  };

  const loginWithGitHub = () => { window.location.href = "/api/auth/github/start"; };
  const logoutFromGitHub = async () => { await fetch("/api/auth/github/sign-out", { method: "POST" }); setAuthUser(null); setPublishStatus("idle"); };
  const useGitHubProfile = () => {
    if (!githubProfile) return;
    setProfile((current) => ({ ...current, name: githubProfile.name, handle: githubProfile.username, bio: githubProfile.bio || current.bio }));
    if (githubProfile.repositories.length) setProjects(githubProfile.repositories.slice(0, 3).map(({ name, description, tech }) => ({ name, description, tech })));
    setProfileSynced(true);
    window.setTimeout(() => setProfileSynced(false), 2200);
  };

  const saveDraft = () => {
    localStorage.setItem("readme-studio-draft", JSON.stringify({ profile, projects, components, svgSettings, showStats, showProjects, showContact, selectedTech, activeThemeId: activeTheme.id }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const reset = () => {
    setProfile(initialState);
    setProjects(starterProjects);
    setSvgSettings(themePresets[0].settings);
    setActiveTheme(themePresets[0]);
    setSelectedTech([techStackLibrary[0], techStackLibrary[1], techStackLibrary[11], techStackLibrary[12], techStackLibrary[19], techStackLibrary[27]]);
    setComponents({ typing: true, snake: true, divider: true, signals: true, projects: true, footer: true, techOrbit: true, terminal: true, pulseWave: false });
    setShowStats(true);
    setShowProjects(true);
    setShowContact(true);
    setSaved(false);
    setPreloadedContent(null);
  };

  return (
    <main className={`builder-shell ${darkPreview ? "dark-preview" : ""}`}>
      {/* Topbar */}
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">✳</span>
          <span>Readme studio</span>
        </div>
        <div className="topbar-meta">
          <span className="status-dot" /> {saved ? "Draft saved" : "Autosaved just now"}
          <button className="preload-trigger" onClick={() => setShowPreloadModal(true)}>
            📥 Import Live README
          </button>
          {authUser ? (
            <button className="auth-user" onClick={logoutFromGitHub} title="Sign out of GitHub">
              <img src={authUser.avatarUrl} alt="" /> @{authUser.login}
            </button>
          ) : (
            <button className="github-login" onClick={loginWithGitHub}>
              Log in with GitHub <span>↗</span>
            </button>
          )}
          <button className="avatar" onClick={saveDraft}>MO</button>
        </div>
      </header>

      {authError && <div className="notice error-notice">{authError}<button onClick={() => setAuthError("")} aria-label="Dismiss notice">×</button></div>}

      {/* Live README Preloader Drawer/Modal */}
      {showPreloadModal && (
        <div className="modal-backdrop" onClick={() => setShowPreloadModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import Live GitHub README</h3>
              <button className="modal-close" onClick={() => setShowPreloadModal(false)}>×</button>
            </div>
            <p className="modal-desc">Enter a GitHub handle to fetch their current live profile README directly into the studio editor.</p>
            <div className="modal-input-row">
              <span className="modal-prefix">@</span>
              <input
                type="text"
                placeholder="github-handle (e.g. icedmist)"
                value={preloadUsername}
                onChange={(e) => setPreloadUsername(e.target.value)}
              />
              <button onClick={fetchUserReadme} disabled={preloadStatus === "loading"}>
                {preloadStatus === "loading" ? "Fetching…" : "Preload README"}
              </button>
            </div>
            {preloadStatus === "success" && (
              <div className="notice success-notice">
                ✓ Live README preloaded successfully! Switch to the <strong>Markdown</strong> tab to view or edit.
              </div>
            )}
            {preloadStatus === "error" && <div className="notice error-notice">{preloadError}</div>}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="intro-row">
        <div>
          <p className="eyebrow">Personal identity, in markdown</p>
          <h1>Make a README<br /><em>that sounds like you.</em></h1>
        </div>
        <div className="intro-side">
          <p>Compose a living profile with interactive animated components, dynamic tech stack drag-and-drop, and ready-made themes.</p>
          {githubProfile && <button className="sync-profile" onClick={useGitHubProfile}>{profileSynced ? "Profile synced" : `Use @${githubProfile.username} profile`} <span>↗</span></button>}
          <div className="publish-panel">
            <strong>{authUser ? `Connected as @${authUser.login}` : "Publish to your profile"}</strong>
            <small>{authUser ? "Your README and SVG assets are ready." : "Log in with GitHub to add this README automatically."}</small>
            {authUser ? (
              <button onClick={publishToGitHub}>{publishStatus === "publishing" ? "Publishing…" : publishStatus === "success" ? "Published" : "Add to GitHub"} <span>↗</span></button>
            ) : (
              <button onClick={loginWithGitHub}>Log in with GitHub <span>↗</span></button>
            )}
          </div>
        </div>
      </section>

      {/* Ready-Made Templates Bar */}
      <section className="templates-bar-section">
        <div className="templates-bar-inner">
          <span className="templates-label">⚡ READY-MADE TEMPLATES:</span>
          <div className="templates-pills">
            {readyMadeTemplates.map((template) => (
              <button
                key={template.id}
                className={`template-pill ${activeTemplateId === template.id ? "active" : ""}`}
                onClick={() => applyTemplate(template)}
              >
                <span>{template.icon}</span>
                <strong>{template.name}</strong>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Workspace Main */}
      <div className="workspace-grid">
        <aside className="editor-panel">
          {/* Theme Switcher */}
          <div className="panel-heading">
            <div>
              <span className="section-number">01</span>
              <h2>Theme Switcher</h2>
            </div>
          </div>
          <div className="theme-switcher-grid">
            {themePresets.map((theme) => (
              <button
                key={theme.id}
                className={`theme-card ${activeTheme.id === theme.id ? "active" : ""}`}
                onClick={() => applyTheme(theme)}
              >
                <span className="theme-color-dot" style={{ backgroundColor: theme.previewColor }} />
                <span>{theme.name}</span>
              </button>
            ))}
          </div>

          <div className="panel-divider" />

          {/* Profile Signals */}
          <div className="panel-heading compact">
            <div>
              <span className="section-number">02</span>
              <h2>Your signal</h2>
            </div>
            <span className="edit-label">EDITING</span>
          </div>
          <Field label="Name" value={profile.name} onChange={(value) => setField("name", value)} />
          <Field label="GitHub handle" prefix="github.com/" value={profile.handle} onChange={(value) => setField("handle", value)} />
          <Field label="One-line headline" multiline value={profile.headline} onChange={(value) => setField("headline", value)} />
          <Field label="About you" multiline value={profile.bio} onChange={(value) => setField("bio", value)} />
          <Field label="Based in" value={profile.location} onChange={(value) => setField("location", value)} />

          <div className="panel-divider" />

          {/* Tech Stack Drag and Drop Editor */}
          <div className="panel-heading compact">
            <div>
              <span className="section-number">03</span>
              <h2>Tech Stack (Drag & Drop)</h2>
            </div>
          </div>
          <p className="panel-subtext">Drag items to reorder tech stack badges in your README.</p>
          
          <div className="tech-drag-container">
            {selectedTech.map((item, index) => (
              <div
                key={item.id}
                className={`tech-drag-item ${draggedTechIdx === index ? "dragging" : ""}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <span className="drag-handle">⋮⋮</span>
                <span className="tech-badge-dot" style={{ backgroundColor: `#${item.color}` }} />
                <span className="tech-item-name">{item.name}</span>
                <div className="tech-item-actions">
                  <button title="Move Up" onClick={() => moveTechItem(index, "up")}>↑</button>
                  <button title="Move Down" onClick={() => moveTechItem(index, "down")}>↓</button>
                  <button title="Remove" className="remove-btn" onClick={() => removeTechItem(item.id)}>×</button>
                </div>
              </div>
            ))}
          </div>

          <div className="tech-picker-wrapper">
            <small>ADD TECH BADGES:</small>
            <div className="tech-picker-chips">
              {techStackLibrary
                .filter((t) => !selectedTech.some((st) => st.id === t.id))
                .slice(0, 15)
                .map((item) => (
                  <button key={item.id} className="tech-chip" onClick={() => addTechItem(item)}>
                    + {item.name}
                  </button>
                ))}
            </div>
          </div>

          <div className="panel-divider" />

          {/* Animated Components Toggle */}
          <div className="panel-heading compact">
            <div>
              <span className="section-number">04</span>
              <h2>Animated SVG Components</h2>
            </div>
          </div>
          <ComponentToggle label="Interactive Tech Orbit" note="animated SVG orbit" active={components.techOrbit} onClick={() => toggleComponent("techOrbit")} />
          <ComponentToggle label="Cyberpunk Code Terminal" note="animated code stream" active={components.terminal} onClick={() => toggleComponent("terminal")} />
          <ComponentToggle label="Activity Pulse Line" note="dynamic equalizer SVG" active={components.pulseWave} onClick={() => toggleComponent("pulseWave")} />
          <ComponentToggle label="Typing introduction" note="animated SVG header" active={components.typing} onClick={() => toggleComponent("typing")} />
          <ComponentToggle label="Contribution snake" note="animated grid snake" active={components.snake} onClick={() => toggleComponent("snake")} />
          <ComponentToggle label="Motion divider" note="animated process line" active={components.divider} onClick={() => toggleComponent("divider")} />
          <ComponentToggle label="Live signals" note="generated SVG stats" active={components.signals} onClick={() => toggleComponent("signals")} />
          <ComponentToggle label="Project showcase" note="generated project cards" active={components.projects} onClick={() => toggleComponent("projects")} />
          <ComponentToggle label="Waving footer" note="animated wave SVG" active={components.footer} onClick={() => toggleComponent("footer")} />

          <div className="panel-divider small" />

          {/* SVG Customization */}
          <div className="panel-heading compact">
            <div>
              <span className="section-number">05</span>
              <h2>Customize SVG Labels</h2>
            </div>
          </div>
          <SvgTextField label="Hero label" value={svgSettings.heroLabel} onChange={(value) => setSvgField("heroLabel", value)} />
          <SvgTextField label="Process label" value={svgSettings.processLabel} onChange={(value) => setSvgField("processLabel", value)} />
          <SvgTextField label="Footer label" value={svgSettings.footerLabel} onChange={(value) => setSvgField("footerLabel", value)} />
          <SvgTextField label="Font Family" value={svgSettings.font} onChange={(value) => setSvgField("font", value)} />
          <div className="font-presets">
            <button onClick={() => setSvgField("font", "DM Mono")}>DM Mono</button>
            <button onClick={() => setSvgField("font", "Georgia")}>Georgia</button>
            <button onClick={() => setSvgField("font", "Verdana")}>Verdana</button>
          </div>
          <div className="color-row">
            <ColorField label="Accent" value={svgSettings.accent} onChange={(value) => setSvgField("accent", value)} />
            <ColorField label="Ink" value={svgSettings.ink} onChange={(value) => setSvgField("ink", value)} />
            <ColorField label="Soft" value={svgSettings.soft} onChange={(value) => setSvgField("soft", value)} />
          </div>
          <div className="svg-downloads">
            <button onClick={() => downloadSvg("profile-hero.svg", svgFiles.hero)}>Hero ↓</button>
            <button onClick={() => downloadSvg("tech-orbit.svg", svgFiles.techOrbit)}>Orbit ↓</button>
            <button onClick={() => downloadSvg("animated-terminal.svg", svgFiles.terminal)}>Terminal ↓</button>
            <button onClick={() => downloadSvg("process-flow.svg", svgFiles.process)}>Process ↓</button>
            <button onClick={() => downloadSvg("projects-showcase.svg", svgFiles.projects)}>Projects ↓</button>
            <button onClick={() => downloadSvg("community-footer.svg", svgFiles.community)}>Footer ↓</button>
          </div>

          <div className="panel-divider small" />

          {/* Featured Work Editor */}
          <div className="panel-heading compact">
            <div>
              <span className="section-number">06</span>
              <h2>Featured Work</h2>
            </div>
            <button className="add-button" onClick={() => setProjects([...projects, { name: "new-project", description: "What does it do?", tech: "Your stack" }])}>+</button>
          </div>
          {projects.map((project, index) => (
            <div className="project-edit" key={`${project.name}-${index}`}>
              <input aria-label={`Project ${index + 1} name`} value={project.name} onChange={(event) => updateProject(index, "name", event.target.value)} />
              <textarea aria-label={`Project ${index + 1} description`} rows={2} value={project.description} onChange={(event) => updateProject(index, "description", event.target.value)} />
              <input aria-label={`Project ${index + 1} technology`} value={project.tech} onChange={(event) => updateProject(index, "tech", event.target.value)} />
            </div>
          ))}

          <div className="panel-divider small" />

          {/* Single-card studio lives on its own page now */}
          <div className="panel-heading compact">
            <div>
              <span className="section-number">07</span>
              <h2>Single-Card Mode</h2>
            </div>
          </div>
          <p className="panel-subtext">One SVG as your whole README — name + waving character, fully customizable.</p>
          <a href="/card" style={{ display: "block", border: "1px solid var(--ink)", background: "var(--cream)", padding: 13, textDecoration: "none", color: "inherit" }}>
            <strong style={{ display: "block", fontSize: 12 }}>Open the single-card studio <span style={{ color: "var(--orange)" }}>↗</span></strong>
            <small style={{ display: "block", color: "#7e8980", fontFamily: "'DM Mono', monospace", fontSize: 9, marginTop: 5 }}>12 personas · onboarding · auto-import · /card</small>
          </a>

          <div className="editor-actions">
            <button className="text-button" onClick={reset}>Reset</button>
            <button className="save-button" onClick={saveDraft}>{saved ? "Saved" : "Save draft"} <span>↗</span></button>
          </div>
        </aside>

        {/* Live Preview Panel */}
        <section className="preview-panel">
          <div className="preview-toolbar">
            <div className="window-dots"><span /><span /><span /></div>
            <div className="mode-tabs">
              <button className={mode === "studio" ? "selected" : ""} onClick={() => setMode("studio")}>Studio</button>
              <button className={mode === "github" ? "selected" : ""} onClick={() => setMode("github")}>GitHub</button>
              <button className={mode === "source" ? "selected" : ""} onClick={() => setMode("source")}>Markdown</button>
            </div>
            <div className="toolbar-actions">
              <button title="Toggle preview theme" onClick={() => setDarkPreview(!darkPreview)}>◐</button>
              <button title="Download README" onClick={downloadMarkdown}>↓</button>
              <button title="Copy Markdown" onClick={copyMarkdown}>{copied ? "✓" : "↗"}</button>
            </div>
          </div>

          {(mode === "studio" || mode === "github") && (
            <GithubPreview mode={mode} githubStatus={githubStatus} githubProfile={githubProfile} svgFiles={svgFiles} markdown={markdown} />
          )}

          {mode === "source" && (
            <pre className="source-view"><code>{markdown}</code></pre>
          )}

          {publishError && <div className="notice publish-notice">{publishError}</div>}

          <div className="preview-footer">
            <span>{mode === "github" ? "GitHub Flavored Markdown · animated media preserved" : "Generated from your profile data"}</span>
            <div>
              <button className="publish-button" onClick={publishToGitHub}>{publishStatus === "publishing" ? "Publishing…" : publishStatus === "success" ? "Published" : "Add to GitHub"} <span>↗</span></button>
              <button onClick={copyMarkdown}>{copied ? "Copied" : "Copy Markdown"} <span>↗</span></button>
              <button onClick={downloadMarkdown}>README <span>↓</span></button>
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
        <textarea rows={label === "About you" ? 3 : 2} value={value} onChange={(event) => onChange(event.target.value)} />
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

function resolveAsset(src: string | Blob | undefined, svgFiles: { hero: string; process: string; signals: string; projects: string; community: string; techOrbit: string; terminal: string; pulseWave: string }) {
  if (src === "./assets/profile-hero.svg") return svgData(svgFiles.hero);
  if (src === "./assets/process-flow.svg") return svgData(svgFiles.process);
  if (src === "./assets/github-signals.svg") return svgData(svgFiles.signals);
  if (src === "./assets/projects-showcase.svg") return svgData(svgFiles.projects);
  if (src === "./assets/community-footer.svg") return svgData(svgFiles.community);
  if (src === "./assets/tech-orbit.svg") return svgData(svgFiles.techOrbit);
  if (src === "./assets/animated-terminal.svg") return svgData(svgFiles.terminal);
  if (src === "./assets/pulse-wave.svg") return svgData(svgFiles.pulseWave);
  return src;
}

function GithubPreview({ mode, githubStatus, githubProfile, svgFiles, markdown }: { mode: Mode; githubStatus: "idle" | "loading" | "ready" | "error"; githubProfile: GithubProfile | null; svgFiles: { hero: string; process: string; signals: string; projects: string; community: string; techOrbit: string; terminal: string; pulseWave: string }; markdown: string }) {
  return (
    <div className="github-frame">
      <div className="github-label">
        {mode === "studio" ? "Studio · exact GitHub render" : "GitHub-compatible render"} <span>●</span>
        <small>{githubStatus === "loading" ? "Refreshing GitHub data…" : githubStatus === "ready" ? `Live data from @${githubProfile?.username}` : "Connect a public GitHub username"}</small>
      </div>
      <div className="github-markdown">
        <Markdown remarkPlugins={[remarkGfm]} components={{ img: ({ src, alt, ...props }) => <img {...props} src={resolveAsset(src, svgFiles)} alt={alt || "README visual"} /> }}>
          {markdown}
        </Markdown>
      </div>
    </div>
  );
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
