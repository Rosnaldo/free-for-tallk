import properties from '#properties';

export async function ejectBothParticipantsFromRoom(roomName: string, userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;

  const response = await fetch(`${properties.dailyApiUrl}/rooms/${roomName}/eject`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${properties.dailyApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ user_ids: userIds }),
  });

  if (!response.ok) {
    throw new Error(`failed to eject participants from daily room: ${response.status} ${response.statusText}`);
  }
}
