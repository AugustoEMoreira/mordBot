"use strict";
exports.__esModule = true;
var rcon_1 = require("./rcon");
var rcon = new rcon_1.Rcon('127.0.0.1', 7780, '123');
rcon.on('auth', function () {
    console.log('connectado');
}).on('response', function (str) {
    console.log(str);
}).on('server', function (str) {
    console.log(str);
}).on('end', function (_) {
    console.log('end');
}).on('error', function (err) {
    console.error(err);
});
rcon.connect();
