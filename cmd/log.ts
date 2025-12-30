import { debuglog } from "util";
const log = debuglog("type-doctor");

export const logger = {
  debug: (message: string) => log(message),
  errorAndFail: (message: string) => {
    console.error(message);
    process.exit(1);
  },
  error: console.error,
  warn: console.warn,
};
