// sample.ts

// Simple interface
interface User {
  id: number;
  name: string;
  email?: string;
}

// Union + literal types
type Status = "active" | "inactive";

// Generic function
function identity<T>(value: T): T {
  return value;
}

// Function with control-flow narrowing
function formatUser(user: User, status: Status): string {
  if (status === "active") {
    // user.email is optional, so this requires narrowing
    return `${user.name} (${user.email ?? "no email"})`;
  }

  return user.name;
}

// Type inference + object literal checking
const user = {
  id: 1,
  name: "Ian",
};

// Excess property checks happen here
const formatted = formatUser(user, "active");

// Generic instantiation
const id = identity(123);

// Union narrowing
function parse(input: string | number): number {
  if (typeof input === "string") {
    return input.length;
  }
  return input;
}

parse("hello");
parse(42);
