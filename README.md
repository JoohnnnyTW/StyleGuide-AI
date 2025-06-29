# StyleGuide AI Application

StyleGuide AI is a React-based web application designed for interior design ideation and image generation. It leverages AI models like Google Gemini (for text, suggestions, and Imagen 3 image generation) and Flux Kontext Max (for image generation) to provide users with a powerful tool for visualizing and refining design concepts.

## Features

-   **Multiple AI Modes:**
    -   **靈感 (Inspiration):** Get AI-powered style suggestions based on a source image, maintaining structural fidelity.
    -   **參考 (Reference / Generate Image):** Generate images from text prompts, optionally using a source image for structure or style transfer.
    -   **相機 (Camera):** Capture images using the device camera for use as source images.
    -   **編輯 (Edit):** Get AI suggestions for editing an existing image and generate variations.
    -   **加入 (Add Element):** Get AI suggestions for adding new elements (from reference images with tags) into a source image.
-   **Secure API Key Management:**
    -   **Flux Kontext Max:** API key is managed securely on the server-side via a Netlify proxy function. It is **not** exposed to the client.
    -   **Google Gemini:** API key is loaded from a build-time environment variable, keeping it out of source control.
-   **Image Generation Engine Configuration:**
    -   Choose between **Flux Kontext Max** (via secure proxy) and **Imagen 3 (via Gemini API)**.
    -   Configure specific parameters for each engine (output format, upsampling, safety tolerance for Flux).
-   **Dynamic UI:**
    -   Animated tabs for different AI modes.
    -   Interactive modals for settings, project history, login, and reports.
    -   Image comparison slider for before/after views.
    -   Floating slider for real-time adjustment of Flux safety tolerance.
-   **Project Management:** Organize generated images into projects, persisted in `localStorage`.
-   **AI-Powered Tagging & Suggestions:**
    -   OCR-based AI tagging for images in "參考" mode.
    -   Contextual AI suggestions for prompts based on the active mode and uploaded images.
-   **Design Reports:** Generate AI-powered design concepts and modification suggestions for generated images.
-   **Responsive Design & Dark Mode:** Adapts to various screen sizes and user theme preferences.
-   **Local State Persistence:** User preferences (theme, engine settings), projects, and current project ID are saved to `localStorage`.

## Tech Stack

-   **Frontend:** React, TypeScript, Vite
-   **Styling:** Tailwind CSS
-   **AI Integration:**
    -   `@google/genai` for Gemini API (text, Imagen 3)
    -   Flux Kontext Max API (proxied via Netlify Function)
-   **Deployment & Serverless:** Netlify (build, hosting, serverless functions)

## Project Structure

```
/
├── netlify/
│   └── functions/
│       └── flux-proxy.ts       # Netlify serverless function for Flux API
├── public/                     # Static assets (favicons, etc.)
├── src/
│   ├── components/
│   │   ├── ui/                   # UI components
│   │   └── ...
│   ├── App.tsx                   # Main application component
│   ├── main.tsx                  # React entry point
│   └── vite-env.d.ts             # Vite environment variable typings
├── .eslintrc.cjs                 # ESLint configuration
├── index.html                    # Main HTML file for Vite
├── netlify.toml                  # Netlify deployment/dev configuration
├── package.json                  # Project dependencies and scripts
├── README.md                     # This file
├── tsconfig.json                 # Main TypeScript configuration
├── tsconfig.node.json            # TypeScript configuration for Node.js context (Vite, Netlify functions)
└── vite.config.ts                # Vite build tool configuration
```

## Netlify Configuration (`netlify.toml`)

This project includes a `netlify.toml` file to ensure correct deployment and behavior on Netlify. It handles three critical tasks:

1.  **Build Configuration:** It tells Netlify how to build the site (`npm run build`) and which folder to deploy (`dist`).
2.  **Function Directory:** It specifies where the serverless functions are located (`netlify/functions`).
3.  **Redirects & Rewrites:**
    -   **API Proxy:** It creates a server-side proxy that rewrites requests from `/api/*` to the corresponding Netlify Function in `/.netlify/functions/*`. This allows the frontend to call the Flux API without exposing secret keys, as the `flux-proxy.ts` function adds the key on the server.
    -   **SPA Fallback:** It ensures that any direct navigation to a non-root URL (e.g., `yourapp.com/some-page`) correctly serves the `index.html` file, allowing the React application to handle its own routing. This is the standard fix for the "white screen" issue on subpages of SPAs.

Here is the content of `netlify.toml`:
```toml
# Netlify Build & Redirect Configuration
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

# Proxy rule to route API requests to the Netlify Function.
# This works for both local development (`netlify dev`) and production.
# The client-side code calls a relative path like `/api/flux-proxy`,
# and Netlify routes it to the actual function endpoint.
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200 

# Single Page Application (SPA) fallback rule.
# This ensures that any direct navigation to a path like /about
# serves the index.html, allowing the React router to handle it.
# This must be the last rule in the file.
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```


## Setup and Development

### Prerequisites

-   Node.js (v18 or newer recommended)
-   npm or yarn
-   Netlify CLI (for local proxy testing): `npm install -g netlify-cli`

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd styleguide-ai-app
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    # yarn install
    ```

### Environment Variables

For **local development**, create a `.env` file in the root of your project:

```env
# .env

# For Gemini API (Imagen 3, text generation, suggestions)
# This is loaded by vite.config.ts and exposed to client-side code as process.env.API_KEY.
VITE_GEMINI_API_KEY="your_actual_gemini_api_key"

# For Flux API (used by the local Netlify Dev proxy for the flux-proxy function)
# This is a runtime variable for the local serverless function emulator (netlify dev)
FLUX_API_KEY="your_actual_flux_api_key"
```

-   `VITE_GEMINI_API_KEY`: Your API key for Google Gemini. `vite.config.ts` is configured to load this variable and make it available as `process.env.API_KEY` throughout the app.
-   `FLUX_API_KEY`: Your API key for Flux Kontext Max. This is used by the `netlify dev` environment to simulate the Netlify function proxy.

**Important:** Never commit your `.env` file to Git. Ensure `.env` is listed in your `.gitignore` file.

### Running Locally (Recommended: With Netlify Dev)

To run the application locally with Vite's development server and Netlify's local development environment (which includes the Flux API proxy function):

1.  **Ensure Netlify CLI is installed:**
    ```bash
    npm install -g netlify-cli
    ```
2.  **Log in to Netlify (optional but good practice if linking to a Netlify site):**
    ```bash
    netlify login
    ```
3.  **Run Netlify Dev:**
    This command starts the Vite dev server and the Netlify functions emulator, using your `netlify.toml` for configuration.
    ```bash
    npm run dev
    ```
    The application should be accessible at `http://localhost:8888` (or another port if 8888 is busy). Requests from the client to `/api/flux-proxy` will be routed by Netlify Dev to your local `flux-proxy.ts` function, which will use the `FLUX_API_KEY` from your `.env` file.

## Building for Production

To build the application for production:

```bash
npm run build
```
This command will build the React application using Vite, bundling assets into the `dist/` directory.

## Deployment to Netlify

This project is configured for streamlined deployment to Netlify.

#### 1. Push to GitHub (or your preferred Git provider)

-   Ensure your project is a Git repository.
-   Commit all your code, including the `netlify.toml` and the `netlify/functions` directory.
-   Push it to your Git provider.

#### 2. Connect to Netlify

1.  Log in to your Netlify account.
2.  Click on "Add new site" -> "Import an existing project".
3.  Connect to your Git provider and select your project's repository.

#### 3. Configure Build Settings

Netlify will automatically detect the settings from your `netlify.toml` file (`build` command, `publish` directory, and `functions` directory). You should not need to configure this manually in the UI.

#### 4. Configure Environment Variables in Netlify UI (Crucial)

In your Netlify site dashboard, go to "Site configuration" -> "Build & deploy" -> "Environment" -> "Environment variables". Click "Add a variable" or "Edit variables" and add:

-   **For Gemini API (Client-side build variable):**
    -   **Key:** `VITE_GEMINI_API_KEY`
    -   **Value:** Your_Actual_Google_Gemini_API_Key
    -   **Scope:** Set this to be available to "Builds". This key is embedded during the build process.

-   **For Flux API Proxy (Server-side runtime variable for the function):**
    -   **Key:** `FLUX_API_KEY`
    -   **Value:** Your_Actual_Flux_Kontext_Max_API_Key
    -   **Scope:** Set this to be available to "Functions" or "Runtime (includes Functions)". This key is used by your `flux-proxy.ts` Netlify function and is NOT exposed to the client.

#### 5. Deploy

-   Deployments are usually triggered automatically when you push to your connected Git branch (e.g., `main`).
-   After setting or changing environment variables, a **new deploy is required** for them to take effect.

## Linting

To run ESLint for code quality checks:
```bash
npm run lint
```

---

Happy designing with StyleGuide AI!