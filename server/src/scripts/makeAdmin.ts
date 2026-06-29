import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../config/prisma';

const email = process.argv[2];

if (!email) {
  console.error('Usage: ts-node src/scripts/makeAdmin.ts <email>');
  process.exit(1);
}

async function run() {
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'admin' },
    select: { id: true, name: true, email: true, role: true },
  });
  console.log('Updated:', user);
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
