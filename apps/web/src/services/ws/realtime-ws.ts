import { WsServerMessage } from '@repo/shared-types';
import properties from '../../properties.ts';
import { ITransport, TransportFactory, TRANSPORT_OPEN, createWsTransport } from './transport.ts';

export type RealtimeWsMessageCallback = (message: WsServerMessage) => void;

// Lets a returning customer (page reload, network blip) resume their
// existing ticket instead of getting a brand new one -- see
// onCustomerConnection's ticketId-resume handling on the realtime side.
const CUSTOMER_TICKET_STORAGE_KEY = 'free-for-talk.customerTicketId';

// Trailing slash stripped so these call sites can safely append `/ws/...`
// without risking a double slash (e.g. `/realtime//ws/volunteer`), which some
// reverse proxies refuse to route -- VITE_REALTIME_WS_URL itself keeps its
// trailing slash (init-ws.ts connects to it bare, matching nginx's
// `location /realtime/` prefix).
const REALTIME_WS_BASE = properties.realtimeWsUrl.replace(/\/$/, '');

const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;

type ConnectionParams = { role: 'volunteer'; token: string } | { role: 'customer'; token?: string };

export class RealtimeWsService {
  private static instance: RealtimeWsService;
  private socket: ITransport | null = null;
  private onMessageCallback?: RealtimeWsMessageCallback;
  // Sends requested before the socket finishes opening (see sendWhenReady) --
  // ITransport only exposes a single onopen property (unlike a real
  // WebSocket's addEventListener, which allows any number of 'open'
  // listeners), so queued callers are flushed by this instead of each
  // registering their own listener.
  private pendingSends: (() => void)[] = [];

  // Reconnect bookkeeping, mirroring InitWs (see init-ws.ts) -- this socket
  // used to just go dead on close with nothing bringing it back, silently
  // stranding any action queued in pendingSends (e.g. "tentar ligar") the
  // next time the user touched the tab.
  private running = false;
  private reconnectAttempts = 0;
  private reconnectPending = false;
  private connectionParams: ConnectionParams | null = null;

  private constructor(private readonly factory: TransportFactory) {
    // No `document` under the integration suite's plain Node test
    // environment (see web_runtime.ts, which instantiates this class
    // directly) -- a real browser always has one.
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }
  }

  static getInstance(factory: TransportFactory = createWsTransport): RealtimeWsService {
    if (!RealtimeWsService.instance) {
      RealtimeWsService.instance = new RealtimeWsService(factory);
    }
    return RealtimeWsService.instance;
  }

  // Test-only seam: getInstance() is a singleton, so a factory passed after
  // the first call is otherwise silently ignored -- reset() drops the
  // instance so the next getInstance(factory) actually takes effect.
  static reset(): void {
    RealtimeWsService.instance = undefined as unknown as RealtimeWsService;
  }

  onMessage(cb: RealtimeWsMessageCallback): void {
    this.onMessageCallback = cb;
  }

  connectAsVolunteer(token: string): void {
    this.running = true;
    this.connectionParams = { role: 'volunteer', token };
    if (this.socket) return;
    this.openSocket(`${REALTIME_WS_BASE}/ws/volunteer?token=${encodeURIComponent(token)}`);
  }

  // token is only passed for a Keycloak-authenticated customer (role
  // customer) -- an anonymous visitor calls this with no token and keeps
  // the plain ticketId-based flow (see on_customer_connection.ts).
  connectAsCustomer(token?: string): void {
    this.running = true;
    this.connectionParams = { role: 'customer', token };
    if (this.socket) return;
    const storedTicketId = localStorage.getItem(CUSTOMER_TICKET_STORAGE_KEY);
    const params = new URLSearchParams();
    if (storedTicketId) params.set('ticketId', storedTicketId);
    if (token) params.set('token', token);
    const query = params.toString();
    this.openSocket(`${REALTIME_WS_BASE}/ws/customer${query ? `?${query}` : ''}`);
  }

  // Full-jitter exponential backoff, same reasoning as InitWs.nextReconnectDelay.
  private nextReconnectDelay(): number {
    const cap = Math.min(RECONNECT_MAX_DELAY_MS, RECONNECT_BASE_DELAY_MS * 2 ** this.reconnectAttempts);
    this.reconnectAttempts += 1;
    return Math.random() * cap;
  }

  private reconnect(delayMs: number): void {
    if (!this.running || !this.connectionParams || this.reconnectPending) return;
    this.reconnectPending = true;
    const params = this.connectionParams;
    setTimeout(() => {
      this.reconnectPending = false;
      if (!this.running || this.socket) return;
      if (params.role === 'volunteer') {
        this.connectAsVolunteer(params.token);
      } else {
        this.connectAsCustomer(params.token);
      }
    }, delayMs);
  }

  // Mirrors InitWs.handleVisibilityChange: a mobile OS can suspend this
  // socket without ever firing onclose, so a phone waking from screen-lock
  // needs its own trigger rather than waiting on the socket to notice.
  private handleVisibilityChange(): void {
    if (document.visibilityState !== 'visible') return;
    if (!this.running || !this.connectionParams) return;
    if (this.socket?.readyState === TRANSPORT_OPEN) return;
    this.reconnectAttempts = 0;
    this.reconnect(0);
  }

  private openSocket(url: string): void {
    this.socket = this.factory(url);
    this.pendingSends = [];

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      const queued = this.pendingSends;
      this.pendingSends = [];
      queued.forEach((send) => send());
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data as string) as WsServerMessage;
      this.onMessageCallback?.(message);
    };

    this.socket.onclose = () => {
      this.socket = null;
      if (this.running) this.reconnect(this.nextReconnectDelay());
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  disconnect(): void {
    this.running = false;
    this.connectionParams = null;
    this.socket?.close();
    this.socket = null;
  }
}
