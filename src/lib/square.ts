import { SquareClient, SquareEnvironment } from 'square'

let _client: SquareClient | null = null

export function getSquareClient(): SquareClient {
  if (!_client) {
    _client = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN!,
      environment:
        process.env.SQUARE_ENVIRONMENT === 'production'
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
    })
  }
  return _client
}

export function getSquareLocationId(): string {
  return process.env.SQUARE_LOCATION_ID!
}
