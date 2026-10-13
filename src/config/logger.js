export const logger = Object.freeze({
  info: (message, details = {}) => console.info(JSON.stringify({ level: 'info', message, ...details })),
  error: (message, details = {}) => console.error(JSON.stringify({ level: 'error', message, ...details })),
});
