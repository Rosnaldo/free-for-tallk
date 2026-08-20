export const TRANSPORT_CONNECTING = 0;
export const TRANSPORT_OPEN = 1;
export const TRANSPORT_CLOSED = 3;

export interface ITransport {
    readonly readyState: number;
    onopen: ((ev: Event) => void) | null;
    onmessage: ((ev: MessageEvent) => void) | null;
    onerror: ((ev: Event) => void) | null;
    onclose: ((ev: CloseEvent) => void) | null;
    send(data: string): void;
    close(): void;
}

export type TransportFactory = (url: string) => ITransport;

export interface AuthenticatedWebSocket extends ITransport {
    token?: string;
}

export const createWsTransport: TransportFactory = (url) =>
    new WebSocket(url) as unknown as ITransport;

// Test double for services that depend on ITransport (RealtimeWsService,
// InitWs) -- starts CONNECTING like a real WebSocket does, so tests can
// exercise the "queued until open" path (see RealtimeWsService.sendWhenReady)
// before calling simulateOpen(). send() just records rather than doing I/O;
// simulateMessage/simulateClose drive the on* callbacks the real transport
// would invoke on incoming network activity.
export class FakeTransport implements ITransport {
    readyState: number = TRANSPORT_CONNECTING;
    onopen: ((ev: Event) => void) | null = null;
    onmessage: ((ev: MessageEvent) => void) | null = null;
    onerror: ((ev: Event) => void) | null = null;
    onclose: ((ev: CloseEvent) => void) | null = null;
    readonly sent: string[] = [];

    send(data: string): void {
        this.sent.push(data);
    }

    close(): void {
        this.simulateClose();
    }

    simulateOpen(): void {
        this.readyState = TRANSPORT_OPEN;
        this.onopen?.({} as Event);
    }

    simulateMessage(data: string): void {
        this.onmessage?.({ data } as MessageEvent);
    }

    simulateClose(): void {
        this.readyState = TRANSPORT_CLOSED;
        this.onclose?.({} as CloseEvent);
    }
}
