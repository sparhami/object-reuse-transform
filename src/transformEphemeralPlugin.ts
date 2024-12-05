import type { Node, NodePath, Visitor } from "@babel/traverse";
import type * as BabelTypes from "@babel/types";

let idGenWeakMap = new WeakMap<any, number>();

function getTempVarName(scope: NodePath<Node>) {
  const id = idGenWeakMap.get(scope) ?? 0;
  const name = `_genEphemeralObj${id}`;

  idGenWeakMap.set(scope, id + 1);

  return name;
}

export function transformEphemeralPlugin({
  types: t,
}: {
  types: typeof BabelTypes;
}) {
  function getParentOfType(
    path: NodePath<Node>,
    matches: (path: Node) => boolean
  ) {
    const { parentPath } = path.context;

    if (matches(parentPath as Node)) {
      return parentPath;
    }

    return getParentOfType(parentPath, matches);
  }

  function getFunctionParent(path: NodePath<Node>) {
    return getParentOfType(path, t.isFunctionDeclaration);
  }

  function getStatementParent(path: NodePath<Node>) {
    return getParentOfType(path, t.isStatement);
  }

  function getSourceLocationString(path: NodePath<Node>) {
    const { node } = path;

    return `${node.loc?.filename} - ${node.loc?.start?.line}:${node.loc?.start?.column}`;
  }

  function reportError(path: NodePath<Node>, message: string) {
    console.error(`${getSourceLocationString(path)} ${message}`);
  }

  const visitor: Visitor = {
    CallExpression: {
      enter(path) {
        const { node } = path;
        if (!t.isCallExpression(node) || !t.isIdentifier(node.callee)) {
          return;
        }

        if (node.callee.name !== "ephemeral") {
          return;
        }

        const [arg] = node.arguments;
        if (node.arguments.length !== 1 || arg.type !== "ObjectExpression") {
          reportError(
            path,
            "ephmemeral() should have exactly 1 argument, consisting of an object literal."
          );
          return;
        }

        if (!arg.properties.every((p) => t.isObjectProperty(p))) {
          reportError(
            path,
            "ephmemeral() should be called with an object without methods or spread values."
          );
          return;
        }

        if (!arg.properties.every((p) => t.isIdentifier(p.key))) {
          reportError(
            path,
            "ephmemeral() should be called with an object with only plain keys."
          );
          return;
        }

        // Get the function that is the parent of our emphemeral statement.
        const functionParent = getFunctionParent(path);

        // The name for the declaration of the ephemeral variable.
        const declName = t.identifier(getTempVarName(functionParent));

        /*
         * Create the ephemeral declaration as a const before the containing
         * function. This looks like:
         *
         * const _genEphemeralObj0 = {
         *   foo: void 0,
         *   bar: void 0
         * };
         */
        {
          // Get the props to initialize to undefined.
          const initialEphemeralProps = arg.properties.map((prop) => {
            if (!t.isIdentifier(prop.key)) {
              throw new Error("Unexpected type for object key.");
            }

            return t.objectProperty(
              t.identifier(prop.key.name),
              // @ts-ignore-next-line
              t.buildUndefinedNode()
            );
          });
          // Create the emphemeral declaration.
          const variableDeclaration = t.variableDeclaration("const", [
            t.variableDeclarator(
              declName,
              t.objectExpression(initialEphemeralProps)
            ),
          ]);

          // And insert it before the function.
          functionParent.insertBefore(variableDeclaration);
        }

        // Create the code to update the ephemeral object.
        // Something like:
        //   _genEphemeralObj0.foo = 1
        //   _genEphemeralObj0.bar = "str"
        {
          const statementParent = getStatementParent(path);
          const propUpdateExpressions = arg.properties.map((prop) => {
            return t.assignmentExpression(
              "=",
              t.memberExpression(declName, prop.key),
              prop.value as BabelTypes.Expression
            );
          });

          // And insert it.
          statementParent.insertBefore(propUpdateExpressions);
        }

        // Finally, use the ephemeral object instead of the call expression.
        {
          path.replaceWith(t.expressionStatement(declName));
        }
      },
    },
  };

  return {
    visitor,
  };
}
