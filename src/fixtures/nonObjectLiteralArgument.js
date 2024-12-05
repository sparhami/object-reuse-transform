import { ephemeral } from "../ephemeral.js";

export function fn(arg) {
  const obj = {
    foo: 2,
  };
  return ephemeral(obj);
}
