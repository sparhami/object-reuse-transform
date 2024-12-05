import { ephemeral } from "../ephemeral.js";

let idGen = 0;

export function fn(arg) {
  return ephemeral({ foo: arg, moo: `thing${idGen++}` });
}
