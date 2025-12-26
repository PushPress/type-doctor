export interface CheckExpression {
  pid: number;
  tid: number;
  ph: string;
  cat: "check";
  ts: number;
  name: "checkExpression";
  /** milliseconds */
  dur: number;
  args: {
    kind: number;
    pos: number;
    end: number;
    path: string;
  };
}

export type Node = CheckExpression;
