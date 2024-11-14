'use strict';

module.exports = {
  apps: [
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
