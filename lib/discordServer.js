"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordServer = void 0;
var discord_js_1 = __importDefault(require("discord.js"));
var DiscordServer = /** @class */ (function () {
    function DiscordServer(token, channel) {
        this.channel = channel;
        this.discordClient = new discord_js_1.default.Client();
        this.discordClient.login(token);
    }
    DiscordServer.prototype.sendMessage = function (message) {
        this.discordClient.channels.fetch(this.channel).then(function (ch) {
            ch.send(message);
        });
    };
    return DiscordServer;
}());
exports.DiscordServer = DiscordServer;
//# sourceMappingURL=discordServer.js.map