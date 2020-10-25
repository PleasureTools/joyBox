`npm run serve`

`launch.json`
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Backend",
            "runtimeArgs": [
                "-r",
                "ts-node/register",
                "-r",
                "tsconfig-paths/register"
            ],
            "args": [
                "${workspaceFolder}/backend/Src/main.ts"
            ],
            "env": {
                "env": "dev",
                "default-access": "FULL_ACCESS",
                "passphrase": "12345",
                "hostname": "dev.lan",
                "TS_NODE_PROJECT": "backend/tsconfig.json",
                "PORT": "3000"
            }
        },
        {
            "type": "chrome",
            "request": "launch",
            "name": "Frontend",
            "url": "https://dev.lan:8080",
            "webRoot": "${workspaceFolder}/src",
            "breakOnLoad": true,
            "sourceMapPathOverrides": {
                "webpack:///./src/*": "${webRoot}/*",
                "webpack:///src/*": "${webRoot}/*",
                "webpack:///*": "*",
                "webpack:///./~/*": "${webRoot}/node_modules/*"
            }
        }
    ]
}
```