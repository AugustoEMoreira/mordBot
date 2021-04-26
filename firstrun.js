const sqlite3 = require('sqlite3')
const db = new sqlite3.Database(':memory')

db.run('CREATE TABLE players (playfabId varchar(20) PRIMARY KEY, kills integer, deaths INTEGER, elo INTEGER)')
db.run('CREATE TABLE match (matchId INTEGER PRIMARY KEY, winnerId varchar(20), loserId varchar(20))')