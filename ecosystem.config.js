module.exports = {
  apps: [
    {
      name: 'cost-management-ui',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000, // Replace with your desired port
      },
    },
  ],
};
