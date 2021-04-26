# mordBot
A Mordhau RCON bot

# Setup

### Clone the repo:
```$ git clone https://github.com/AugustoEMoreira/mordBot.git```

### Install the dependencies:
```$ npm install```

### Create the config.json file:
```json
{
  "server":{
    "ip":"127.0.0.1",
    "port": 7770,
    "password": "xxxxxxxxxxxxxxx"
  },
  "discord":{
    "token": "ODM2Mxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "channelId": "651498xxxxxxxxxxxxxxxxxxxxxxxxxx",
    "moderatorsRoleId": "6840045xxxxxxxxxx"
  }
}
```
### Run the first run script:
```$ node firstrun.js```

# start the bot
```node index.js```
