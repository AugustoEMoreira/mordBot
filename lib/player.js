"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
var sqlite3_1 = require("sqlite3");
var playfabAPI_1 = require("./playfabAPI");
var Player = /** @class */ (function () {
    function Player(playFabId) {
        this.db = Player.db;
        this.kills = 0;
        this.deaths = 0;
        this.elo = 1500;
        this.k = 32;
        this.playFabId = playFabId;
    }
    Player.prototype.init = function () {
        var _this = this;
        return new Promise(function (resolve) {
            _this.db.get("select * from players where playfabId = ?", _this.playFabId, function (err, resp) {
                if (err)
                    throw err;
                if (!resp) {
                    _this.updateDbPlayer(_this.playFabId, _this.elo, _this.kills, _this.deaths);
                }
                else {
                    var item = resp;
                    _this.elo = +item.elo;
                    _this.kills = +item.kills;
                    _this.deaths = +item.deaths;
                }
                resolve(true);
            });
        });
    };
    Player.prototype.addKill = function (enemyElo) {
        this.kills++;
        this.elo = this.changeElo(enemyElo, 1);
        this.updateDbPlayer(this.playFabId, this.elo, this.kills, this.deaths);
        return this.kills;
    };
    Player.prototype.addDeath = function (enemyElo) {
        this.deaths++;
        this.elo = this.changeElo(enemyElo, 0);
        this.updateDbPlayer(this.playFabId, this.elo, this.kills, this.deaths);
        return this.deaths;
    };
    Player.prototype.changeElo = function (enemyElo, result) {
        var expected = this.expectedResult(enemyElo);
        return Math.round(this.elo + this.k * (result - expected));
    };
    Player.prototype.expectedResult = function (enemyElo) {
        return 1 / (1 + Math.pow(10, ((enemyElo - this.elo) / 400)));
    };
    Player.topPlayers = function () {
        var _this = this;
        return new Promise(function (resolve) {
            if (!playfabAPI_1.PlayfabAPI.tokens || playfabAPI_1.PlayfabAPI.tokens.TokenExpiration < new Date()) {
                _this.playfabAPI.getTokens().then(function (tokens) {
                    playfabAPI_1.PlayfabAPI.tokens = tokens;
                    _this.queryDatabase('select * from players order by elo desc limit 10').then(function (leadBoard) {
                        var lead = [];
                        var response = '#### LEADBOARD ####\n';
                        leadBoard.forEach(function (r) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                lead.push(this.playfabAPI.getPlayerName(r.playfabId));
                                return [2 /*return*/];
                            });
                        }); });
                        Promise.all(lead).then(function (v) {
                            var names = leadBoard.map(function (item, i) { return Object.assign({}, item, v[i]); });
                            names.forEach(function (name) {
                                response += name[0] + " - " + name.elo + "MMR\n";
                            });
                            resolve(response);
                        });
                    });
                });
            }
            else {
                _this.queryDatabase('select * from players order by elo desc limit 10').then(function (leadBoard) {
                    var lead = [];
                    var response = '#### LEADBOARD ####\n';
                    leadBoard.forEach(function (r) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            lead.push(this.playfabAPI.getPlayerName(r.playfabId));
                            return [2 /*return*/];
                        });
                    }); });
                    Promise.all(lead).then(function (v) {
                        var names = leadBoard.map(function (item, i) { return Object.assign({}, item, v[i]); });
                        names.forEach(function (name) {
                            response += name.name + " - " + name.mmr + "MMR\n";
                        });
                        resolve(names);
                    });
                });
            }
        });
    };
    Player.prototype.updateDbPlayer = function (playfab, elo, kills, deaths) {
        var _this = this;
        return new Promise(function (resolve) {
            _this.db.run('insert or replace into players (playfabId,kills,deaths,elo) values (?,?,?,?)', [_this.playFabId, _this.kills, _this.deaths, _this.elo], function (err, row) {
                if (err)
                    throw err;
                resolve('');
            });
        });
    };
    Player.queryDatabase = function (query, values) {
        var _this = this;
        return new Promise(function (resolve) {
            if (values) {
                _this.db.all(query, values, function (err, row) {
                    if (err)
                        throw err;
                    resolve(row);
                });
            }
            else {
                _this.db.all(query, function (err, row) {
                    if (err)
                        throw err;
                    resolve(row);
                });
            }
        });
    };
    Player.db = new sqlite3_1.Database('./database/memory.sqlite3');
    Player.playfabAPI = new playfabAPI_1.PlayfabAPI();
    return Player;
}());
exports.Player = Player;
//# sourceMappingURL=player.js.map