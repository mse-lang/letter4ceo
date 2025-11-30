module.exports = {
  apps: [
    {
      name: 'morning-letter-frontend',
      script: 'npx',
      args: 'next start -p 3000 -H 0.0.0.0',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
