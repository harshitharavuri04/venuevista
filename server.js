const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 10000;

// Start backend services
const startBackendService = (servicePath, port) => {
  console.log(`Starting ${servicePath} on port ${port}`);
  const service = spawn("npm", ["start"], {
    cwd: path.join(__dirname, servicePath),
    stdio: "inherit",
    env: { ...process.env, PORT: port },
  });

  service.on("error", (err) => {
    console.error(`Error starting ${servicePath}:`, err);
  });

  return service;
};

// Start all backend services
const services = [
  startBackendService("user_management_backend", "5000"),
  startBackendService("booking_management_backend", "3003"),
  startBackendService("venue_management_backend", "3001"),
];

// Proxy API requests to respective backend services
app.use(
  "/api/users",
  createProxyMiddleware({
    target: "http://localhost:5000",
    changeOrigin: true,
  })
);

app.use(
  "/api/bookings",
  createProxyMiddleware({
    target: "http://localhost:3003",
    changeOrigin: true,
  })
);

app.use(
  "/api/venues",
  createProxyMiddleware({
    target: "http://localhost:3001",
    changeOrigin: true,
  })
);

// Serve React frontend
app.use(
  express.static(
    path.join(__dirname, "user_management_frontend/venue-vista-frontend/build")
  )
);

// Handle React routing
app.get("*", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "user_management_frontend/venue-vista-frontend/build",
      "index.html"
    )
  );
});

app.listen(PORT, () => {
  console.log(`Unified server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  services.forEach((service) => service.kill());
  process.exit(0);
});
