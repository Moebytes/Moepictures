module.exports = {
    apps: [
      {
        name: "moepictures",
        script: "dist/server/server.js",
        autorestart: true,
        max_memory_restart: "8G",
        node_args: "--max-old-space-size=8192 --optimize-for-size",
        env_production: {
          NODE_ENV: "production"
        }
      }
    ]
}