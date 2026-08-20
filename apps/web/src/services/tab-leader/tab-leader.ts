export interface TabLeaderOptions {
    lockName: string;
    channelName: string;
}

// Coordinates a single "leader" tab per browser (not per-tab) using the Web
// Locks API, with a BroadcastChannel for the leader/followers to talk to
// each other. Deliberately has no notion of auth/tokens/websockets -- any
// flow that needs "only one tab does X" can reuse this, authenticated or not.
export class TabLeader<T = unknown> {
    private channel: BroadcastChannel | null = null;
    private lockAbort: AbortController | null = null;
    private messageHandler: ((message: T) => void) | null = null;
    private becomeLeaderCallback: (() => void) | null = null;
    private won = false;

    constructor(private readonly options: TabLeaderOptions) {}

    // Checking `window`/`document` and not just `navigator.locks` matters
    // here: this coordination only makes sense between actual browser tabs,
    // and some non-browser runtimes (e.g. Node 24+) now expose a
    // same-shaped `navigator.locks` with different lifetime semantics -- a
    // lock there isn't tied to anything like a tab closing, so it can
    // outlive the code that acquired it.
    get isSupported(): boolean {
        return typeof window !== 'undefined' && typeof document !== 'undefined'
            && typeof navigator !== 'undefined' && !!navigator.locks;
    }

    // Whether this tab has already won the leader race.
    get isLeader(): boolean {
        return this.won;
    }

    onMessage(handler: (message: T) => void): void {
        this.messageHandler = handler;
    }

    postMessage(message: T): void {
        this.channel?.postMessage(message);
    }

    // Registers the callback to run once this tab wins the leader race.
    // Runs immediately if the race already resolved in this tab's favor by
    // the time this is called -- lets a consumer that isn't ready yet at
    // start() time (e.g. an auth flow still waiting on a token) subscribe
    // whenever it becomes ready, without missing or re-triggering the race.
    onBecomeLeader(callback: () => void): void {
        this.becomeLeaderCallback = callback;
        if (this.won) callback();
    }

    // Kicks off the channel + lock race. Deliberately takes no callback --
    // see onBecomeLeader -- so leader election can start as soon as the app
    // boots, before anything (e.g. auth) is ready to react to winning it.
    //
    // Never resolved on purpose — the lock (and the leader role) is only
    // released when the tab closes/crashes, at which point the browser hands
    // it to the next waiting tab automatically.
    start(): void {
        this.won = false;
        this.channel?.close();
        this.channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(this.options.channelName) : null;
        if (this.channel) {
            this.channel.onmessage = (event: MessageEvent<T>) => {
                this.messageHandler?.(event.data);
            };
        }

        const onWin = () => {
            this.won = true;
            this.becomeLeaderCallback?.();
        };

        if (!this.isSupported) {
            onWin();
            return;
        }

        // `signal` only cancels the request while it's still queued though --
        // once a request is granted, aborting it does nothing on its own, so
        // a previous start() holding the lock via the never-resolving promise
        // below would keep holding it forever. Resolving that promise
        // ourselves on 'abort' is what actually releases it, letting the
        // next start()'s request be granted right after.
        this.lockAbort?.abort();
        const abortController = new AbortController();
        this.lockAbort = abortController;

        navigator.locks.request(this.options.lockName, { signal: abortController.signal }, () => new Promise<void>((resolve) => {
            abortController.signal.addEventListener('abort', () => resolve());
            onWin();
        })).catch(() => {
            // Aborted while still queued (a subsequent start() call) — expected, not an error.
        });
    }

    stop(): void {
        this.won = false;
        this.lockAbort?.abort();
        this.lockAbort = null;
        this.channel?.close();
        this.channel = null;
    }
}
