const SAO_PAULO_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC-3, fixed (Brazil abolished DST in 2019)

// Shifts a real UTC instant so that reading its own UTC getters
// (toISOString/getUTCFullYear/etc.) yields São Paulo wall-clock values --
// lets UTC-based date-string/day-boundary math operate on São Paulo
// calendar days without a timezone library.
export function toSaoPauloWallClock(d: Date): Date {
    return new Date(d.getTime() - SAO_PAULO_OFFSET_MS);
}
