'use strict';

module.exports = {
  apps: [
    {
      name: 'rush room bid',
      script: '~/rush-room/dist/src/main.js',
      env: {
        NODE_ENV: 'development',
        MODE: 'GAME',
      },
      env_production: {
        NODE_ENV: 'production',
        MODE: 'GAME',
      },
    },
  ],
};
