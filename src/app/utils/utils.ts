export const diff = <T>(previous: readonly T[], next: readonly T[]) => ({
  added: next.filter((val) => !previous.includes(val)),
  removed: previous.filter((val) => !next.includes(val)),
});
