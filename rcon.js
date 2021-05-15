"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.Rcon = void 0;
var events_1 = require("events");
var net_1 = require("net");
var buffer_1 = require("buffer");
var PacketType;
(function (PacketType) {
    PacketType[PacketType["COMMAND"] = 2] = "COMMAND";
    PacketType[PacketType["AUTH"] = 3] = "AUTH";
    PacketType[PacketType["RESPONSE_VALUE"] = 0] = "RESPONSE_VALUE";
    PacketType[PacketType["RESPONSE_AUTH"] = 2] = "RESPONSE_AUTH";
})(PacketType || (PacketType = {}));
var Rcon = /** @class */ (function (_super) {
    __extends(Rcon, _super);
    function Rcon(host, port, password) {
        var _this = _super.call(this) || this;
        _this.host = host;
        _this.port = port;
        _this.password = password;
        _this.rconId = 0x0012D4A6; // This is arbitrary in most cases
        _this.hasAuthed = false;
        _this.outstandingData = null;
        events_1.EventEmitter.call(_this);
        return _this;
    }
    Rcon.prototype.send = function (data, cmd, id) {
        if (cmd === void 0) { cmd = PacketType.COMMAND; }
        if (id === void 0) { id = this.rconId; }
        var sendBuf;
        var length = buffer_1.Buffer.byteLength(data);
        sendBuf = buffer_1.Buffer.alloc(length + 14);
        sendBuf.writeInt32LE(length + 10, 0);
        sendBuf.writeInt32LE(id, 4);
        sendBuf.writeInt32LE(cmd, 8);
        sendBuf.write(data, 12);
        sendBuf.writeInt16LE(0, length + 12);
    };
    Rcon.prototype._sendSocket = function (buf) {
        if (this._tcpSocket) {
            this._tcpSocket.write(buf.toString('binary'), 'binary');
        }
    };
    Rcon.prototype.disconnect = function () {
        if (this._tcpSocket)
            this._tcpSocket.end();
    };
    Rcon.prototype._tcpSocketOnData = function (data) {
        if (this.outstandingData != null) {
            data = buffer_1.Buffer.concat([this.outstandingData, data], this.outstandingData.length + data.length);
            this.outstandingData = null;
        }
        while (data.length) {
            var len = data.readInt32LE(0);
            if (!len)
                return;
            var id = data.readInt32LE(4);
            var type = data.readInt32LE(8);
            if (len >= 10 && data.length >= len + 4) {
                if (id == this.rconId) {
                    if (!this.hasAuthed && type == PacketType.RESPONSE_AUTH) {
                        this.hasAuthed = true;
                        this.emit('auth');
                    }
                    else if (type == PacketType.RESPONSE_VALUE) {
                        var str = data.toString('utf8', 12, 12 + len - 10);
                        if (str.charAt(str.length - 1) === '\n') {
                            // Emit the response without the newline.
                            str = str.substring(0, str.length - 1);
                        }
                        this.emit('response', str);
                    }
                }
                else if (id == -1) {
                    this.emit('error', new Error("Authentication failed"));
                }
                else {
                    // ping/pong likely
                    var str = data.toString('utf8', 12, 12 + len - 10);
                    if (str.charAt(str.length - 1) === '\n') {
                        // Emit the response without the newline.
                        str = str.substring(0, str.length - 1);
                    }
                    this.emit('server', str);
                }
                data = data.slice(12 + len - 8);
            }
            else {
                // Keep a reference to the chunk if it doesn't represent a full packet
                this.outstandingData = data;
                break;
            }
        }
    };
    Rcon.prototype.socketOnConnect = function () {
        this.emit('connect');
        this.send(this.password, PacketType.AUTH);
    };
    Rcon.prototype.socketOnEnd = function () {
        this.emit('end');
        this.hasAuthed = false;
    };
    Rcon.prototype.connect = function () {
        var _this = this;
        console.log('trying to connect');
        this._tcpSocket = net_1.createConnection(this.port, this.host);
        console.log('trying to connect');
        this._tcpSocket.on('data', function (data) { _this._tcpSocketOnData(data); })
            .on('connect', function () { _this.socketOnConnect(); })
            .on('error', function (err) { _this.emit('error', err); })
            .on('end', function () { _this.socketOnEnd(); });
    };
    return Rcon;
}(events_1.EventEmitter));
exports.Rcon = Rcon;
