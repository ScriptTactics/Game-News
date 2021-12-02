export interface MessageList {
    messages: Msg[];
}

export interface Msg {
    time: number,
    url: string,
    gameId: number
}