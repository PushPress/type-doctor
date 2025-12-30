import { test, expect } from "bun:test";
import { maxDurationRule, report } from "../../lib/diagnostics";
import { Node } from "../../lib/types";

/**
 * Helper to create a mock Node (CheckExpression) for testing
 */
function createCheckExpressionNode(
  dur: number,
  path: string = "test.ts",
  pos: number = 0,
  end: number = 10,
): Node {
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
  const rule = maxDurationRule(1000);
  expect(rule.name).toBe("maxDuration");
  expect(rule.kind).toBe("error");
  expect(rule.duration).toBe(1000);
  expect(rule.errorMessage).toBe("Expression exceeds max duration of 1000ms");
  expect(typeof rule.apply).toBe("function");
});

test("maxDurationRule - apply returns false when duration is below threshold", () => {
  const rule = maxDurationRule(1000); // 1000ms threshold
  const node = createCheckExpressionNode(500000); // 500ms in microseconds
  expect(rule.apply(node)).toBe(false);
});

test("maxDurationRule - apply returns false when duration equals threshold", () => {
  const rule = maxDurationRule(1000); // 1000ms threshold
  const node = createCheckExpressionNode(1000000); // exactly 1000ms in microseconds
  expect(rule.apply(node)).toBe(false);
});

test("maxDurationRule - apply returns true when duration exceeds threshold", () => {
  const rule = maxDurationRule(1000); // 1000ms threshold
  const node = createCheckExpressionNode(1500000); // 1500ms in microseconds
  expect(rule.apply(node)).toBe(true);
});

test("maxDurationRule - apply handles small threshold values", () => {
  const rule = maxDurationRule(10); // 10ms threshold
  const nodeBelow = createCheckExpressionNode(5000); // 5ms in microseconds
  const nodeAbove = createCheckExpressionNode(15000); // 15ms in microseconds

  expect(rule.apply(nodeBelow)).toBe(false);
  expect(rule.apply(nodeAbove)).toBe(true);
});

test("maxDurationRule - apply handles large threshold values", () => {
  const rule = maxDurationRule(5000); // 5000ms threshold
  const nodeBelow = createCheckExpressionNode(3000000); // 3000ms in microseconds
  const nodeAbove = createCheckExpressionNode(6000000); // 6000ms in microseconds

  expect(rule.apply(nodeBelow)).toBe(false);
  expect(rule.apply(nodeAbove)).toBe(true);
});

test("maxDurationRule - apply handles zero duration", () => {
  const rule = maxDurationRule(1000);
  const node = createCheckExpressionNode(0);
  expect(rule.apply(node)).toBe(false);
});

test("maxDurationRule - error message includes correct duration", () => {
  const rule1 = maxDurationRule(50);
  expect(rule1.errorMessage).toBe("Expression exceeds max duration of 50ms");

  const rule2 = maxDurationRule(2500);
  expect(rule2.errorMessage).toBe("Expression exceeds max duration of 2500ms");
});

test("report - returns empty array when no expressions violate the rule", () => {
  const rule = maxDurationRule(1000);
  const expressions = [
    createCheckExpressionNode(500000), // 500ms
    createCheckExpressionNode(800000), // 800ms
    createCheckExpressionNode(900000), // 900ms
  ];

  const diagnostics = report(expressions, [rule]);
  expect(diagnostics).toEqual([]);
});

test("report - returns diagnostics for expressions that exceed threshold", () => {
  const rule = maxDurationRule(1000);
  const expressions = [
    createCheckExpressionNode(500000), // 500ms - should pass
    createCheckExpressionNode(1500000), // 1500ms - should fail
    createCheckExpressionNode(2000000), // 2000ms - should fail
  ];

  const diagnostics = report(expressions, [rule]);
  expect(diagnostics).toHaveLength(2);
  expect(diagnostics[0].node).toBe(expressions[1]);
  expect(diagnostics[0].rule).toBe(rule);
  expect(diagnostics[1].node).toBe(expressions[2]);
  expect(diagnostics[1].rule).toBe(rule);
});

test("report - handles all expressions exceeding threshold", () => {
  const rule = maxDurationRule(1000);
  const expressions = [
    createCheckExpressionNode(2000000), // 2000ms
    createCheckExpressionNode(3000000), // 3000ms
    createCheckExpressionNode(4000000), // 4000ms
  ];

  const diagnostics = report(expressions, [rule]);
  expect(diagnostics).toHaveLength(3);
  diagnostics.forEach((diagnostic, index) => {
    expect(diagnostic.node).toBe(expressions[index]);
    expect(diagnostic.rule).toBe(rule);
  });
});

test("report - handles empty expressions array", () => {
  const rule = maxDurationRule(1000);
  const diagnostics = report([], [rule]);
  expect(diagnostics).toEqual([]);
});
