module.exports = {
    apps: [
        {
            name: 'api.help-me-nigeria.production',
            script: './dist/server.js',
            cwd: '/var/www/help-me-nigeria-backend',
            instances: 1,
            exec_mode: 'fork',

            env: {
                NODE_ENV: 'production',
                PORT: 4000
            },

            error_file: '/var/log/apps/backend/prod-err.log',
            out_file: '/var/log/apps/backend/prod-out.log',
            log_file: '/var/log/apps/backend/prod-combined.log',

            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

            watch: false,
            ignore_watch: ['node_modules', 'logs', '.git'],

            max_memory_restart: '1G',

            restart_delay: 4000,
            max_restarts: 10,
            min_uptime: '10s',

            kill_timeout: 5000,
            // wait_ready: true,
            // listen_timeout: 8000,

            merge_logs: true,

            instance_var: 'INSTANCE_ID',

            shutdown_with_message: true
        },

        {
            name: 'api.help-me-nigeria.staging',
            script: './dist/server.js',
            cwd: '/var/www/help-me-nigeria-backend-staging',
            instances: 1,
            exec_mode: 'fork',

            env: {
                NODE_ENV: 'development',
                PORT: 4001
            },

            error_file: '/var/log/apps/backend/staging-err.log',
            out_file: '/var/log/apps/backend/staging-out.log',
            log_file: '/var/log/apps/backend/staging-combined.log',

            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

            watch: false,
            ignore_watch: ['node_modules', 'logs', '.git'],

            max_memory_restart: '1G',

            restart_delay: 4000,
            max_restarts: 10,
            min_uptime: '10s',

            kill_timeout: 5000,
            // wait_ready: true,
            // listen_timeout: 8000,

            merge_logs: true,

            instance_var: 'INSTANCE_ID',

            shutdown_with_message: true
        }
    ]
};
