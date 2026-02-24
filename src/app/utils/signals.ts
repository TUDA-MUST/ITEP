import { type Signal, computed } from '@angular/core';

export const nonNullableSignal = <T>(source: Signal<T | undefined>, fallback?: T): Signal<T> =>
    computed(() => {
      const val = source();
      if (val === undefined) {
        if (fallback !== undefined) return fallback;
        throw new Error('Signal is undefined');
      }
      return val;
});