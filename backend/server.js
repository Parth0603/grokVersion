const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { execFile } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

// Allow all origins for testing
app.use(cors({ origin: true }));

app.use(bodyParser.json());

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

app.post("/api/download", (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "URL is required" });
  if (!isValidUrl(url)) return res.status(400).json({ error: "Invalid URL" });

  // Common yt-dlp arguments
  const args = [
    "-g", // Get direct URL
    "--no-cookies", // Disable cookie handling
    "--user-agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "--retry-sleep",
    "5", // Wait 5 seconds between retries
    "--force-ipv4", // Avoid IPv6 issues
    url,
  ];

  execFile("yt-dlp", args, { timeout: 30000 }, (err, stdout, stderr) => {
    if (err) {
      console.error("yt-dlp error:", stderr || err.message);
      if (stderr.includes("429")) {
        return res.status(429).json({ error: "Rate limit reached, please try again later" });
      }
      if (stderr.includes("Sign in")) {
        return res.status(403).json({ error: "Authentication required for this video, try a different URL" });
      }
      return res.status(500).json({
        error: "Failed to fetch download link",
        details: stderr || err.message,
      });
    }

    const downloadUrl = stdout.trim();
    if (!downloadUrl || !downloadUrl.startsWith("http")) {
      return res.status(500).json({ error: "No valid download URL found" });
    }

    res.json({ downloadUrl });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});