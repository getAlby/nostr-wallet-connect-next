export const asyncTimeout = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
