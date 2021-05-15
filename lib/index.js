"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rcon_1 = require("./rcon");
var player_1 = require("./player");
var discordServer_1 = require("./discordServer");
var server = process.env.SERVER;
var port = +process.env.PORT;
var password = process.env.PASSWORD;
var discordToken = process.env.TOKEN;
var rcon = new rcon_1.Rcon(server, port, password, 5000);
var disc = new discordServer_1.DiscordServer(discordToken, '651498122660282370');
var players = [];
rcon.on('auth', function () {
    console.log('connectado');
    rcon.send('playerlist');
    setTimeout(function () {
        rcon.send('listen allon');
    }, 100);
}).on('response', function (str) {
    if (!str.startsWith('Keeping client alive for another') && !str.startsWith('Now listening')) {
        populatePlayers(str);
    }
}).on('server', function (str) {
    if (str.startsWith('Login')) {
        var playerNameRegex = /([0-9A-F]{14,16})/gm;
        var actionRegex = /\w*\s\w*$/;
        var playerRegexResult = void 0;
        var actionRegexResult = void 0;
        playerRegexResult = playerNameRegex.exec(str);
        actionRegexResult = actionRegex.exec(str);
        var playfabid_1 = playerRegexResult[0];
        var action = actionRegexResult[0];
        if (action == 'logged in') {
            var p_1 = new player_1.Player(playfabid_1);
            p_1.init().then(function (e) {
                players.push(p_1);
            });
        }
        else {
            players = players.filter(function (e) { return e.playFabId != playfabid_1; });
        }
        return;
    }
    if (str.startsWith('Killfeed')) {
        var arr_1 = str.match(/([0-9A-F]{14,16})/gm);
        var killer = players.find(function (e) { return e.playFabId == arr_1[0]; });
        var dead = players.find(function (e) { return e.playFabId == arr_1[1]; });
        killer.addKill(dead.elo);
        dead.addDeath(killer.elo);
        return;
    }
    if (str.startsWith('Punishment')) {
        if (str.includes(' banned')) {
            if (!str.includes('Temporarily banned') && !str.includes('Kicked')) {
                var punishment = str.replace('Punishment: ', '');
                disc.sendMessage(punishment);
            }
        }
        return;
    }
    if (str.startsWith('Chat')) {
        var _player = str.split(',')[0].replace('Chat: ', '');
        var playername = str.split(',')[1];
        var chat = str.replace(/^([^,]*,[^,]*),/, '').replace(/\([^()]*\)/g, '').trimStart(); //remove names and IDs and whitespaces before the real string
        var arr_2 = str.match(/([0-9A-F]{14,16})/gm);
        var playerObj = players.find(function (e) { return e.playFabId == arr_2[0]; });
        if (chat.startsWith('!mmr')) {
            rcon.send("say " + playername + " - " + playerObj.elo + " mmr");
            return;
        }
        if (chat.startsWith('!top')) {
            player_1.Player.topPlayers().then(function (e) { rcon.send('say ' + e); });
        }
    }
}).on('end', function (_) {
    console.log('end');
}).on('error', function (err) {
    if (err == 'Error: This socket has been ended by the other party' || err == "read ECONNRESET") {
        console.log('tentando reconectar');
        setTimeout(function () { rcon.connect(); }, 60000);
    }
    console.error(err);
}).on('connect', function () {
    console.log('conectado, tentando autenticar');
});
rcon.connect();
function populatePlayers(playerlist) {
    return new Promise(function (resolve) {
        var arrPlayers = playerlist.split('\n');
        var promises = [];
        arrPlayers.forEach(function (p) {
            var playFabId = p.split(',')[0];
            var player = new player_1.Player(playFabId);
            promises.push(player.init());
            players.push(player);
        });
        Promise.all(promises).then(function (e) {
            resolve(true);
        });
    });
}
//# sourceMappingURL=index.js.map