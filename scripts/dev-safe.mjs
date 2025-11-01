import http from 'http'
import { spawn } from 'child_process'

const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || 'localhost'
const url = `http://${host}:${port}/`

function checkServer(timeoutMs = 1200) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      // Any response means something is listening
      res.resume()
      resolve(true)
    })

    req.on('error', () => resolve(false))
    req.setTimeout(timeoutMs, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function main() {
  const isRunning = await checkServer()
  if (isRunning) {
    console.log(`Dev server detected at ${url}. Using existing instance.`)
    process.exit(0)
  }

  console.log(`No server detected on ${url}. Starting Next.js dev server...`)
  const child = spawn('next', ['dev'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: host,
    },
  })

  child.on('exit', (code) => {
    process.exit(code ?? 0)
  })
}

main().catch((err) => {
  console.error('Failed to start dev server safely:', err)
  process.exit(1)
})