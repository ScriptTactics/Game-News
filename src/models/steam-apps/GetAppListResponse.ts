export interface SteamApps {
    applist: Applist;
}

export interface Applist {
    apps: App[];
}

export interface App {
    appid: number;
    name:  string;
}
