const express = require("express");
const cors = require("cors");

const app = express();

// ----- Middleware -----
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Simple request logging for stability and observability
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${
        res.statusCode
      } (${duration}ms)`
    );
  });
  next();
});

// ----- Health & root routes -----

// Render / uptime / health check
app.get("/", (req, res) => {
  res.status(200).send("Codex Root v0.7 is running");
});

// Optional explicit health endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "codex-root",
    version: "0.7.0",
    timestamp: new Date().toISOString()
  });
});

const createRadarResponse = (input) => {
  const now = new Date().toISOString();

  return {
    meta: {
      service: "codex-root",
      module: "invention-radar",
      version: "0.7.0",
      timestamp: now
    },
    input: {
      raw: input,
      length: input.length
    },
    analysis: {
      noveltyScore: 0.72, // placeholder
      riskFlags: [],
      industryTags: ["UNCLASSIFIED"], // placeholder
      confidence: 0.65 // placeholder
    },
    proceduralBrief: {
      summary:
        "This is a v0.7 placeholder procedural brief. The full Invention Radar pipeline will enrich this with legal, technical, and strategic guidance.",
      recommendedNextSteps: [
        "Clarify the core inventive concept in one sentence.",
        "Identify prior art or similar systems you are aware of.",
        "Decide whether this is patent, trade secret, or publication oriented.",
        "Run a deeper Invention Radar pass once the full pipeline is online."
      ]
    }
  };
};

const handleRadar = (req, res) => {
  try {
    const { input } = req.body || {};
    const trimmedInput = typeof input === "string" ? input.trim() : "";

    if (trimmedInput.length === 0) {
      return res.status(400).json({
        error: "Missing or invalid 'input'. Expected a non-empty string."
      });
    }

    return res.status(200).json(createRadarResponse(trimmedInput));
  } catch (err) {
    console.error("Error in /radar:", err);
    return res.status(500).json({
      error: "Internal server error in Invention Radar module."
    });
  }
};

// ----- Core Invention Radar stub (safe, stable, extendable) -----
app.post("/radar", handleRadar);

// Backwards-compatible root POST for legacy clients.
// Canonical entrypoint remains POST /radar and this alias can be removed once clients migrate.
app.post("/", handleRadar);

app.use((req, res) => {
  return res.status(404).json({ error: "Route not found." });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // Handles malformed JSON payloads raised by express.json middleware.
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ error: "Invalid JSON payload." });
  }

  console.error("Unhandled server error:", err);
  return res.status(500).json({ error: "Internal server error." });
});

// ----- Server bootstrap -----
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Codex Root v0.7 running on port ${PORT}`);
});
