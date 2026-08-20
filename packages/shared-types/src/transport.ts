import { EventEmitter } from 'node:events';
import WebSocket from 'ws';

export const SOCKET_OPEN = 1; // WebSocket.OPEN
const SOCKET_CLOSED = 3; // WebSocket.CLOSED

export interface IClientSocket {
  readonly readyState: number;
  send(data: string): void;
}

export interface ISocket extends IClientSocket {
  terminate(): void;
  ping(): void;
  on(event: 'pong', listener: () => void): void;
  on(event: 'message', listener: (raw: Buffer | string) => void): void;
  on(event: 'close', listener: () => void): void;
}

export interface ISocketServer {
  readonly clients: Iterable<IClientSocket>;
}

// Shared by api and realtime so both services can be driven, in tests, by
// the exact same fake socket implementation -- one EventEmitterTransport
// instance passed into either service's connection handler emits 'sent' for
// what the service sent back, and accepts .emit('message'/'pong'/'close')
// to simulate what a real client would have done.
export class EventEmitterTransport extends EventEmitter implements ISocket {
  protected _readyState: number;

  get readyState(): number {
    return this._readyState;
  }

  constructor(readyState = SOCKET_OPEN) {
    super();
    this._readyState = readyState;
  }

  on(event: 'pong', listener: () => void): this;
  on(event: 'message', listener: (raw: Buffer | string) => void): this;
  on(event: 'close', listener: () => void): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  send(data: string): void {
    this.emit('sent', data);
  }

  terminate(): void {
    this._readyState = SOCKET_CLOSED;
    this.emit('close');
  }

  ping(): void {
    this.emit('ping');
  }
}

export class WsTransport extends EventEmitterTransport {
  private readonly ws: WebSocket;

  constructor(ws: WebSocket) {
    super(ws.readyState);
    this.ws = ws;
    ws.on('pong', () => this.emit('pong'));
    ws.on('message', (raw) => this.emit('message', raw));
    ws.on('close', () => this.emit('close'));
  }

  override get readyState(): number {
    return this.ws.readyState;
  }

  override send(data: string): void {
    this.ws.send(data);
  }

  override terminate(): void {
    this.ws.terminate();
  }

  override ping(): void {
    this.ws.ping();
  }
}
