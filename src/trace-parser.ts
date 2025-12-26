import { CheckExpression } from "./types";

export function parse(file: any): [CheckExpression[], Error | undefined] {
  if (!Array.isArray(file)) {
    const err = new Error("File is not an array of traces");
    return [[], err];
  }
  const expressions = file.filter((val) => {
    return val?.name === "checkExpression";
  }) as CheckExpression[];
  return [expressions, undefined];
}
