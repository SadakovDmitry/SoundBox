module.exports = {
  apps: [
    {
      name: 'soundbox',
      script: 'server.js',
      cwd: '/var/www/soundbox',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        JWT_SECRET: 'replace-with-long-random-secret',
        DB_PATH: '/var/www/soundbox/data/cabins.db',
        UPLOADS_DIR: '/var/www/soundbox/data/uploads',
      },
    },
  ],
};
