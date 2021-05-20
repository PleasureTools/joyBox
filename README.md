# JoyBox
## Features
+ Stream recording
+ Built-in player
+ Push notifications
+ Web interface
## Providers
+ bongacams
+ chaturbate
+ camsoda
## How to run
`docker build -t joybox .`

`docker run --name joybox --rm -d -p 8080:80 -p 8081:443 -v $(pwd):/app/data joybox`

Open `http://host:8080` or `https://host:8081`

## Installation on Raspberry Pi's
Due to a bug in Alpine 3.13 you need to use Alpine 3.12 - Replace 'node:current-alpine' with 'alpine:3.12' line 1 and 38 in the Dockerfile;
This bug is mentioned here: https://github.com/alpinelinux/docker-alpine/issues/135

## Settings
All files should be in the mounted folder
### SSL

`server.cer` & `server.key`

### Push notifications

`vapid.json`
```json
{
    "subject": "mailto:service@example.com",
    "privateKey": "",
    "publicKey": ""
}
```
