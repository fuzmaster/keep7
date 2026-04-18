/**
 * Concurrent image preload queue. Limits parallel requests
 * to prevent network thrashing on rapid-fire interactions.
 */

const MAX_CONCURRENT = 4;

let active = 0;
const queue: (() => void)[] = [];

function next(): void {
  if (queue.length === 0 || active >= MAX_CONCURRENT) return;
  active++;
  const run = queue.shift()!;
  run();
}

function done(): void {
  active--;
  next();
}

export function preloadImage(src: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    queue.push(() => {
      const img = new Image();
      img.onload = () => { done(); resolve(); };
      img.onerror = () => { done(); reject(new Error(`Failed: ${src}`)); };
      img.src = src;
    });
    next();
  });
}

export function preloadImages(srcs: string[]): Promise<PromiseSettledResult<void>[]> {
  return Promise.allSettled(srcs.map(preloadImage));
}
