import axios, { AxiosRequestConfig } from 'axios'
export interface playfabTokens {
    xAuthorization: string,
    EntityToken: string,
    TokenExpiration: Date
}
export class PlayfabAPI {
    static tokens :playfabTokens;


    getPlayerName(playfabId: string) {
        return new Promise(resolve => {
            this.getPlayerId(playfabId).then(playerId => {
                const options = {
                    method: 'POST',
                    url: 'https://12d56.playfabapi.com/Object/GetObjects',
                    headers: {
                        'X-EntityToken': PlayfabAPI.tokens.EntityToken,
                        'Content-Type': 'application/json'
                    },
                    data: { Entity: { Id: playerId, Type: 'title_player_account' } }
                } as AxiosRequestConfig;
                axios.request(options).then(response => {
                   resolve([response.data.data.Objects.AccountInfo.DataObject.Name, playerId]);
                    
                })
            });
        })
    }
    async getTokens(): Promise<playfabTokens> {
        const options = {
            method: 'POST',
            url: 'https://12d56.playfabapi.com/Client/LoginWithCustomID',
            headers: {
                'Content-Type': 'application/json'
            },
            data: { TitleId: '12D56', CustomId: 'burguesinhoConverter', CreateAccount: false }
        } as AxiosRequestConfig;
        let response = await axios.request(options)
        let result: playfabTokens = {
            xAuthorization: response.data.data.SessionTicket,
            EntityToken: response.data.data.EntityToken.EntityToken,
            TokenExpiration: new Date(response.data.data.LastLoginTime)
        }
        return result

    }
    async getPlayerId(playfabId: string) {
        const options = {
            method: 'POST',
            url: 'https://12d56.playfabapi.com/Client/GetPlayerCombinedInfo',
            params: { sdk: 'UE4MKPL-1.21.190717' },
            headers: {
                'Content-Type': 'application/json',
                'x-authorization': PlayfabAPI.tokens.xAuthorization
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
        } as AxiosRequestConfig;
        try{
            let response = await axios.request(options)
            return response.data.data.InfoResultPayload.AccountInfo.TitleInfo.TitlePlayerAccount.Id

        }catch(e){
            throw new Error(e)
        }
    }
}