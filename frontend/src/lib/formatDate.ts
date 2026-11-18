const accraTimezone = "Africa/Accra";

function getOrdinalDay(day: number) {
  const lastTwoDigits = day % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

export function formatDate(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const day = new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    timeZone: accraTimezone,
  }).format(date);
  const monthAndYear = new Intl.DateTimeFormat("en-GH", {
    month: "long",
    year: "numeric",
    timeZone: accraTimezone,
  }).format(date);
  return `${getOrdinalDay(Number(day))} ${monthAndYear}`;
}

export function formatDateTime(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const day = new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    timeZone: accraTimezone,
  }).format(date);
  const dateAndTime = new Intl.DateTimeFormat("en-GH", {
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: accraTimezone,
  }).format(date);
  return `${getOrdinalDay(Number(day))} ${dateAndTime}`;
}
