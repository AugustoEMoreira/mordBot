const fs = require('fs');
const Rcon = require('./rcon')
const database = require('./database')
const config = require('./config')
const Player = require('./model/Player')
let conn = new Rcon(config.server.ip, config.server.port, config.server.password);

let onlinePlayers = {}
let map
let arenas = []
let inUseArenas = []
let awaitingConfirmation = []
conn.on('auth', () => {
    console.log('connectado')
    conn.send('listen allon')
    setTimeout(() => { conn.send('Info') }, 1000)
    setTimeout(() => { conn.send('PlayerList') }, 1000)
    alive()
}).on('response', str => {
    if (!str.startsWith('Keeping client alive for another') && !str.startsWith('Now listening to')) {
        if(str.startsWith('HostName')){
            map = str.split('\n')[4].split(' ')[1]
            console.log(`current map: ${map}`)
            arenas = getArenas(map)
        }else{
            let lines = str.split('\n')
            let players = lines.map(line => line.split(',')[0])
            for(player of players){
                pobj = new Player(player)
                onlinePlayers[pobj.playfabId] = pobj
            }
        }
        
    }
}).on('server', str => {
   
    if(str.startsWith('Login')){        
        let playerPlayfabId = str.match(/([0-9A-F]{16})/gm)[0]
        let playerObj = new Player(playerPlayfabId)
        if(str.includes('logged in')){
            playerObj.init()
            onlinePlayers[playerPlayfabId] = playerObj
        }
        if(str.includes('logged out')){
            if(onlinePlayers[playerPlayfabId]){
                if(onlinePlayers[playerPlayfabId].arena){
                    
                }
                delete onlinePlayers[playerPlayfabId]
            }
        }
    }
    if(str === 'MatchState: Waiting to start'){
        conn.send('Info')
    }
    if(str.startsWith('Chat')){
        
        let playerid = str.split(',')[0].replace('Chat: ', '')
        let playername = str.split(',')[1]
        let chat = str.replace(/^([^,]*,[^,]*),/, '').replace(/\([^()]*\)/g, '').trimStart()//remove names and IDs and whitespaces before the real string
        let playerObj = onlinePlayers[playerid]
        console.log(chat)
        if(chat.startsWith('!')){
            if(chat.startsWith('!private')){
                let otherPlayerId = chat.split(' ')[1]
                let player = playerObj
                let enemy = onlinePlayers[otherPlayerId]
                if(player.arena === undefined ){
                    if(enemy.arena !== undefined){
                        conn.send('say ' + playerObj.playfabId + ' already in other arena')
                        return
                    }
    
                    let arena = arenas.filter(arena => !inUseArenas.includes(arena.name))[0]
                    inUseArenas.push(arena.name)
                    player.arena = arena.name
                    conn.send(`TeleportPlayer ${playerid} x=${arenas[arena.name].X} y=${arenas[arena.name].Y} z=${arenas[arena.name].Z}`)
                    setTimeout(()=>{conn.send(`say Waiting player ${enemy.playfabId} to confirm, send !confirm to teleport to the arena`)},1000)
                    awaitingConfirmation.push({playerPlayfabId:enemy.playfabId,arena:arena.name})
                }
                
            }
            if(chat === "!confirm" && awaitingConfirmation.map(a=>a.playerPlayfabId).includes(playerid)){
                playerArena = awaitingConfirmation.find(player => player.playerPlayfabId === playerid).arena
                playerObj.arena = playerArena;
                conn.send(`TeleportPlayer ${playerid} x=${arenas[playerArena].X} y=${arenas[playerArena].Y} z=${arenas[playerArena].Z}`)
            }
            if(chat === "!tp"){
                console.log(playerid)
                let player = onlinePlayers[playerid]
                if(player.arena !== undefined){
                    conn.send(`TeleportPlayer ${playerid} x=${arenas[player.arena].X} y=${arenas[player.arena].Y} z=${arenas[player.arena].Z}`)
                }
            }
            if(chat === "!exit"){
                let arena = playerObj.arena
                playerObj.arena = undefined
                inUseArena = false
                for(const player in onlinePlayers){
                    if(player.arena === arena){
                        inUseArena = true
                    }
                }
                if(!inUseArena)
                    inUseArenas = inUseArenas.filter(arenas => arenas !== arena)
            }
        }
    }

}).on('end', str => {
    console.log('reconnecting...')
    setTimeout(conn.connect, 10000)
}).on('error', err => {
    console.log(err)
})

function alive() {
    setTimeout(() => { conn.send('alive'); alive() }, 5000)
}
function getArenas(mapname){
    let file = fs.readFileSync(`./mapsConfig/${mapname}.json`)
    let arenas = JSON.parse(file.toString())
    return arenas
}
conn.connect()