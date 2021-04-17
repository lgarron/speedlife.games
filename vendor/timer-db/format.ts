export function formatTime(
  ms: number,
  decimalDigits: 0 | 1 | 2 | 3 = 2
): string {
  var hours = Math.floor(ms / (60 * 60 * 1000));
  var minutes = Math.floor(ms / (60 * 1000)) % 60;
  var seconds = Math.floor(ms / 1000) % 60;
  var ms = Math.floor(ms % 1000);

  let preDecimal: string;
  if (hours > 0) {
    preDecimal = [
      hours.toString(),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");
  } else if (minutes > 0) {
    preDecimal = [minutes.toString(), seconds.toString().padStart(2, "0")].join(
      ":"
    );
  } else {
    preDecimal = seconds.toString();
  }

  if (decimalDigits === 0) {
    return preDecimal;
  }

  return [
    preDecimal,
    ms.toString().padStart(3, "0").slice(0, decimalDigits),
  ].join(".");
}
