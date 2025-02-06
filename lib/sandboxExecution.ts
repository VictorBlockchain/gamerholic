import { VM } from "vm2"

export function executeSandboxedCode(code: string, context: object = {}): any {
  const vm = new VM({
    timeout: 5000, // 5 second timeout
    sandbox: context,
  })

  try {
    return vm.run(code)
  } catch (error) {
    console.error("Error executing sandboxed code:", error)
    throw new Error("Error executing game code")
  }
}

