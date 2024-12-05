// TODO: FIX: should reject this

import { ephemeral } from "../ephemeral.js";

export function hasComputedPropertyName(arg) {
  const computed = "key";

  return ephemeral({ [computed]: 2 });
}
