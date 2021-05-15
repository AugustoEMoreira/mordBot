import { Row } from 'aws-sdk/clients/rdsdataservice';
import { Database } from 'sqlite3';
import { PlayfabAPI, playfabTokens } from './playfabAPI'

export class Player {

    static db = new Database('./database/memory.sqlite3')
    db = Player.db
    static tokens: playfabTokens
    static playfabAPI = new PlayfabAPI()
    playFabId: string;
    kills: number = 0;
    deaths: number = 0;
    elo: number = 1500;
    k: number = 32;

    constructor(playFabId: string) {
        this.playFabId = playFabId;
    }
    init(): Promise<boolean> {
        return new Promise(resolve => {
            this.db.get("select * from players where playfabId = ?", this.playFabId, (err, resp) => {
                if (err) throw err
                if (!resp) {
                    this.updateDbPlayer(this.playFabId, this.elo, this.kills, this.deaths)
                } else {
                    let item = resp
                    this.elo = +item.elo
                    this.kills = +item.kills
                    this.deaths = +item.deaths
                }

                resolve(true)
            })
        })
    }

    addKill(enemyElo: number) {
        this.kills++
        this.elo = this.changeElo(enemyElo, 1)
        this.updateDbPlayer(this.playFabId, this.elo, this.kills, this.deaths)
        return this.kills
    }
    addDeath(enemyElo: number) {
        this.deaths++
        this.elo = this.changeElo(enemyElo, 0)
        this.updateDbPlayer(this.playFabId, this.elo, this.kills, this.deaths)
        return this.deaths
    }
    changeElo(enemyElo: number, result: number) {
        let expected = this.expectedResult(enemyElo)
        return Math.round(this.elo + this.k * (result - expected));
    }
    expectedResult(enemyElo: number) {
        return 1 / (1 + Math.pow(10, ((enemyElo - this.elo) / 400)));
    }
    static topPlayers() {
        return new Promise(resolve => {
            if (!PlayfabAPI.tokens||PlayfabAPI.tokens.TokenExpiration < new Date()) {
                this.playfabAPI.getTokens().then(tokens => {
                    PlayfabAPI.tokens = tokens
                    this.queryDatabase('select * from players order by elo desc limit 10').then(leadBoard => {
                        let lead: any[] = []
                        let response: string = '#### LEADBOARD ####\n'
                        leadBoard.forEach(async r => {
                            lead.push(this.playfabAPI.getPlayerName(r.playfabId))
                        })
                        Promise.all(lead).then(v => {
                            let names = leadBoard.map((item, i) => Object.assign({}, item, v[i]))
                            names.forEach(name => {
                                response += `${name[0]} - ${name.elo}MMR\n`
                            })
                            resolve(response)
                        })
                    })
                })
            } else{
                this.queryDatabase('select * from players order by elo desc limit 10').then(leadBoard => {
                    let lead: any[] = []
                    let response: string = '#### LEADBOARD ####\n'
                    leadBoard.forEach(async r => {
                        lead.push(this.playfabAPI.getPlayerName(r.playfabId))
                    })
                    Promise.all(lead).then(v => {
                        let names = leadBoard.map((item, i) => Object.assign({}, item, v[i]))
                        names.forEach(name => {
                            response += `${name.name} - ${name.mmr}MMR\n`
                        })
                        resolve(names)
                    })
                })
            }   


        })

    }
    private updateDbPlayer(playfab: string, elo: number, kills: number, deaths: number) {
        return new Promise(resolve => {
            this.db.run('insert or replace into players (playfabId,kills,deaths,elo) values (?,?,?,?)', [this.playFabId, this.kills, this.deaths, this.elo], (err: Error, row: Row) => {
                if (err) throw err
                resolve('')
            })
        })
    }
    private static queryDatabase(query: string, values?: string[]): Promise<any[]> {
        return new Promise(resolve => {
            if (values) {
                this.db.all(query, values, (err: Error, row: Row) => {
                    if (err) throw err
                    resolve(row)
                })

            } else {
                this.db.all(query, (err: Error, row: Row) => {
                    if (err) throw err
                    resolve(row)
                })
            }
        })
    }
}