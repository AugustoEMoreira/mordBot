const Rcon = require('./rcon')
const database = require('./database')
const Discord = require('discord.js')
const config = require('./config')
const client = new Discord.Client();

let conn = new Rcon(config.server.ip, config.server.port, config.server.password);
let lastTopUsage
let top
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
        arr = str.match(/([0-9A-F]{14,16})/gm)
        database.addKill(arr[0], arr[1])
    }
    if (str.startsWith('Chat')) {
        let player = str.split(',')[0].replace('Chat: ', '')
        let playername = str.split(',')[1]
        let chat = str.replace(/^([^,]*,[^,]*),/, '').replace(/\([^()]*\)/g, '').trimStart()//remove names and IDs and whitespaces before the real string

        if (chat.startsWith('!')) {
            if (chat == '!help') {
                conn.send('say !help - show all commands \n !kda - show your K-D \n !top - List the top 10 player and their ratio - !adm "describe and inform the player causing problems" - the missusege of this command can lead to ban')
            }
            if (chat == "!kda") {
                database.getKda(player).then(p => {
                    if (p == undefined) {
                        conn.send(`say ${playername} can't find you :/`)
                    } else {
                        conn.send(`say ${playername} - ${(p.kills == null) ? 0 : p.kills} kills - ${(p.deaths == null) ? 0 : p.deaths} deaths`)
                    }
                }).catch(e => { throw new Error(e) })
            } if (chat.startsWith("!adm")) {
                client.channels.fetch(config.discord.warnModeratorsChannelId).then(channel => {
                    channel.send(`<@&${config.discord.moderatorsRoleId}> ${str.split(',')[1]} - ${player} - help wanted: ${chat}`)
                })
            } if (chat.startsWith('!top')) {
                database.getTop10().then(row => {
                    if (top != undefined || (new Date() - lastTopUsage) < 15) {
                        conn.send(top)
                    } else {
                        let response = 'say ****** Top Players ******\n'
                        row.forEach(r => {
                            response = response + `${r.nick} - KD Ratio - ${r.ratio}\n`
                        })
                        conn.send(response)
                        top = response
                        lastTopUsage = new Date()
                    }
                })
            }
        }
    }
    if (str.startsWith('Punishment')) {
        if (str.includes(' banned')) {
            if (!str.includes('Temporarily banned') && !str.includes('Kicked')) {
                let punishment = str.replace('Punishment: ', '')
                client.channels.fetch(config.discord.banlistchannelId).then(channel => {
                    channel.send(punishment)
                })
            }
        }
    }
}).on('end', str => {
    console.log('reconnecting...')
    setTimeout(() => {
        conn.connect()
    }, 10000)
}).on('error', err => {
    console.log(err)
})

client.on('message', message => {
    if (message.author.bot) return
    if (!message.content.startsWith(';')) return
    if (message.content.startsWith(';ban') && message.content.replace(";ban ", '').split(/(?<=^[^,]+(?:,[^,]+)?), /).length == 3) {

        let player = message.content.replace(";ban ", '').split(/(?<=^[^,]+(?:,[^,]+)?), /)[0]
        let duration = message.content.replace(";ban ", '').split(/(?<=^[^,]+(?:,[^,]+)?), /)[1]
        let reason = message.content.replace(";ban ", '').split(/(?<=^[^,]+(?:,[^,]+)?), /)[2]
        conn.send(`ban ${player} ${duration} ${reason}`)
        client.channels.cache.get(config.discord.banlistchannelId).send(`Discord admin ${message.author.username} banned player ${player} (Duration: ${duration}, Reason: ${reason})`)
    }
})

function alive() {
    setTimeout(() => { conn.send('alive'); alive() }, 5000)
}

client.login(config.discord.token)
conn.connect()