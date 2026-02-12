import { Server } from "@modelcontextprotocol/sdk/server/index.js";
export interface CreateServerOptions {
    name?: string;
    version?: string;
}
export declare function createServer(vaultPath: string, options?: CreateServerOptions): Server;
