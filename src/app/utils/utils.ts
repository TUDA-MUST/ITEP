export const diff = (previous: readonly any[], next: readonly any[]) => ({
  added: next.filter((val) => !previous.includes(val)),
  removed: previous.filter((val) => !next.includes(val)),
});
