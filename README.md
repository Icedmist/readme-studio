 # Readme studio

 An editable GitHub Profile README builder with live GitHub data, GitHub Flavored Markdown preview, generated animated SVG assets, and optional one-click publishing.

 ## Run locally

 ```bash
 npm install
 npm run dev
 ```

 Open http://localhost:3000.

 ## GitHub data

 Enter a public GitHub username in the editor. The app fetches public profile data through `/api/github/profile` and uses the repository count, contribution total, followers, following, avatar, and profile URL in the preview and generated Markdown.

 ## Publish to GitHub

 Copy `.env.example` to `.env.local`, create a GitHub OAuth App at https://github.com/settings/developers, and set:

 ```bash
APP_URL=https://icedmist.tech
 GITHUB_CLIENT_ID=your-client-id
 GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_REDIRECT_URI=https://icedmist.tech/api/auth/github/callback
 ```

In the GitHub OAuth App settings use:

- Homepage URL: `https://icedmist.tech`
- Authorization callback URL: `https://icedmist.tech/api/auth/github/callback`

The runtime authorization URL is generated as `https://github.com/login/oauth/authorize` with your client ID, the callback URL, a CSRF state value, and the `public_repo` scope. The **Add to GitHub** action uses OAuth, creates the user profile repository when needed, and publishes `README.md` plus the generated SVG files under `assets/`. Do not commit `.env.local` or OAuth secrets.

 ## SVG assets

 The Studio generates editable SVGs for the hero, process diagram, project showcase, and footer. The downloaded README expects:

 ```text
 README.md
 assets/
	 profile-hero.svg
	 process-flow.svg
	 projects-showcase.svg
	 community-footer.svg
 ```

Use **ZIP bundle** in the preview footer to download this complete structure in one file.

 ## Validate

 ```bash
 npm run build
 ```
