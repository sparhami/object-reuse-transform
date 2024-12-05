import { ephemeral } from "../ephemeral.js";

export function fn(arg) {
  return ephemeral({ foo: arg, moo: ephemeral({ bar: "test" }) });
}
