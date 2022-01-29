const axios = require('axios')
const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('memory.sqlite3')
module.exports = class Player{
    constructor(playfabId){
        this.playfabId = playfabId
        this.kills = 0
        this.addDeath = 0
        this.mmr = 0
        this.arena = undefined
    }
    async init(){
        
    }
    async getNick(playfabId){

    }
    async addKill(){

    }
    async addDeath(){

    }
    //query sqlite3 database for player's mmr
    getMMR(){
        db.get('SELECT * from players where playfabId = ?', [this.playfabId], (err, row) => {
            if (err) throw new Error(err)
            this.mmr = row.mmr
        })
    }
    //result -1 = loser, 1 = winner
    getNewMMR(enemyMMR,result){

    }

}