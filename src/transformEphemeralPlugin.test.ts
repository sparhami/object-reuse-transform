import { BabelFileResult, transformAsync } from "@babel/core";
import { promises as fs } from "fs";

import { transformEphemeralPlugin } from "./transformEphemeralPlugin";

function transformFile(buffer: Buffer): Promise<BabelFileResult | null> {
  return transformAsync(buffer.toString(), {
    plugins: [transformEphemeralPlugin],
    filename: "test.js",
    configFile: "babel-empty.config.json",
  });
}

describe("transformEphemeralPlugin", () => {
  let consoleErrorSpy: jest.SpyInstance<
    void,
    [message?: any, ...optionalParams: any[]],
    any
  >;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error");
    consoleErrorSpy.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("incorrect usage", () => {
    test("it should error log on a non-object literal argument", async () => {
      const buf = await fs.readFile("src/fixtures/nonObjectLiteralArgument.js");
      const res = await transformFile(buf);

      expect(res?.code).toMatchInlineSnapshot(`
    "import { ephemeral } from "../ephemeral.js";
    export function fn(arg) {
      const obj = {
        foo: 2
      };
      return ephemeral(obj);
    }"
    `);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "undefined - 7:9 ephmemeral() should have exactly 1 argument, consisting of an object literal."
      );
    });

    test("it should error log on spread properties", async () => {
      const buf = await fs.readFile("src/fixtures/spreadProperties.js");
      const res = await transformFile(buf);

      expect(res?.code).toMatchInlineSnapshot(`
"import { ephemeral } from "../ephemeral.js";
export function fn(arg) {
  return ephemeral({
    foo: 2,
    ...arg
  });
}"
`);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "undefined - 4:9 ephmemeral() should be called with an object without methods or spread values."
      );
    });

    // Should either report an error or clear all properties in the object when
    // using computed keys.
    // Should also make keys non-enumerable.
    test.skip("it should error log on computed property names", async () => {
      const buf = await fs.readFile("src/fixtures/computedPropertyNames.js");
      const res = await transformFile(buf);

      expect(res?.code).toMatchInlineSnapshot();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  test("direct return", async () => {
    const buf = await fs.readFile("src/fixtures/directReturn.js");
    const res = await transformFile(buf);

    expect(res?.code).toMatchInlineSnapshot(`
"import { ephemeral } from "../ephemeral.js";
let idGen = 0;
const _genEphemeralObj0 = {
  foo: void 0,
  moo: void 0
};
export function fn(arg) {
  _genEphemeralObj0.foo = arg
  _genEphemeralObj0.moo = \`thing\${idGen++}\`
  return _genEphemeralObj0;
}"
`);
  });

  test("variable", async () => {
    const buf = await fs.readFile("src/fixtures/variable.js");
    const res = await transformFile(buf);

    expect(res?.code).toMatchInlineSnapshot(`
"import { ephemeral } from "../ephemeral";
const _genEphemeralObj0 = {
  foo: void 0
};
export function fn(arg) {
  _genEphemeralObj0.foo = 2
  const val = _genEphemeralObj0;
  console.log(val);
  return val;
}"
`);
  });

  test("multiple uses", async () => {
    const buf = await fs.readFile("src/fixtures/multipleUses.js");
    const res = await transformFile(buf);

    expect(res?.code).toMatchInlineSnapshot(`
"import { ephemeral } from "../ephemeral.js";
const _genEphemeralObj0 = {
  foo: void 0
};
const _genEphemeralObj1 = {
  foo: void 0
};
export function fn(arg) {
  if (arg <= 0) {
    _genEphemeralObj0.foo = 0
    return _genEphemeralObj0;
  }
  _genEphemeralObj1.foo = arg
  return _genEphemeralObj1;
}"
`);
  });

  test("subproperty", async () => {
    const buf = await fs.readFile("src/fixtures/subproperty.js");
    const res = await transformFile(buf);

    expect(res?.code).toMatchInlineSnapshot(`
"import { ephemeral } from "../ephemeral.js";
const _genEphemeralObj0 = {
  foo: void 0,
  moo: void 0
};
const _genEphemeralObj1 = {
  bar: void 0
};
export function fn(arg) {
  _genEphemeralObj1.bar = "test"
  {
    _genEphemeralObj0.foo = arg
    _genEphemeralObj0.moo = _genEphemeralObj1
    return _genEphemeralObj0;
  }
}"
`);
  });
});
