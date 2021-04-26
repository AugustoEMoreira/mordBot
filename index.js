const Rcon = require('./rcon')
const database = require('./database')
const Discord = require('discord.js')
const config = require('./config')
const client = new Discord.Client();

let conn = new Rcon(config.server.ip, config.server.port, config.server.password);


conn.on('auth', () => {
    console.log('connectado')
    conn.send('listen allon')
    alive()
}).on('response', str => {
    if (!str.startsWith('Keeping client alive for another')) {
        console.log(str)
    }
}).on('server', str => {
    if (str.startsWith('Killfeed')) {
        kill = str.replace(/^(?:[^\:]+\:){2}\s*/, '')
        kill = kill.replace(/\([^()]*\)/g, '')
        arr = kill.replace(/ /g, '').split('killed')
        console.log(arr)
        database.addKill(arr[0], arr[1])
    }
    if (str.startsWith('Chat')) {
        let player = str.split(',')[0].replace('Chat: ', '')
        let playername = str.split(',')[1]
        let chat = str.replace(/^([^,]*,[^,]*),/, '').replace(/\([^()]*\)/g, '').replace(/ /g, '')
        if (chat.startsWith('!')) {
            if (chat == '!help') {
                conn.send('say ****** burguesinho bot de testes ******* \n comandos validos: \n !help - exibe todos os comandos possiveis \n !kda - exibe o kda no server')
            } else {
                if (chat == "!kda") {
                    database.getKda(player).then(p => {
                        if (p == undefined) {
                            conn.send(`say ${playername} can't find you :/`)
                        } else {
                            conn.send(`say ${playername} - ${(p.kills == null) ? 0 : p.kills} kills - ${(p.deaths == null) ? 0 : p.deaths} deaths`)
                        }
                    }).catch(e => { throw new Error(e) })
                }
            }
        }
    }
    if(str.startsWith('Punishment')){
        if(str.includes(' banned')){
                if(!str.includes('Temporarily banned')&&!str.includes('Kicked')){
                let punishment = str.replace('Punishment: ','')
                console.log(punishment)
                client.channels.cache.get(config.discord.channelId).send(punishment)
            }
        }
    }
    else{
        console.log(str)
    }
}).on('end', str => {
    console.log('end')
}).on('error', err => {
    console.log(err)
})

function alive() {
    setTimeout(() => { conn.send('alive'); alive() }, 5000)
}

client.login(config.discord.token)
conn.connect()