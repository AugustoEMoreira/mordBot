import {EventEmitter} from 'events'
import { Socket,createConnection } from 'net'
import { Buffer } from 'buffer'

enum PacketType {
    COMMAND = 0x02,
    AUTH = 0x03,
    RESPONSE_VALUE = 0x00,
    RESPONSE_AUTH = 0x02
}
export class Rcon extends EventEmitter {
    host: string;
    port: number;
    password: string;
    rconId: any;
    hasAuthed: any;
    outstandingData: any;
    _tcpSocket: Socket | undefined;
    keepAliveTime: number;

    constructor(host: string, port: number, password: string,keepAlive:number = 0) {
        super()
        this.host = host;
        this.port = port;
        this.password = password;
        this.rconId = 0x0012D4A6; // This is arbitrary in most cases
        this.hasAuthed = false;
        this.outstandingData = null;
        EventEmitter.call(this);
        this.keepAliveTime = keepAlive;
    }
    keepAlive(time:number) {
        if(this.hasAuthed){
            setTimeout(()=>{
                this.send('alive')
                this.keepAlive(time)
            },time)
        }
    }
    send(data: any, cmd: PacketType = PacketType.COMMAND, id: any = this.rconId) {
        let sendBuf: Buffer;
        let length = Buffer.byteLength(data);
        sendBuf = Buffer.alloc(length + 14);
        sendBuf.writeInt32LE(length + 10, 0);
        sendBuf.writeInt32LE(id, 4);
        sendBuf.writeInt32LE(cmd, 8);
        sendBuf.write(data, 12);
        sendBuf.writeInt16LE(0, length + 12);
        this._sendSocket(sendBuf);
    }
    _sendSocket(buf: Buffer) {
        if (this._tcpSocket) {
            this._tcpSocket.write(buf.toString('binary'), 'binary');
        }
    }
    disconnect() {
        if (this._tcpSocket) this._tcpSocket.end();
    }
    _tcpSocketOnData(data: Buffer) {
        if (this.outstandingData != null) {
            data = Buffer.concat([this.outstandingData, data], this.outstandingData.length + data.length);
            this.outstandingData = null;
        }
        while (data.length) {
            let len = data.readInt32LE(0);
            if (!len) return;

            let id = data.readInt32LE(4);
            let type = data.readInt32LE(8);

            if (len >= 10 && data.length >= len + 4) {
                if (id == this.rconId) {
                    if (!this.hasAuthed && type == PacketType.RESPONSE_AUTH) {
                        this.hasAuthed = true;
                        if(this.keepAliveTime>0){
                            this.keepAlive(this.keepAliveTime);
                        }
                        this.emit('auth');
                    } else if (type == PacketType.RESPONSE_VALUE) {
                        let str:string = data.toString('utf8', 12, 12 + len - 10);

                        if (str.charAt(str.length - 1) === '\n') {
                            // Emit the response without the newline.
                            str = str.substring(0, str.length - 1);
                        }

                        this.emit('response', str);
                    }
                } else if (id == -1) {
                    this.emit('error', new Error("Authentication failed"));
                } else {
                    // ping/pong likely
                    let str:string = data.toString('utf8', 12, 12 + len - 10);

                    if (str.charAt(str.length - 1) === '\n') {
                        // Emit the response without the newline.
                        str = str.substring(0, str.length - 1);
                    }

                    this.emit('server', str);
                }

                data = data.slice(12 + len - 8);
            } else {
                // Keep a reference to the chunk if it doesn't represent a full packet
                this.outstandingData = data;
                break;
            }
        }
    }
    socketOnConnect() {
        this.emit('connect');
        this.send(this.password, PacketType.AUTH);
    }
    socketOnEnd() {
        this.emit('end');
        this.hasAuthed = false;
    }
    connect(){
        this._tcpSocket = createConnection(this.port, this.host);
        this._tcpSocket.on('data', (data) => { this._tcpSocketOnData(data) })
            .on('connect', ()=> { this.socketOnConnect() })
            .on('error', (err) => { this.emit('error', err) })
            .on('end', () => { this.socketOnEnd() });
    }
}