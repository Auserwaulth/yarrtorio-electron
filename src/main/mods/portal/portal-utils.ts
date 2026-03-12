export function firstDefined<T>(
  ...values: Array<T | undefined>
): T | undefined {
  return values.find((value) => value !== undefined);
}
