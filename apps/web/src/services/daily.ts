import DailyIframe, { type DailyCall } from "@daily-co/daily-js";
import { useDevicesStore } from "../states/stores.ts";

const MAX_CALL_DURATION_SECONDS = 60 * 60 * 2;
const MAX_SESSION_DURATION_SECONDS = 60 * 30;

export interface JoinOptions {
  room: string;
  roomUrl?: string;
  userId: string;
  userName: string;
}

export interface IDailyService {
  join(options: JoinOptions): Promise<void>;
  leave(): Promise<void>;
  destroy(): void;
  rebuild(): Promise<void>;
}

interface DailyServiceConfig {
  domain: string;
  apiKey: string;
}

export type CallObjectChangedCallback = (callObject: DailyCall) => void;

export class DailyService implements IDailyService {
  private static instance: DailyService;
  private _callObject: DailyCall;
  private _onCallObjectChanged?: CallObjectChangedCallback;

  get callObject(): DailyCall {
    return this._callObject;
  }

  private constructor(private readonly config: DailyServiceConfig) {
    this._callObject = DailyIframe.createCallObject();
  }

  static getInstance(config?: DailyServiceConfig): DailyService {
    if (!DailyService.instance) {
      if (!config) throw new Error('DailyService not initialized. Call getInstance(config) first.');
      DailyService.instance = new DailyService(config);
    }
    return DailyService.instance;
  }

  onCallObjectChanged(cb: CallObjectChangedCallback): void {
    this._onCallObjectChanged = cb;
  }

  destroy(): void {
    this._callObject.destroy();
  }

  async rebuild(): Promise<void> {
    try {
      await this._callObject.destroy();
    } catch (err) {
      console.error('[Daily] failed to destroy call object during rebuild:', err);
    }
    this._callObject = DailyIframe.createCallObject();
    this._onCallObjectChanged?.(this._callObject);
  }

  roomUrl(roomName: string): string {
    return `https://${this.config.domain}.daily.co/${roomName}`;
  }

  async getMeetingToken(roomName: string, userId: string): Promise<string | undefined> {
    if (!this.config.apiKey) return undefined;

    const res = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_id: userId,
          eject_after_elapsed: MAX_CALL_DURATION_SECONDS,
          exp: Math.floor(Date.now() / 1000) + MAX_SESSION_DURATION_SECONDS,
        },
      }),
    });

    if (!res.ok) {
      console.error('[Daily] failed to create meeting token:', res.status);
      return undefined;
    }

    const data = await res.json();
    return data.token;
  }

  async join(options: JoinOptions) {
    const token = await this.getMeetingToken(options.room, options.userId);

    if (!token) {
      console.error('[Daily] joining without a meeting token — participant will have no user_id on Daily side', { room: options.room, userId: options.userId });
    }

    // Without an explicit videoSource, Daily falls back to the browser's own
    // default camera pick, which on Android/mobile Chrome frequently
    // resolves to the rear (environment) camera instead of the front one
    // the user actually selected/expects.
    const { camera, microphone, cameraDailycoOn, microphoneDailycoOn } = useDevicesStore.getState();

    await this._callObject.join({
      url: options.roomUrl ?? this.roomUrl(options.room),
      token: token ?? undefined,
      userName: options.userName,
      startAudioOff: !microphoneDailycoOn,
      startVideoOff: !cameraDailycoOn,
      ...(camera ? { videoSource: camera } : {}),
      ...(microphone ? { audioSource: microphone } : {}),
    });
  }

  async leave() {
    if (this._callObject.isDestroyed()) return;
    try {
      await this._callObject.leave();
    } catch (err) {
      console.error('[Daily] failed to leave call:', err);
    }
  }

  // Swaps the actual local track(s) Daily sends -- picking a device in the
  // settings modal only wrote to the devices store until this existed, so
  // the remote participant kept seeing/hearing the original device
  // indefinitely, no matter what was selected.
  async setInputDevices(devices: { videoDeviceId?: string; audioDeviceId?: string }) {
    if (this._callObject.isDestroyed()) return;
    try {
      await this._callObject.setInputDevicesAsync(devices);
    } catch (err) {
      console.error('[Daily] failed to switch input devices:', err);
    }
  }

  async setOutputDevice(outputDeviceId: string) {
    if (this._callObject.isDestroyed()) return;
    try {
      await this._callObject.setOutputDeviceAsync({ outputDeviceId });
    } catch (err) {
      console.error('[Daily] failed to switch output device:', err);
    }
  }
}

