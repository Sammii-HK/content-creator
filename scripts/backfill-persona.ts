import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [, , ...args] = process.argv;
  const personaFlagIndex = args.findIndex((arg) => arg === '--persona');
  let personaId = personaFlagIndex >= 0 ? args[personaFlagIndex + 1] : undefined;

  if (!personaId) {
    const firstPersona = await prisma.voiceProfile.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!firstPersona) {
      throw new Error('No personas found. Create a persona before running the backfill.');
    }
    personaId = firstPersona.id;
    console.log(`No persona passed. Using oldest persona: ${firstPersona.name} (${personaId})`);
  }

  const persona = await prisma.voiceProfile.findUnique({ where: { id: personaId } });
  if (!persona) {
    throw new Error(`Persona with id ${personaId} not found.`);
  }

  const backfillTargets: Array<{ model: string; update: () => Promise<{ count: number }> }> = [
    { model: 'videos', update: () => prisma.video.updateMany({ where: { personaId: null }, data: { personaId } }) },
    { model: 'templates', update: () => prisma.template.updateMany({ where: { personaId: null }, data: { personaId } }) },
    { model: 'broll', update: () => prisma.broll.updateMany({ where: { personaId: null }, data: { personaId } }) },
    { model: 'content_queue', update: () => prisma.contentQueue.updateMany({ where: { personaId: null }, data: { personaId } }) },
    { model: 'assets', update: () => prisma.asset.updateMany({ where: { personaId: null }, data: { personaId } }) },
    { model: 'generated_images', update: () => prisma.generatedImage.updateMany({ where: { personaId: null }, data: { personaId } }) },
    { model: 'ai_usage', update: () => prisma.aiUsage.updateMany({ where: { personaId: null }, data: { personaId } }) }
  ];

  for (const target of backfillTargets) {
    const { count } = await target.update();
    console.log(`Updated ${count} rows in ${target.model}`);
  }

  console.log('Backfill complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
