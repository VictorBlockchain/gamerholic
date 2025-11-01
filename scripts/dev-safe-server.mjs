import http from 'http'
import net from 'net'
import { spawn } from 'child_process'

const port = Number(process.env.PORT || 3000)
const hostEnv = process.env.HOST || 'localhost'
const hosts = [hostEnv, '127.0.0.1']
const url = (h) => `http://${h}:${port}/`

function checkServerHttp(timeoutMs = 1200) {
  return Promise.any(
    hosts.map(
      (h) =>
        new Promise((resolve, reject) => {
          const req = http.get(url(h), (res) => {
            res.resume()
            resolve(true)
          })

          req.on('error', reject)
          req.setTimeout(timeoutMs, () => {
            req.destroy()
            reject(new Error('timeout'))
          })
        })
    )
  ).catch(() => false)
}

function checkPortTcp(timeoutMs = 800) {
  return Promise.any(
    hosts.map(
      (h) =>
        new Promise((resolve, reject) => {
          const socket = net.createConnection({ host: h, port }, () => {
            socket.end()
            resolve(true)
          })
          socket.on('error', reject)
          socket.setTimeout(timeoutMs, () => {
            socket.destroy()
            reject(new Error('timeout'))
          })
        })
    )
  ).catch(() => false)
}

async function main() {
  const httpUp = await checkServerHttp()
  const tcpUp = httpUp ? true : await checkPortTcp()
  const isRunning = httpUp || tcpUp
  if (isRunning) {
    console.log(`Dev server already running on port ${port}. Not starting a new one.`)
    process.exit(0)
  }

  console.log(`No server detected on http://${hostEnv}:${port}/. Starting custom dev server...`)
  const child = spawn('tsx', ['server.ts'], {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: hostEnv,
      NODE_ENV: process.env.NODE_ENV || 'development',
    },
  })

  child.on('exit', (code) => {
    process.exit(code ?? 0)
  })
}

main().catch((err) => {
  console.error('Failed to start safe dev server:', err)
  process.exit(1)
})