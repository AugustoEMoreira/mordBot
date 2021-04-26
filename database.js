const sqlite3 = require('sqlite3')
const db = new sqlite3.Database(':memory')

function addKill(playfabIdKiller, playfabIdKilled) {
    return new Promise(resolve => {
        db.serialize(() => {
            let checks = []

            let createPlayers = []
            createPlayers.push(createPlayer(playfabIdKiller))
            createPlayers.push(createPlayer(playfabIdKilled))

            Promise.all(createPlayers).then(_ => {
                db.run('insert into match (winnerId,loserId) values (?,?)',[playfabIdKiller,playfabIdKilled])
                db.run('UPDATE players set kills = IFNULL(kills, 0) + 1 where playfabid = ?', [playfabIdKiller], (err) => {
                    if (err) throw new Error;
                    db.run('UPDATE players set deaths = IFNULL(deaths, 0) + 1 where playfabid = ?', [playfabIdKilled], (err2) => {
                        if (err2) throw new Error;
                        resolve('')
                    })
                })
            })
        })
    })
}
function createPlayer(playfabId) {
    return new Promise(resolve => {
        db.run('INSERT INTO players (playfabid) values(?)', [playfabId], (err, row) => {
            if (err) resolve(false)
            resolve(true)
        })
    })
}
function getKda(playfabId){
    return new Promise(resolve=>{
        db.get('SELECT * from players where playfabId = ?',[playfabId],(err,row)=>{
            if(err) throw new Error(err)
            resolve(row)
        })
    })
}
module.exports = {
    addKill,
    getKda
}