type Fn<A, B> = (a: A) => B;

export function pipe<T>(value: T) {
  function* apply(fns: Fn<any, any>[]) {
    let current: any = value;
    for (const fn of fns) {
      current = fn(current);
      yield current;
    }
  }

  return {
    to<R>(...fns: Fn<any, any>[]): R {
      let result: any = value;
      for (const v of apply(fns)) {
        result = v;
      }
      return result as R;
    },
  };
}
