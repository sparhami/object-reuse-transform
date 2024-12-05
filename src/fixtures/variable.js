import { ephemeral } from "../ephemeral";

export function fn(arg) {
  const val = ephemeral({ foo: 2 });
  console.log(val);
  return val;
}
