const MAX_REMEMBERED_EVENTS = 500

type GatedEvent = {
  eventId: string
  version: number
  resource: { type: string; id: string }
}

export const createEventGate = () => {
  const seen = new Set<string>()
  const versions = new Map<string, number>()
  return (event: GatedEvent) => {
    if (seen.has(event.eventId)) return false
    seen.add(event.eventId)
    if (seen.size > MAX_REMEMBERED_EVENTS) {
      const oldest = seen.values().next().value
      if (oldest !== undefined) seen.delete(oldest)
    }
    const key = `${event.resource.type}:${event.resource.id}`
    if (event.version <= (versions.get(key) ?? 0)) return false
    versions.set(key, event.version)
    return true
  }
}
