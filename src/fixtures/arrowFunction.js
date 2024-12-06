import { ephemeral } from "../ephemeral.js";

export const fn = (arg) => {
  return ephemeral({ foo: arg });
};
