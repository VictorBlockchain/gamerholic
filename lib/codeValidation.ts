import * as acorn from "acorn"

const FORBIDDEN_IDENTIFIERS = ["supabase", "wallet", "fetch", "XMLHttpRequest", "WebSocket", "eval", "Function"]
const MAX_CODE_SIZE = 1024 * 1024 // 1 MB

function checkRequiredGameStructure(ast: any): boolean {
  let hasEndGame = false
  let hasSubmitScore = false

  acorn.walk.simple(ast, {
    FunctionDeclaration(node: any) {
      if (node.id.name === "endGame") {
        hasEndGame = true
      } else if (node.id.name === "submitScore") {
        hasSubmitScore = true
      }
    },
    FunctionExpression(node: any) {
      if (node.id && node.id.name === "endGame") {
        hasEndGame = true
      } else if (node.id && node.id.name === "submitScore") {
        hasSubmitScore = true
      }
    },
    ArrowFunctionExpression(node: any) {
      if (node.parent && node.parent.id && node.parent.id.name === "endGame") {
        hasEndGame = true
      } else if (node.parent && node.parent.id && node.parent.id.name === "submitScore") {
        hasSubmitScore = true
      }
    },
  })

  return hasEndGame && hasSubmitScore
}

export function validateGameCode(code: string): { isValid: boolean; error?: string } {
  if (code.length > MAX_CODE_SIZE) {
    return { isValid: false, error: `Code exceeds maximum size of ${MAX_CODE_SIZE} bytes` }
  }

  try {
    const ast = acorn.parse(code, { ecmaVersion: 2020 })
    let hasForbiddenIdentifiers = false

    acorn.walk.simple(ast, {
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
      return { isValid: false, error: "Code is missing required game structure (endGame and submitScore functions)" }
    }

    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: `Invalid JavaScript: ${error.message}` }
  }
}

