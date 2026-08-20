import { OnlineUser } from "@repo/shared-types";

export const getInitials = (name?: string): string => {
  if (!name) return 'VC';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export function generateRoomName(): string {
  const segment = (len: number) => {
    let text = "";
    const possible = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < len; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };
  return `call-${segment(8)}`;
}
