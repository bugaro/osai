import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import neo4j from 'neo4j-driver'
import type { Driver, Session } from 'neo4j-driver'

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3002'
const NEO4J_URI = process.env.E2E_NEO4J_URI ?? 'bolt://localhost:7687'
const NEO4J_USER = process.env.E2E_NEO4J_USER ?? 'neo4j'
const NEO4J_PASSWORD = process.env.E2E_NEO4J_PASSWORD ?? 'osai_password'

let driver: Driver

function uid(): string {
  return crypto.randomUUID()
}

function correlationId(scenario: string): string {
  return `e2e-${scenario}-${uid()}`
}

async function seedPolicy(session: Session, overrides?: {
  zone?: string
  tier?: string
  ceiling?: number
  supervisorThreshold?: number
  baseRefund?: number
  primeBonus?: number
}): Promise<void> {
  const {
    zone = 'Poznan',
    tier = 'Prime',
    ceiling = 15.00,
    supervisorThreshold = 20.00,
    baseRefund = 10.00,
    primeBonus = 5.00,
  } = overrides ?? {}

  await session.run(
    `
    MERGE (z:Zone {name: $zone})
    MERGE (t:Tier {type: $tier})
    MERGE (l:Limit {ceiling: $ceiling})
    ON CREATE SET l.supervisorThreshold = $supervisorThreshold,
                  l.baseRefund = $baseRefund,
                  l.primeBonus = $primeBonus
    MERGE (z)-[:HAS_LIMIT]->(l)
    MERGE (z)-[:HAS_TIER_RULE]->(t)
    `,
    { zone, tier, ceiling, supervisorThreshold, baseRefund, primeBonus },
  )
}

async function drainSSE(response: Response): Promise<string[]> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Response body is not readable')
  const decoder = new TextDecoder()
  let chunks = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks += decoder.decode(value, { stream: true })
  }
  return chunks
    .split('\n')
    .filter((line) => line.includes('data: '))
    .map((line) => {
      let clean = line.trim()
      while (clean.startsWith('data:')) {
        clean = clean.slice(5).trim()
      }
      return clean
    })
}

beforeAll(async () => {
  driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))
  await driver.verifyConnectivity()
})

afterAll(async () => {
  if (driver) {
    const session = driver.session()
    try {
      await session.run('MATCH (n) DETACH DELETE n')
    } finally {
      await session.close()
    }
    await driver.close()
  }
})

async function wipeNeo4j(): Promise<void> {
  const session = driver.session()
  try {
    await session.run('MATCH (n) DETACH DELETE n')
  } finally {
    await session.close()
  }
}

async function countVouchers(): Promise<number> {
  const session = driver.session()
  try {
    const result = await session.run('MATCH (v:Voucher) RETURN count(v) AS cnt')
    return neo4j.integer.toNumber(result.records[0].get('cnt'))
  } finally {
    await session.close()
  }
}

describe('admin-ui E2E: S1 — Happy Path Resolution', () => {
  const corrId = correlationId('s1-happy')

  beforeAll(async () => {
    const session = driver.session()
    try {
      await wipeNeo4j()
      await seedPolicy(session, { zone: 'Poznan', tier: 'Prime', ceiling: 15.00, baseRefund: 10.00, primeBonus: 5.00 })
      await seedPolicy(session, { zone: 'Poznan', tier: 'Standard', ceiling: 15.00, baseRefund: 5.00, primeBonus: 0.00 })
    } finally {
      await session.close()
    }
  })

  it('should stream SSE events culminating in a final_answer with [SUCCESS]', async () => {
    const response = await fetch(`${BASE_URL}/api/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({
        userId: 'OSAI-7729-QX',
        location: 'Poznan',
        tier: 'Prime',
        delayMinutes: 45,
        threadId: `s1-thread-${uid().slice(0, 8)}`,
      }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')
    expect(response.headers.get('x-correlation-id')).toBe(corrId)

    const lines = await drainSSE(response)
    expect(lines.length).toBeGreaterThanOrEqual(4)

    const events = lines.map((l) => JSON.parse(l))
    expect(events.some((e) => e.type === 'thought')).toBe(true)
    expect(events.some((e) => e.type === 'tool_call')).toBe(true)
    expect(events.some((e) => e.type === 'tool_response')).toBe(true)
    expect(events.some((e) => e.type === 'final_answer')).toBe(true)

    const finalAnswer = events.find((e) => e.type === 'final_answer')
    expect(finalAnswer?.content).toBeDefined()
    expect(finalAnswer?.content).toMatch(/SUCCESS|Compensation/i)
  }, 240_000)

  it('should create a Voucher node in Neo4j for the resolved incident', async () => {
    const session = driver.session()
    try {
      const result = await session.run(
        'MATCH (v:Voucher) RETURN v.userId AS userId, v.amount AS amount',
      )
      expect(result.records.length).toBe(1)
      expect(result.records[0].get('userId')).toBe('OSAI-7729-QX')
      const amount = neo4j.integer.toNumber(result.records[0].get('amount'))
      expect(amount).toBeGreaterThan(0)
      expect(amount).toBeLessThanOrEqual(15.00)
    } finally {
      await session.close()
    }
  })
})


