'use strict';

module.exports = {
  apps: [
    {
      name: 'main.js',
      script: '~/rush-room/dist/src/',
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
