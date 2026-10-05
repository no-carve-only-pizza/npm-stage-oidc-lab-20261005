// A bounded authorization check against a synthetic package owned by the researcher.
// Never print the GitHub identity token or the exchanged npm token.
const stageId = process.env.STAGE_ID
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stageId || '')) {
  throw new Error('A valid owned stage UUID is required')
}

const requestUrl = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL)
requestUrl.searchParams.set('audience', 'npm:registry.npmjs.org')
const identityResponse = await fetch(requestUrl, {
  headers: {
    Accept: 'application/json',
    Authorization: `Bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}`,
  },
})
if (!identityResponse.ok) {
  throw new Error(`GitHub OIDC identity request failed: HTTP ${identityResponse.status}`)
}
const identity = (await identityResponse.json()).value
if (!identity) {
  throw new Error('GitHub OIDC identity response had no token')
}

const registry = 'https://registry.npmjs.org'
const exchangeResponse = await fetch(
  `${registry}/-/npm/v1/oidc/token/exchange/package/@dohyunpkr%2fstage-publish-example`,
  {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${identity}`,
    },
  },
)
if (!exchangeResponse.ok) {
  throw new Error(`npm OIDC exchange failed: HTTP ${exchangeResponse.status}`)
}
const npmToken = (await exchangeResponse.json()).token
if (!npmToken) {
  throw new Error('npm OIDC exchange response had no token')
}

const approveResponse = await fetch(`${registry}/-/stage/${stageId}/approve`, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    Authorization: `Bearer ${npmToken}`,
  },
})
const responseText = await approveResponse.text()
let errorCode = null
let errorMessage = null
if (!approveResponse.ok) {
  try {
    const body = JSON.parse(responseText)
    errorCode = typeof body.code === 'string' ? body.code : null
    errorMessage = typeof body.message === 'string' ? body.message.slice(0, 200) : null
  } catch {
    errorMessage = 'Non-JSON error response'
  }
}
console.log(JSON.stringify({
  exchangeStatus: exchangeResponse.status,
  approveStatus: approveResponse.status,
  errorCode,
  errorMessage,
}))
if (!approveResponse.ok) {
  process.exitCode = 1
}
