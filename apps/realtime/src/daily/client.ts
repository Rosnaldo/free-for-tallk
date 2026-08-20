import properties from '#properties';

// Requires enable_dialout on the room and dial-out approved on the Daily
// account. displayName is what shows up as user_name on the participant.joined
// webhook, so it must match the "customer" tag daily_handlers.ts looks for --
// the same mechanism already used to detect a browser join.
export async function startDialOut(roomName: string, phoneNumber: string, displayName: string): Promise<void> {
  const response = await fetch(`${properties.dailyApiUrl}/rooms/${roomName}/dialOut/start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${properties.dailyApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ phoneNumber, displayName }),
  });

  if (!response.ok) {
    throw new Error(`failed to start dial-out: ${response.status} ${response.statusText}`);
  }
}
