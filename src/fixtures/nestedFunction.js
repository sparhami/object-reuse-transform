import { ephemeral } from "../ephemeral.js";

export function fn(arg) {
  return function inner(innerArg) {
    return ephemeral({ foo: innerArg });
  };
}
