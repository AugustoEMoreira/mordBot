const axios = require('axios')

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
                db.run('insert into match (winnerId,loserId) values (?,?)', [playfabIdKiller, playfabIdKilled])
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
function getKda(playfabId) {
    return new Promise(resolve => {
        db.get('SELECT * from players where playfabId = ?', [playfabId], (err, row) => {
            if (err) throw new Error(err)
            resolve(row)
        })
    })
}
function getTop10() {
    return new Promise(resolve => {
        db.all('SELECT playfabId,(kills/deaths) as ratio from players order by (kills/deaths) desc limit 10', [], (err, row) => {
            if (err) throw new Error(err)
            let nicks = []
            row.forEach(r => {
                nicks.push(getNick(r.playfabId))
            })
            Promise.all(nicks).then(values =>{
                let arr = values.map((item,i)=> Object.assign({},item,row[i]))
                console.log(arr)
                resolve(arr)

            })
        })
    })
}
function getGameId(playfabId) {
    return new Promise(resolve => {
        const options = {
            method: 'POST',
            url: 'https://12d56.playfabapi.com/Client/GetPlayerCombinedInfo',
            params: { sdk: 'UE4MKPL-1.21.190717' },
            headers: {
                'Content-Type': 'application/json',
                'x-authorization': '76FDA7D9281A2C5D--E524B3C4EA184B83-12D56-8D90B82EF1926DE-aqOvnj3dnueD4IDkIPkmkEu+g8XN3UVVh87HyMTwh8g='
            },
            data: {
                InfoRequestParameters: {
                    GetCharacterInventories: false,
                    GetCharacterList: false,
                    GetPlayerProfile: false,
                    GetPlayerStatistics: false,
                    GetTitleData: false,
                    GetUserAccountInfo: true,
                    GetUserData: false,
                    GetUserInventory: false,
                    GetUserReadOnlyData: false,
                    GetUserVirtualCurrency: false
                },
                PlayFabId: playfabId
            }
        };

        axios.request(options).then(function (response) {
            resolve(response.data.data.InfoResultPayload.AccountInfo.TitleInfo.TitlePlayerAccount.Id);
        }).catch(function (error) {
            console.error(error);
        });
    })

}
function getNick(playfabId) {
    return new Promise(resolve => {
        getGameId(playfabId).then(gameId =>{
            const options = {
                method: 'POST',
                url: 'https://12d56.playfabapi.com/Object/GetObjects',
                headers: {
                    'X-EntityToken': 'M3x7ImkiOiIyMDIxLTA0LTMwVDAzOjUwOjQ0LjMxMjQ2NzFaIiwiaWRwIjoiQ3VzdG9tIiwiZSI6IjIwMjEtMDUtMDFUMDM6NTA6NDQuMzEyNDY3MVoiLCJoIjoiRTlBRkI0Q0IzQTI4QzgyQiIsInMiOiJ6U2poOVNoOUdIcVl4NUNjOVBMUWthOHRJSkV2eHBmNDBGZWF3Q2JoS0xnPSIsImVjIjoidGl0bGVfcGxheWVyX2FjY291bnQhNDAzNkVENzE5ODM4MjY4MC8xMkQ1Ni83NkZEQTdEOTI4MUEyQzVELzM0QUU2N0VBRDlDRTcxNTIvIiwiZWkiOiIzNEFFNjdFQUQ5Q0U3MTUyIiwiZXQiOiJ0aXRsZV9wbGF5ZXJfYWNjb3VudCJ9',
                    'Content-Type': 'application/json'
                },
                data: { Entity: { Id: gameId, Type: 'title_player_account' } }
            };
            axios.request(options).then(response => {
                let result = {};
                result.nick = response.data.data.Objects.AccountInfo.DataObject.Name
                result.playfabId = response.data.data.Objects.AccountInfo.DataObject.PlayFabId
                resolve(result)
            }).catch(e => { throw new Error(e) })
        })
        
    })

}

module.exports = {
    addKill,
    getKda,
    getTop10
}