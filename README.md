# JoyBox
## Features
+ Stream recording
+ Built-in player
+ Push notifications
+ Web interface
## Providers
+ bongacams
+ chaturbate
## How to run
`docker build -t joybox .`

`docker run --name joybox --rm --network home_lan --ip 192.168.0.2 -d -v $(pwd):/app/data joybox`
