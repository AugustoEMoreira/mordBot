import { Rcon } from './rcon'
import { Player } from './player'
import {DiscordServer} from './discordServer'

let server = process.env.SERVER!
let port = +process.env.PORT!
let password = process.env.PASSWORD!
let discordToken = process.env.TOKEN!
let rcon = new Rcon(server, port, password, 5000);
let disc = new DiscordServer(discordToken,'651498122660282370');

let players: Player[] = []
rcon.on('auth', () => {
    console.log('connectado')
    rcon.send('playerlist')
    setTimeout(() => {
        rcon.send('listen allon')
    }, 100)
}).on('response', str => {
    if (!str.startsWith('Keeping client alive for another') && !str.startsWith('Now listening')) {
        populatePlayers(str)
    }
}).on('server', (str: string) => {
    if (str.startsWith('Login')) {
        let playerNameRegex = /([0-9A-F]{14,16})/gm;
        let actionRegex = /\w*\s\w*$/;
        let playerRegexResult;
        let actionRegexResult;
        playerRegexResult = playerNameRegex.exec(str)!
        actionRegexResult = actionRegex.exec(str)!
        let playfabid = playerRegexResult[0];
        let action = actionRegexResult[0];
        if (action == 'logged in') {
            let p = new Player(playfabid)
            p.init().then(e => {
                players.push(p)
            })
        } else {
            players = players.filter(e => e.playFabId != playfabid)
        }
        return
    }
    if (str.startsWith('Killfeed')) {
        let arr = str.match(/([0-9A-F]{14,16})/gm)!
        let killer = players.find(e => e.playFabId == arr[0])!;
        let dead = players.find(e => e.playFabId == arr[1])!;
        killer.addKill(dead.elo)
        dead.addDeath(killer.elo)
        return
    }
    if(str.startsWith('Punishment')){
        if (str.includes(' banned')) {
            if (!str.includes('Temporarily banned') && !str.includes('Kicked')) {
                let punishment = str.replace('Punishment: ', '')
                disc.sendMessage(punishment)
            }
        }
        return
    }
    if(str.startsWith('Chat')){
        let _player = str.split(',')[0].replace('Chat: ', '')
        let playername = str.split(',')[1]
        let chat = str.replace(/^([^,]*,[^,]*),/, '').replace(/\([^()]*\)/g, '').trimStart()//remove names and IDs and whitespaces before the real string
        let arr = str.match(/([0-9A-F]{14,16})/gm)!
        let playerObj = players.find(e => e.playFabId == arr[0])!
        if (chat.startsWith('!mmr')) {
            rcon.send(`say ${playername} - ${playerObj.elo} mmr`)
            return
        }
        if (chat.startsWith('!top')){
            Player.topPlayers().then(e=>{rcon.send('say '+e)})
        }
        
    }
}).on('end', _ => {
    console.log('end')
}).on('error', err => {
    if (err == 'Error: This socket has been ended by the other party'||err=="read ECONNRESET") {
        console.log('tentando reconectar')
        setTimeout(() => { rcon.connect() }, 60000)
    }
    console.error(err)
}).on('connect', () => {
    console.log('conectado, tentando autenticar')

})
rcon.connect()
function populatePlayers(playerlist: string) {
    return new Promise(resolve => {
        let arrPlayers = playerlist.split('\n')
        let promises: Promise<boolean>[] = []
        arrPlayers.forEach(p => {
            let playFabId = p.split(',')[0]
            let player = new Player(playFabId)
            promises.push(player.init())
            players.push(player)
        })
        Promise.all(promises).then(e => {
            resolve(true)
        })
    })

}