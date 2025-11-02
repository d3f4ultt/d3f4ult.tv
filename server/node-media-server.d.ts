declare module 'node-media-server' {
  export interface NodeMediaServerConfig {
    rtmp?: {
      port?: number;
      chunk_size?: number;
      gop_cache?: boolean;
      ping?: number;
      ping_timeout?: number;
    };
    http?: {
      port?: number;
      mediaroot?: string;
      allow_origin?: string;
    };
    trans?: {
      ffmpeg?: string;
      tasks?: Array<{
        app?: string;
        hls?: boolean;
        hlsFlags?: string;
        hlsKeep?: boolean;
        dash?: boolean;
        mp4?: boolean;
      }>;
    };
    logType?: number;
    auth?: {
      play?: boolean;
      publish?: boolean;
      secret?: string;
    };
  }

  export default class NodeMediaServer {
    constructor(config: NodeMediaServerConfig);
    run(): void;
    stop(): void;
    on(event: string, callback: (...args: any[]) => void): void;
    getSession(id: string): { reject(): void; };
  }
}
