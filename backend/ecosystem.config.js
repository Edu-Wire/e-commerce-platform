module.exports = {
  apps: [
    {
      name: 'ecom-backend',
      script: 'dist/index.js',
      cwd: '/home/ubuntu/e-commerce-platform/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      // Production env vars are read from the .env file on the server.
      // Secrets must NOT be stored here — set them in /home/ubuntu/e-commerce-platform/backend/.env
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
