import { test, expect } from "bun:test";
import { maxDurationRule, report } from "../../lib/diagnostics";
import { Span } from "../../lib/types";

/**
 * Helper to create a mock Node (CheckExpression) for testing
 */
function createCheckExpressionNode(
  dur: number,
  path: string = "test.ts",
  pos: number = 0,
  end: number = 10,
): Span {
  return {
    pid: 1,
    tid: 1,
    ph: "X",
    cat: "check",
    ts: 0,
    name: "checkExpression",
    dur, // duration in microseconds
    args: {
      kind: 0,
      pos,
      end,
      path,
    },
  };
}

// maxDurationRule tests
test("maxDurationRule - creates a rule with correct properties", () => {
  const rule = maxDurationRule({ warn: 100, error: 1000 });
  expect(rule.name).toBe("maxDuration");
  expect(rule.errorMessage).toBe("Expression exceeds max duration of 1000ms");
  expect(rule.warnMessage).toBe("Expression exceeds warn duration of 100ms");
  expect(typeof rule.apply).toBe("function");
});

test("maxDurationRule - apply returns warn when duration is between warn and error thresholds", () => {
  const rule = maxDurationRule({ warn: 100, error: 1000 });
  const node = createCheckExpressionNode(500000); // 500ms in microseconds
  expect(rule.apply(node)).toBe("warn");
});

test("maxDurationRule - apply return warn when duration equals threshold", () => {
  const rule = maxDurationRule({ warn: 100, error: 1000 });
  const node = createCheckExpressionNode(1000000); // exactly 1000ms in microseconds
  expect(rule.apply(node)).toBe("warn");
});

test("maxDurationRule - apply returns true when duration exceeds threshold", () => {
  const rule = maxDurationRule({ warn: 100, error: 1000 });
  const node = createCheckExpressionNode(1500000); // 1500ms in microseconds
  expect(rule.apply(node)).toBe("error");
});

test("maxDurationRule - apply handles small threshold values", () => {
  const rule = maxDurationRule({ warn: 10, error: 100 });
  const nodeBelow = createCheckExpressionNode(5000); // 5ms in microseconds
  const nodeAbove = createCheckExpressionNode(15000); // 15ms in microseconds

  expect(rule.apply(nodeBelow)).toBe("none");
  expect(rule.apply(nodeAbove)).toBe("warn");
});

test("report - returns empty array when no expressions violate the rule", () => {
  const rule = maxDurationRule({ warn: 1000, error: 2000 });
  const expressions = [
    createCheckExpressionNode(500000), // 500ms
    createCheckExpressionNode(800000), // 800ms
    createCheckExpressionNode(900000), // 900ms
  ];

  const diagnostics = report(expressions, [rule]);
  // Filter out "none" level diagnostics since they don't violate the rule
  const violations = diagnostics.filter((d) => d.level !== "none");
  expect(violations).toEqual([]);
});

test("report - returns diagnostics for expressions that exceed threshold", () => {
  const rule = maxDurationRule({ warn: 1000, error: 2000 });
  const expressions = [
    createCheckExpressionNode(500000), // 500ms - should pass
    createCheckExpressionNode(1500000), // 1500ms - should warn
    createCheckExpressionNode(2500000), // 2500ms - should error
  ];

  const diagnostics = report(expressions, [rule]);
  // Filter out "none" level diagnostics
  const violations = diagnostics.filter((d) => d.level !== "none");
  expect(violations).toHaveLength(2);
  expect(violations[0].span).toBe(expressions[1]);
  expect(violations[0].rule).toBe(rule);
  expect(violations[0].level).toBe("warn");
  expect(violations[1].span).toBe(expressions[2]);
  expect(violations[1].rule).toBe(rule);
  expect(violations[1].level).toBe("error");
});

test("report - handles all expressions exceeding threshold", () => {
  const rule = maxDurationRule({ warn: 1000, error: 2000 });
  const expressions = [
    createCheckExpressionNode(2500000), // 2500ms - exceeds error threshold
    createCheckExpressionNode(3000000), // 3000ms - exceeds error threshold
    createCheckExpressionNode(4000000), // 4000ms - exceeds error threshold
  ];

  const diagnostics = report(expressions, [rule]);
  // Filter out "none" level diagnostics
  const violations = diagnostics.filter((d) => d.level !== "none");
  expect(violations).toHaveLength(3);
  violations.forEach((diagnostic, index) => {
    expect(diagnostic.span).toBe(expressions[index]);
    expect(diagnostic.rule).toBe(rule);
    expect(diagnostic.level).toBe("error");
  });
});

test("report - handles empty expressions array", () => {
  const rule = maxDurationRule({ warn: 1000, error: 2000 });
  const diagnostics = report([], [rule]);
  expect(diagnostics).toEqual([]);
});
