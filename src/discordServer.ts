import Discord from 'discord.js'
export class DiscordServer {
    channel: string
    discordClient:Discord.Client
    constructor(token:string,channel:string){
        this.channel = channel;
        this.discordClient = new Discord.Client()
        this.discordClient.login(token)
    }
    sendMessage(message:string) {
        this.discordClient.channels.fetch(this.channel).then(ch=>{
            (<Discord.TextChannel>ch).send(message)
        })
    }

}