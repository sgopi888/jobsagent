module.exports = {
  apps: [
    {
      name: "applyswift-ui",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/opt/applyswift-ui",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "300M",
      instances: 1,
      autorestart: true,
      watch: false,
    },
  ],
};
