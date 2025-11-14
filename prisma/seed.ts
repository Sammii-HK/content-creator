import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a default user for seeding
  const defaultUser = await prisma.user.upsert({
    where: { email: 'seed@example.com' },
    update: {},
    create: {
      email: 'seed@example.com',
      password: '$2a$10$placeholder', // Placeholder hash - not for real use
      name: 'Seed User'
    }
  });

  console.log(`✅ Created/updated seed user`);

  // Create default templates
  const templates = await Promise.all([
    prisma.template.create({
      data: {
        name: 'Hook + Facts',
        json: {
          duration: 10,
          scenes: [
            {
              start: 0,
              end: 2,
              text: {
                content: '{{hook}}',
                position: { x: 50, y: 80 },
                style: {
                  fontSize: 48,
                  fontWeight: 'bold',
                  color: '#ffffff',
                  stroke: '#000000',
                  strokeWidth: 2
                }
              },
              filters: ['brightness(1.2)', 'contrast(1.1)']
            },
            {
              start: 2,
              end: 10,
              text: {
                content: '{{content}}',
                position: { x: 50, y: 50 },
                style: {
                  fontSize: 36,
                  fontWeight: 'normal',
                  color: '#ffffff',
                  stroke: '#000000',
                  strokeWidth: 1
                }
              },
              filters: ['brightness(1.0)', 'contrast(1.0)']
            }
          ]
        },
        performance: 0.75
      }
    }),
    prisma.template.create({
      data: {
        name: 'Question + Answer',
        json: {
          duration: 12,
          scenes: [
            {
              start: 0,
              end: 3,
              text: {
                content: '{{question}}',
                position: { x: 50, y: 30 },
                style: {
                  fontSize: 42,
                  fontWeight: 'bold',
                  color: '#ffff00',
                  stroke: '#000000',
                  strokeWidth: 2
                }
              },
              filters: ['brightness(1.1)', 'contrast(1.2)']
            },
            {
              start: 3,
              end: 12,
              text: {
                content: '{{answer}}',
                position: { x: 50, y: 70 },
                style: {
                  fontSize: 38,
                  fontWeight: 'normal',
                  color: '#ffffff',
                  stroke: '#000000',
                  strokeWidth: 1
                }
              },
              filters: ['brightness(1.0)', 'contrast(1.0)']
            }
          ]
        },
        performance: 0.82
      }
    }),
    prisma.template.create({
      data: {
        name: 'Countdown List',
        json: {
          duration: 15,
          scenes: [
            {
              start: 0,
              end: 2,
              text: {
                content: '{{title}}',
                position: { x: 50, y: 20 },
                style: {
                  fontSize: 44,
                  fontWeight: 'bold',
                  color: '#ff6b6b',
                  stroke: '#ffffff',
                  strokeWidth: 2
                }
              },
              filters: ['brightness(1.2)', 'contrast(1.1)']
            },
            {
              start: 2,
              end: 15,
              text: {
                content: '{{items}}',
                position: { x: 50, y: 60 },
                style: {
                  fontSize: 32,
                  fontWeight: 'normal',
                  color: '#ffffff',
                  stroke: '#000000',
                  strokeWidth: 1
                }
              },
              filters: ['brightness(1.0)', 'contrast(1.0)']
            }
          ]
        },
        performance: 0.68
      }
    })
  ]);

  console.log(`✅ Created ${templates.length} templates`);

  // Create sample B-roll entries (placeholders)
  const brollEntries = await Promise.all([
    prisma.broll.create({
      data: {
        name: 'City Timelapse',
        description: 'Fast-paced city traffic and lights',
        fileUrl: '/placeholder/city-timelapse.mp4',
        duration: 30,
        category: 'urban',
        tags: ['city', 'traffic', 'lights', 'fast', 'energy'],
        userId: defaultUser.id
      }
    }),
    prisma.broll.create({
      data: {
        name: 'Nature Scenes',
        description: 'Peaceful forest and mountain views',
        fileUrl: '/placeholder/nature-scenes.mp4',
        duration: 45,
        category: 'nature',
        tags: ['forest', 'mountains', 'peaceful', 'calm', 'green'],
        userId: defaultUser.id
      }
    }),
    prisma.broll.create({
      data: {
        name: 'Tech Setup',
        description: 'Modern workspace with devices',
        fileUrl: '/placeholder/tech-setup.mp4',
        duration: 20,
        category: 'technology',
        tags: ['tech', 'workspace', 'modern', 'devices', 'clean'],
        userId: defaultUser.id
      }
    }),
    prisma.broll.create({
      data: {
        name: 'Food Preparation',
        description: 'Cooking and food styling shots',
        fileUrl: '/placeholder/food-prep.mp4',
        duration: 25,
        category: 'lifestyle',
        tags: ['food', 'cooking', 'kitchen', 'fresh', 'delicious'],
        userId: defaultUser.id
      }
    }),
    prisma.broll.create({
      data: {
        name: 'Abstract Motion',
        description: 'Colorful abstract patterns and shapes',
        fileUrl: '/placeholder/abstract-motion.mp4',
        duration: 40,
        category: 'abstract',
        tags: ['abstract', 'colorful', 'motion', 'patterns', 'creative'],
        userId: defaultUser.id
      }
    })
  ]);

  console.log(`✅ Created ${brollEntries.length} B-roll entries`);

  // Create sample trends
  const trends = await Promise.all([
    prisma.trend.create({
      data: {
        tag: 'ai',
        platform: 'tiktok',
        popularity: 95,
        mood: 'curious',
        category: 'technology'
      }
    }),
    prisma.trend.create({
      data: {
        tag: 'productivity',
        platform: 'tiktok',
        popularity: 87,
        mood: 'motivated',
        category: 'lifestyle'
      }
    }),
    prisma.trend.create({
      data: {
        tag: 'mindfulness',
        platform: 'instagram',
        popularity: 73,
        mood: 'peaceful',
        category: 'wellness'
      }
    })
  ]);

  console.log(`✅ Created ${trends.length} trend entries`);

  // Create an active ML model entry
  const mlModel = await prisma.mLModel.create({
    data: {
      name: 'engagement_predictor',
      version: '1.0.0',
      modelPath: 'models/engagement_predictor_v1.pkl',
      performance: {
        accuracy: 0.78,
        precision: 0.82,
        recall: 0.75,
        f1Score: 0.78,
        trainedOn: new Date().toISOString(),
        features: ['visual_score', 'tone_score', 'duration', 'hook_strength']
      },
      isActive: true
    }
  });

  console.log(`✅ Created ML model: ${mlModel.name}`);

  console.log('🎉 Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
