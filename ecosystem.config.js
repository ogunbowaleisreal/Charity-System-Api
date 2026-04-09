// module.exports = {
//     apps: [
//         {
//             name: "floathr-api",
//             script: "dist/server.js",
//             cwd: "/var/www/floathr-backend",

//             exec_mode: "fork",
//             instances: 1,

//             env: {
//                 NODE_ENV: "production",
//                 PORT: 3000
//             }
//         }
//     ]
// };


module.exports = {
    apps: [
        {
            name: "floathr-api",
            script: "dist/server.js",
            cwd: "/var/www/floathr-backend",
            instances: 1,
            exec_mode: "fork",
            env: {
                NODE_ENV: "production",
                PORT: 3000
            }
        },
        {
            name: "floathr-api-staging",
            script: "dist/server.js",
            cwd: "/var/www/floathr-backend-staging",
            instances: 1,
            exec_mode: "fork",
            env: {
                NODE_ENV: "staging",
                PORT: 5000
            }
        }
    ]
};
