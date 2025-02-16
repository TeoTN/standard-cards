export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

export const getDeferred = <T>(): Deferred<T> => {
  const deferred: Partial<Deferred<T>> = {};
  deferred.promise = new Promise<T>((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred as Deferred<T>;
};