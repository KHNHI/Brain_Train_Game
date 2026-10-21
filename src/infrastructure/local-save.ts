import { openDB } from 'idb';
import { sessionSchema, type CubeSession } from '../games/cube/engine/session';

// No account identifiers, secrets, or authentication tokens belong in this store.
const database = () =>
  openDB('brain-trainer-guest', 1, {
    upgrade(db) {
      db.createObjectStore('sessions');
    },
  });
export async function loadSession(): Promise<CubeSession | null> {
  const db = await database();
  try {
    const raw: unknown = await db.get('sessions', 'cube');
    if (raw === undefined) return null;
    const result = sessionSchema.safeParse(raw);
    if (!result.success)
      throw new Error(
        'The saved puzzle uses an unsupported or damaged format. It has been preserved.',
      );
    return result.data;
  } finally {
    db.close();
  }
}
export async function saveSession(session: CubeSession): Promise<void> {
  const checked = sessionSchema.parse(session);
  const db = await database();
  try {
    await db.put('sessions', checked, 'cube');
  } finally {
    db.close();
  }
}
