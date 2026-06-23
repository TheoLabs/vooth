import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { createHash, randomBytes } from 'crypto'
import { shell } from 'electron'

export interface GoogleDesktopAuthResult {
  code: string
  codeVerifier: string
  redirectUri: string
}

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const AUTH_TIMEOUT_MS = 5 * 60 * 1000

function base64url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function createPkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = base64url(randomBytes(32))
  const codeChallenge = base64url(createHash('sha256').update(codeVerifier).digest())
  return { codeVerifier, codeChallenge }
}

const SUCCESS_HTML = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>Vooth Tool</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
        background: #0f1115;
        color: #f5f5f5;
      }
      .card {
        text-align: center;
        padding: 32px 40px;
        border-radius: 12px;
        background: #1b1e27;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>로그인이 완료되었습니다.</h1>
      <p>이 창을 닫고 Vooth Tool 로 돌아가세요.</p>
    </div>
  </body>
</html>`

/**
 * 데스크톱 OAuth 인증 코드 흐름을 수행한다.
 * 시스템 브라우저를 열어 Google 로그인을 진행하고, 루프백 서버로 redirect 를 받아
 * 인증 코드(`code`)와 PKCE `codeVerifier`, `redirectUri` 를 돌려준다.
 */
export function runGoogleDesktopAuth(clientId: string): Promise<GoogleDesktopAuthResult> {
  return new Promise<GoogleDesktopAuthResult>((resolve, reject) => {
    const { codeVerifier, codeChallenge } = createPkcePair()
    const state = base64url(randomBytes(16))

    let settled = false
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      if (!req.url) {
        res.statusCode = 400
        res.end('Bad Request')
        return
      }

      const url = new URL(req.url, 'http://127.0.0.1')
      // 일부 브라우저는 favicon 등 부가 요청을 보낸다 — 콜백만 처리한다.
      if (!url.searchParams.has('code') && !url.searchParams.has('error')) {
        res.statusCode = 404
        res.end('Not Found')
        return
      }

      const returnedState = url.searchParams.get('state')
      const error = url.searchParams.get('error')
      const code = url.searchParams.get('code')

      if (returnedState !== state) {
        res.statusCode = 400
        res.end('Invalid state')
        finish(new Error('OAuth state 가 일치하지 않습니다.'))
        return
      }

      if (error) {
        res.statusCode = 400
        res.end(`Login error: ${error}`)
        finish(new Error(`Google 로그인 오류: ${error}`))
        return
      }

      if (!code) {
        res.statusCode = 400
        res.end('Missing code')
        finish(new Error('인증 코드를 받지 못했습니다.'))
        return
      }

      res.statusCode = 200
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(SUCCESS_HTML)
      finish(undefined, { code, codeVerifier, redirectUri })
    })

    let redirectUri = ''

    function cleanup(): void {
      if (timeoutHandle) clearTimeout(timeoutHandle)
      server.close()
    }

    function finish(err?: Error, result?: GoogleDesktopAuthResult): void {
      if (settled) return
      settled = true
      cleanup()
      if (err) reject(err)
      else if (result) resolve(result)
    }

    server.on('error', (err) => {
      finish(err instanceof Error ? err : new Error(String(err)))
    })

    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        finish(new Error('루프백 서버 포트를 확인할 수 없습니다.'))
        return
      }

      redirectUri = `http://127.0.0.1:${address.port}`

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'openid email profile',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state,
        prompt: 'select_account'
      })

      timeoutHandle = setTimeout(() => {
        finish(new Error('로그인 시간이 초과되었습니다. 다시 시도해주세요.'))
      }, AUTH_TIMEOUT_MS)

      void shell.openExternal(`${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`).catch((openErr) => {
        finish(openErr instanceof Error ? openErr : new Error(String(openErr)))
      })
    })
  })
}
