import { ephemeral } from "../ephemeral.js";

export function fn(arg) {
  return ephemeral({
    [arg]: 2,
  });
}
