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
+ kick.com (category clips only)
## How to run

### Alpine
```
docker build -t joybox .
```

```
docker run --name joybox --rm -d -p 8080:80 -p 8081:443 -v $(pwd):/app/data joybox
```


### Ubuntu with CUDA

```
docker build -t joybox-cuda -f Dockerfile.cuda .
```

```
docker run --name joybox --rm -d -e REENCODING_MODE=hardware -e NVIDIA_DRIVER_CAPABILITIES=all --gpus=all -p 8080:80 -p 8081:443 -v $(pwd):/app/data joybox-cuda
```

<br>

Open `http://host:8080` or `https://host:8081`

## Installation on Raspberry Pi's
Due to a bug in Alpine 3.13 you need to use Alpine 3.12 - Replace 'node:current-alpine' with 'alpine:3.12' line 1 and 38 in the Dockerfile;
This bug is mentioned here: https://github.com/alpinelinux/docker-alpine/issues/135

## Kick.com

kick.com only works in tandem with Selenium

## Selenium

```
docker run -d -p 4444:4444 -p 7900:7900 --shm-size="2g" selenium/standalone-firefox:4.11.0-20230801
```

Set remote selenium url to

```
http://[container_host]:4444/wd/hub
```

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