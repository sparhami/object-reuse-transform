const brand = Symbol("brand");

type Ephemeral<Object> = Readonly<Object> & {
  [brand]: 1;
};

export function ephemeral<T>(obj: T) {
  return Object.freeze(obj) as Ephemeral<T>;
}
