module.exports = {
  apps: [
    {
      name: 'rush room bid',
      script: '~/rush-room/dist/src/main.js',
      env: {
        NODE_ENV: 'development',
        MODE: 'BID',
      },
      env_production: {
        NODE_ENV: 'production',
        MODE: 'BID',
      },
    },
    {
      name: 'rush room media',
      script: '~/rush-room/dist/src/main.js',
      env: {
        NODE_ENV: 'development',
        MODE: 'MEDIA',
      },
      env_production: {
        NODE_ENV: 'production',
        MODE: 'MEDIA',
      },
    },
    {
      name: 'rush room was',
      script: '~/rush-room/dist/src/main.js',
      env: {
        NODE_ENV: 'development',
        MODE: 'WAS',
      },
      env_production: {
        NODE_ENV: 'production',
        MODE: 'WAS',
      },
    },
  ],
};
