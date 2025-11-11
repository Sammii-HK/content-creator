import { db } from '@/lib/db';

export class PersonaNotFoundError extends Error {
  constructor(personaId: string) {
    super(`Persona ${personaId} not found`);
    this.name = 'PersonaNotFoundError';
  }
}

export async function requirePersona(personaId?: string) {
  if (!personaId) {
    throw new Error('personaId is required for this action');
  }

  const persona = await db.voiceProfile.findUnique({ where: { id: personaId } });
  if (!persona) {
    throw new PersonaNotFoundError(personaId);
  }
  return persona;
}

export async function getPersonaContext(personaId: string) {
  const persona = await db.voiceProfile.findUnique({
    where: { id: personaId },
    include: {
      examples: true
    }
  });

  if (!persona) {
    throw new PersonaNotFoundError(personaId);
  }

  return {
    persona,
    blueprint: persona.blueprint,
    guidancePrompts: persona.guidancePrompts,
    exampleCount: persona.examples.length
  };
}
