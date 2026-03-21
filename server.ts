import express from "express";
import { createServer as createViteServer } from "vite";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import cookieSession from "cookie-session";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Session configuration for iframe context
  app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'sapphic-shelves-secret'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,      // Required for SameSite=None
    sameSite: 'none',  // Required for cross-origin iframe
    httpOnly: true,
  }));

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running on port 3000" });
  });

  // GitHub OAuth: Get Auth URL
  app.get("/api/auth/github/url", (req, res) => {
    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/github/callback`;
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || '',
      redirect_uri: redirectUri,
      scope: 'user repo', // Request user and repo access
    });
    const authUrl = `https://github.com/login/oauth/authorize?${params}`;
    res.json({ url: authUrl });
  });

  // GitHub OAuth: Callback
  app.get("/auth/github/callback", async (req: any, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("Missing code");

    try {
      // Exchange code for token
      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }, {
        headers: { Accept: 'application/json' }
      });

      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) throw new Error("No access token received");

      // Get user info
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `token ${accessToken}` }
      });

      // Store in session
      if (req.session) {
        req.session.githubToken = accessToken;
        req.session.githubUser = userResponse.data;
      }

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'github' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("GitHub OAuth error:", error.response?.data || error.message);
      res.status(500).send("Authentication failed");
    }
  });

  // API Route: Get GitHub User
  app.get("/api/auth/github/user", (req: any, res) => {
    if (req.session && req.session.githubUser) {
      res.json({ user: req.session.githubUser });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // API Route: Logout
  app.post("/api/auth/github/logout", (req: any, res) => {
    if (req.session) {
      req.session = null;
    }
    res.json({ success: true });
  });

  // API Route: Sync to GitHub (Gist)
  app.post("/api/auth/github/sync", async (req: any, res) => {
    if (!req.session || !req.session.githubToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { data } = req.body;
    try {
      // Create or update a gist named 'sapphic-shelves-backup.json'
      const response = await axios.post('https://api.github.com/gists', {
        description: 'Sapphic Shelves Library Backup',
        public: false,
        files: {
          'sapphic-shelves-backup.json': {
            content: JSON.stringify(data, null, 2)
          }
        }
      }, {
        headers: { Authorization: `token ${req.session.githubToken}` }
      });

      res.json({ success: true, url: response.data.html_url });
    } catch (error: any) {
      console.error("GitHub Sync error:", error.response?.data || error.message);
      res.status(500).json({ error: "Sync failed" });
    }
  });

  // API Route: Execute Python Logic
  app.post("/api/process", (req, res) => {
    const { data } = req.body;
    
    // Process Integration: Calling Python via child_process
    const pythonProcess = spawn("python3", [path.join(__dirname, "logic.py"), JSON.stringify(data || {})]);

    let result = "";
    let error = "";

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`Python script failed with code ${code}: ${error}`);
        return res.status(500).json({ error: "Internal Server Error", details: error });
      }
      try {
        const jsonResponse = JSON.parse(result);
        res.json(jsonResponse);
      } catch (e) {
        console.error("Failed to parse Python output:", result);
        res.status(500).json({ error: "Invalid JSON from Python script", output: result });
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
