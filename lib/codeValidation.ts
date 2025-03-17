import * as acorn from "acorn"
import * as walk from "acorn-walk"

const FORBIDDEN_IDENTIFIERS = ["supabase", "wallet", "fetch", "XMLHttpRequest", "WebSocket", "eval", "Function"]
const MAX_CODE_SIZE = 1024 * 1024 // 1 MB

function checkRequiredGameStructure(ast: any): boolean {
  let hasInit = false
  let hasStart = false
  let hasUpdate = false
  let hasDraw = false
  let hasHandleInput = false
  let hasGetScore = false

  walk.simple(ast, {
    FunctionDeclaration(node: any) {
      switch (node.id.name) {
        case "init":
          hasInit = true
          break
        case "start":
          hasStart = true
          break
        case "update":
          hasUpdate = true
          break
        case "draw":
          hasDraw = true
          break
        case "handleInput":
          hasHandleInput = true
          break
        case "getScore":
          hasGetScore = true
          break
      }
    },
    VariableDeclarator(node: any) {
      if (node.init && node.init.type === "FunctionExpression" && node.id.name) {
        switch (node.id.name) {
          case "init":
            hasInit = true
            break
          case "start":
            hasStart = true
            break
          case "update":
            hasUpdate = true
            break
          case "draw":
            hasDraw = true
            break
          case "handleInput":
            hasHandleInput = true
            break
          case "getScore":
            hasGetScore = true
            break
        }
      }
    },
  })

  return hasInit && hasStart && hasUpdate && hasDraw && hasHandleInput && hasGetScore
}

export function validateGameCode(code: string): { isValid: boolean; error?: string } {
  if (code.length > MAX_CODE_SIZE) {
    return { isValid: false, error: `Code exceeds maximum size of ${MAX_CODE_SIZE} bytes` }
  }

  try {
    const ast = acorn.parse(code, { ecmaVersion: 2020 })
    let hasForbiddenIdentifiers = false

    walk.simple(ast, {
      Identifier(node: any) {
        if (FORBIDDEN_IDENTIFIERS.includes(node.name)) {
          hasForbiddenIdentifiers = true
        }
      },
    })

    if (hasForbiddenIdentifiers) {
      return { isValid: false, error: "Code contains forbidden identifiers or operations" }
    }

    if (!checkRequiredGameStructure(ast)) {
      return {
        isValid: false,
        error:
          "Code is missing required game structure (init, start, update, draw, handleInput, and getScore functions)",
      }
    }

    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: `Invalid JavaScript: ${error.message}` }
  }
}

