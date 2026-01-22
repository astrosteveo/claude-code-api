export interface Config {
  server: {
    port: number;
  };
  database: {
    path: string;
  };
  cli: {
    path: string;
    timeout: number;
    defaultModel: string;
  };
  queue: {
    maxConcurrentPerSession: number;
  };
  logging: {
    level: string;
    file: string;
  };
}
