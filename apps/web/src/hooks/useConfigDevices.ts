import { useEffect, useCallback } from "react";
import { DailyService } from "../services/daily.ts";
import { useDevicesStore } from "../states/stores.ts";
import type { PermissionState } from "../states/local/devices/store.ts";

export type { MediaDeviceOption, PermissionState } from "../states/local/devices/store.ts";

async function queryPermission(name: "camera" | "microphone"): Promise<PermissionState> {
  try {
    const result = await navigator.permissions.query({ name: name as PermissionName });
    return result.state as PermissionState;
  } catch {
    return "prompt";
  }
}

export function useConfigDevices() {
  const store = useDevicesStore();

  const toggleCamera = useCallback(() => {
    const s = useDevicesStore.getState();
    s.setCameraOn(!s.cameraOn);
  }, []);

  const toggleMicrophone = useCallback(() => {
    const s = useDevicesStore.getState();
    s.setMicrophoneOn(!s.microphoneOn);
  }, []);

  const toggleCameraDailyco = useCallback(() => {
    const s = useDevicesStore.getState();
    const next = !s.cameraOn;
    s.setCameraOn(next);
    s.setCameraDailycoOn(next);
    DailyService.getInstance().callObject.setLocalVideo(next);
  }, []);

  const toggleMicrophoneDailyco = useCallback(() => {
    const s = useDevicesStore.getState();
    const next = !s.microphoneOn;
    s.setMicrophoneOn(next);
    s.setMicrophoneDailycoOn(next);
    DailyService.getInstance().callObject.setLocalAudio(next);
  }, []);

  // Overrides the store's own setCamera/setMicrophone/setSpeaker (still
  // spread in via ...store below) -- picking a device in the settings modal
  // must also swap the live Daily call's actual track/output, not just this
  // app's own record of which device is selected, or the choice never
  // reaches the remote participant.
  const setCamera = useCallback((deviceId: string) => {
    useDevicesStore.getState().setCamera(deviceId);
    DailyService.getInstance().setInputDevices({ videoDeviceId: deviceId });
  }, []);

  const setMicrophone = useCallback((deviceId: string) => {
    useDevicesStore.getState().setMicrophone(deviceId);
    DailyService.getInstance().setInputDevices({ audioDeviceId: deviceId });
  }, []);

  const setSpeaker = useCallback((deviceId: string) => {
    useDevicesStore.getState().setSpeaker(deviceId);
    DailyService.getInstance().setOutputDevice(deviceId);
  }, []);

  const populateDevices = useCallback(async (stream?: MediaStream) => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const s = useDevicesStore.getState();

    const videoInputs = devices
      .filter((d) => d.kind === "videoinput" && d.deviceId)
      .map((d) => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 5)}` }));

    const audioInputs = devices
      .filter((d) => d.kind === "audioinput" && d.deviceId)
      .map((d) => ({ deviceId: d.deviceId, label: d.label || `Mic ${d.deviceId.slice(0, 5)}` }));

    const audioOutputs = devices
      .filter((d) => d.kind === "audiooutput" && d.deviceId)
      .map((d) => ({ deviceId: d.deviceId, label: d.label || `Speaker ${d.deviceId.slice(0, 5)}` }));

    s.setDetectedCameras(videoInputs);
    s.setDetectedMicrophones(audioInputs);
    s.setDetectedSpeakers(audioOutputs);

    if (videoInputs.length && !s.camera) {
      // enumerateDevices() order isn't guaranteed to put the front camera
      // first on mobile -- when `stream` came from a facingMode:'user'
      // request (see requestCamera/onPermissionChange below), the browser
      // already resolved it to the front-facing device, so trust that over
      // list order.
      const facingUserDeviceId = stream?.getVideoTracks()[0]?.getSettings().deviceId;
      const defaultCamera = videoInputs.find((c) => c.deviceId === facingUserDeviceId) ?? videoInputs[0];
      s.setCamera(defaultCamera.deviceId);
    }
    if (audioInputs.length && !s.microphone) s.setMicrophone(audioInputs[0].deviceId);
    if (audioOutputs.length && !s.speaker) s.setSpeaker(audioOutputs[0].deviceId);

    if (stream) stream.getTracks().forEach((t) => t.stop());
  }, []);

  const syncPermissions = useCallback(async () => {
    const [cam, mic] = await Promise.all([
      queryPermission("camera"),
      queryPermission("microphone"),
    ]);
    const s = useDevicesStore.getState();
    s.setCameraPermission(cam);
    s.setMicPermission(mic);
    return { cam, mic };
  }, []);

  const requestCamera = useCallback(async () => {
    const perms = await syncPermissions();
    if (perms.cam === "denied") return "denied" as const;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      await populateDevices(stream);
      await syncPermissions();
      return "granted" as const;
    } catch {
      await syncPermissions();
      return "denied" as const;
    }
  }, [populateDevices, syncPermissions]);

  const requestMicrophone = useCallback(async () => {
    const perms = await syncPermissions();
    if (perms.mic === "denied") return "denied" as const;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await populateDevices(stream);
      await syncPermissions();
      return "granted" as const;
    } catch {
      await syncPermissions();
      return "denied" as const;
    }
  }, [populateDevices, syncPermissions]);

  useEffect(() => {
    const cleanups: (() => void)[] = [];

    async function onPermissionChange() {
      const perms = await syncPermissions();
      if (perms.cam === "granted" || perms.mic === "granted") {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: perms.cam === "granted" ? { facingMode: "user" } : false,
            audio: perms.mic === "granted",
          });
          await populateDevices(stream);
        } catch {
          await populateDevices();
        }
      }
    }

    async function watchPermission(name: "camera" | "microphone") {
      try {
        const status = await navigator.permissions.query({ name: name as PermissionName });
        const handler = () => { onPermissionChange(); };
        status.addEventListener("change", handler);
        cleanups.push(() => status.removeEventListener("change", handler));
      } catch {
        // browser doesn't support querying this permission
      }
    }

    // Not just syncPermissions() -- if camera/mic permission was already
    // granted in a previous session, no "change" event ever fires for it
    // (that only fires on a future flip), so onPermissionChange must run
    // once up front too or populateDevices() never runs and the device
    // lists stay empty until something else (a manual request, a
    // devicechange) happens to trigger it.
    onPermissionChange();
    watchPermission("camera");
    watchPermission("microphone");

    const onDeviceChange = () => {
      syncPermissions().then(() => populateDevices());
    };
    navigator.mediaDevices.addEventListener("devicechange", onDeviceChange);
    cleanups.push(() => navigator.mediaDevices.removeEventListener("devicechange", onDeviceChange));

    return () => cleanups.forEach((fn) => fn());
  }, [populateDevices, syncPermissions]);

  return {
    ...store,
    toggleCamera,
    toggleMicrophone,
    toggleCameraDailyco,
    toggleMicrophoneDailyco,
    requestCamera,
    requestMicrophone,
    setCamera,
    setMicrophone,
    setSpeaker,
  };
}
