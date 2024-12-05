import { ephemeral } from "../ephemeral.js";

export function fn(arg) {
  return ephemeral({
    foo: 2,
    ...arg,
  });
}
