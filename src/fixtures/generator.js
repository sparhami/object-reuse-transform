import { ephemeral } from "../ephemeral.js";

export function* fn(arg) {
  for (let i = 0; i < 5; i++) {
    yield ephemeral({ count: i });
  }
}
