/**
 * Returns the first value that is not `undefined`.
 *
 * This preserves falsy values such as `""` or `0`, which is useful when the
 * portal payload intentionally uses them to signal "present but empty".
 */
export function firstDefined<T>(
  ...values: Array<T | undefined>
): T | undefined {
  return values.find((value) => value !== undefined);
}
