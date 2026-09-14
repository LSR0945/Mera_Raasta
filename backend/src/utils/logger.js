const noop = () => {};
const format = (msg) => `[${new Date().toISOString()}] ${msg}`;

export const logger = {
  info: (msg) => console.log(format(msg)),
  warn: (msg) => console.warn(format(msg)),
  error: (msg) => console.error(format(msg)),
  debug: noop,
};
