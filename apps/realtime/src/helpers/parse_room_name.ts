export function parseRoomName(room: string): { customerSlug: string; volunteerSlug: string } | null {
    const parts = room.split('--');
    if (parts.length !== 2) return null;
    return { customerSlug: parts[0], volunteerSlug: parts[1] };
}
