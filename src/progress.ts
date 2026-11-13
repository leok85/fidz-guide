import { useSyncExternalStore } from 'react';

/** Progresso por demo, guardado só no navegador de quem assiste. */
export type DemoProgress = { step: number; done: boolean };
type Store = Record<string, DemoProgress>;

const KEY = 'fidz-guide:progress';
const EVENT = 'fidz-guide:progress';
let cache: Store | null = null;

function read(): Store {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Store;
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: Store) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* armazenamento indisponível: o progresso vale só nesta aba */ }
  window.dispatchEvent(new Event(EVENT));
}

export function saveProgress(demoId: string, step: number, done: boolean) {
  const store = read();
  const prev = store[demoId];
  const nextDone = done || !!prev?.done;
  if (prev && prev.step === step && prev.done === nextDone) return;
  write({ ...store, [demoId]: { step, done: nextDone } });
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) { cache = null; cb(); }
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', onStorage);
  };
}

export function useProgress(): Store {
  return useSyncExternalStore(subscribe, read, () => ({}));
}
