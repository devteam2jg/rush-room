'use strict';

module.exports = {
  apps: [
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
  ],
};
