import { ephemeral } from "../ephemeral.js";

export function fn(arg) {
  if (arg <= 0) {
    return ephemeral({ foo: 0 });
  }

  return ephemeral({ foo: arg });
}
