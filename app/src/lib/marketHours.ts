/** NYSE regular session: Mon–Fri 09:30–16:00 America/New_York. */
export function getMarketStatus(): { open: boolean; label: string } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const weekday = get('weekday');
  const hour = parseInt(get('hour'), 10) % 24;
  const minute = parseInt(get('minute'), 10);
  const weekend = weekday === 'Sat' || weekday === 'Sun';
  const mins = hour * 60 + minute;
  const open = !weekend && mins >= 9 * 60 + 30 && mins < 16 * 60;
  return { open, label: open ? 'NYSE OPEN' : 'AFTER HOURS' };
}
