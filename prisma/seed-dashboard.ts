import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const ESTABLISHMENT_ID = 22;
const OWNER_USER_ID = 25;
const DEFAULT_PASSWORD = 'Teste123!';

// Data fixa: 16 de abril de 2026 — 18h São Paulo (21h UTC)
const now = new Date('2026-04-16T21:00:00.000Z');

// São Paulo = UTC-3, então meia-noite SP = 03:00 UTC
const todayStart = new Date('2026-04-16T03:00:00.000Z');    // 16/04 00:00 SP
const yesterdayStart = new Date('2026-04-15T03:00:00.000Z'); // 15/04 00:00 SP
const yesterdayEnd = new Date('2026-04-16T02:59:59.999Z');   // 15/04 23:59 SP

function hoursAgo(h: number): Date {
  return new Date(now.getTime() - h * 60 * 60 * 1000);
}
function minutesAgo(m: number): Date {
  return new Date(now.getTime() - m * 60 * 1000);
}
function daysFromNow(d: number): Date {
  return new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
}
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomDateBetween(from: Date, to: Date): Date {
  return new Date(
    from.getTime() + Math.random() * (to.getTime() - from.getTime()),
  );
}

const FIRST_NAMES = [
  'Ana', 'Bruno', 'Camila', 'Diego', 'Eduarda', 'Felipe', 'Gabriela',
  'Henrique', 'Isabela', 'João', 'Karla', 'Lucas', 'Mariana', 'Nicolas',
  'Olivia', 'Pedro', 'Rafaela', 'Samuel', 'Tatiana', 'Vinícius',
  'Letícia', 'Matheus', 'Bianca', 'Thiago', 'Juliana', 'Gustavo',
  'Fernanda', 'Ricardo', 'Aline', 'Caio',
];

const FEEDBACK_COMMENTS_POSITIVE = [
  'Melhor festa que já fui! Nota 10!',
  'Ambiente incrível, drinks perfeitos. Voltarei toda semana!',
  'Adorei a música e o atendimento, equipe nota 10',
  'Voltarei com certeza, experiência top demais',
  'Camarote sensacional, staff super atencioso',
  'Noite perfeita, obrigado pela experiência!',
  'Drinks deliciosos e ambiente impecável, amei tudo',
  'A melhor noite da minha vida! Lugar mágico',
  'Equipe muito atenciosa, parabéns pelo profissionalismo!',
  'Som excelente e organização impecável, evento top',
  'Superou todas as expectativas, indico demais!',
  'Que lugar maravilhoso, indico para todos os amigos',
  'Fui com amigos e todos adoraram, nota máxima',
  'Comemorei meu aniversário aqui, tudo perfeito!',
  'Atendimento rápido, drinks fortes e ambiente lindo',
  'O DJ mandou muito bem, playlist incrível',
  'Caipirinha melhor da cidade, sem dúvida',
  'Segurança nota 10, me senti muito tranquila',
  'Banheiros limpos, organização perfeita, parabéns',
  'Reservei camarote e valeu cada centavo!',
  'Happy hour excelente, preços justos',
  'Melhor custo-benefício da região, voltarei sempre',
  'Staff sempre sorrindo, clima contagiante!',
  'A decoração estava incrível, muito instagramável',
];

const FEEDBACK_COMMENTS_NEUTRAL = [
  'Bom, mas o som poderia ser melhor',
  'Lugar bonito, preços um pouco acima da média',
  'Atendimento ok, nada excepcional mas cumpriu',
  'Razoável, esperava um pouco mais pelo valor cobrado',
  'Ambiente legal mas estava muito cheio',
  'Drinks bons mas demorou um pouco para chegar',
  'Lugar bacana, mas o estacionamento é complicado',
  'Gostei do espaço, porém a música não era o meu estilo',
  'Comida boa, mas pouca variedade no cardápio',
  'Ambiente agradável, porém faltou ventilação',
];

const FEEDBACK_COMMENTS_NEGATIVE = [
  'Demora absurda no atendimento, fiquei 40 min esperando',
  'Muito caro pelo que oferece, não voltarei',
  'Banheiro sujo, inadmissível para esse preço',
  'Som muito alto, impossível conversar',
  'Cobraram coisas que não pedi na conta',
  'Fila enorme para entrar e lá dentro estava vazio',
  null,
  null,
  null,
];

const LOCATION_NOTES = [
  'Mesa 1 - área externa',
  'Mesa 3 - próximo ao bar',
  'Mesa 5 - área VIP',
  'Camarote 2',
  'Camarote 1 - segundo andar',
  'Mesa 8 - pista',
  'Mesa 12 - varanda',
  'Área lounge - sofá esquerdo',
  'Mesa 10 - entrada',
  'Camarote 3 - premium',
];

async function createUsers(count: number): Promise<number[]> {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const ids: number[] = [];

  for (let i = 0; i < count; i++) {
    const name = pickRandom(FIRST_NAMES);
    const suffix = randomBetween(1000, 99999);
    const phone = `5551${randomBetween(900000000, 999999999)}`;
    const dob = new Date(
      Date.UTC(randomBetween(1985, 2005), randomBetween(0, 11), randomBetween(1, 28)),
    );

    const user = await prisma.user.create({
      data: {
        name: `${name} ${suffix}`,
        phone,
        password: hash,
        role: 'NORMAL_USER',
        dateOfBirth: dob,
        acceptedTermsOfUse: true,
        acceptedPrivacyPolicy: true,
      },
    });
    ids.push(user.id);
  }

  console.log(`✓ ${count} usuários criados`);
  return ids;
}

async function createEmployees(userIds: number[]) {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const employees = [
    { name: 'João Silva', active: true },
    { name: 'Maria Santos', active: true },
    { name: 'Pedro Oliveira', active: true },
    { name: 'Ana Costa', active: false },
    { name: 'Lucas Ferreira', active: false },
  ];

  for (const emp of employees) {
    const phone = `5551${randomBetween(900000000, 999999999)}`;
    const user = await prisma.user.create({
      data: {
        name: emp.name,
        phone,
        password: hash,
        role: 'EMPLOYEE_ESTABLISHMENT',
      },
    });

    await prisma.establishmentEmployee.create({
      data: {
        establishmentId: ESTABLISHMENT_ID,
        userId: user.id,
        active: emp.active,
      },
    });
  }

  console.log(`✓ ${employees.length} funcionários criados (3 ativos, 2 inativos)`);
}

async function createMenu(): Promise<number[]> {
  const existing = await prisma.menu.findUnique({
    where: { establishmentId: ESTABLISHMENT_ID },
  });
  if (existing) {
    await prisma.menuItem.deleteMany({ where: { menuId: existing.id } });
    await prisma.menu.delete({ where: { id: existing.id } });
  }

  const menu = await prisma.menu.create({
    data: { establishmentId: ESTABLISHMENT_ID },
  });

  const items = [
    { name: 'Caipirinha', price: 25.0, type: 'ALCOHOLIC_DRINK' as const, desc: 'Cachaça artesanal, limão e açúcar' },
    { name: 'Gin Tônica', price: 32.0, type: 'ALCOHOLIC_DRINK' as const, desc: 'Gin London Dry com tônica premium' },
    { name: 'Moscow Mule', price: 35.0, type: 'ALCOHOLIC_DRINK' as const, desc: 'Vodka, ginger beer e limão' },
    { name: 'Whisky Red Label', price: 280.0, type: 'BOTTLE' as const, desc: 'Garrafa 1L com energético' },
    { name: 'Absolut Vodka', price: 240.0, type: 'BOTTLE' as const, desc: 'Garrafa 1L com suco ou energético' },
    { name: 'Água Mineral', price: 8.0, type: 'NON_ALCOHOLIC_DRINK' as const, desc: 'Garrafa 500ml sem gás' },
    { name: 'Energético', price: 18.0, type: 'NON_ALCOHOLIC_DRINK' as const, desc: 'Red Bull 250ml' },
    { name: 'Refrigerante', price: 10.0, type: 'NON_ALCOHOLIC_DRINK' as const, desc: 'Coca-Cola, Guaraná ou Sprite lata' },
    { name: 'Porção de Batata Frita', price: 45.0, type: 'FOOD' as const, desc: 'Batata frita crocante com cheddar e bacon' },
    { name: 'Tábua de Frios', price: 65.0, type: 'FOOD' as const, desc: 'Queijos, embutidos e torradas' },
    { name: 'Combo Casal', price: 120.0, type: 'COMBO' as const, desc: '2 drinks + 1 porção de batata' },
    { name: 'Narguilé Tradicional', price: 55.0, type: 'HOOKAH' as const, desc: 'Diversos sabores disponíveis' },
  ];

  const menuItemIds: number[] = [];
  for (const item of items) {
    const created = await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        name: item.name,
        description: item.desc,
        price: item.price,
        type: item.type,
      },
    });
    menuItemIds.push(created.id);
  }

  console.log(`✓ Cardápio criado com ${items.length} itens`);
  return menuItemIds;
}

function generateTopicRatings(overallTarget: number): {
  ratingCrowding: number;
  ratingAnimation: number;
  ratingOrganization: number;
  ratingHygiene: number;
  ratingAmbience: number;
} {
  const variance = () => randomBetween(-1, 1);
  const clamp = (v: number) => Math.max(1, Math.min(5, v));
  return {
    ratingCrowding: clamp(overallTarget + variance()),
    ratingAnimation: clamp(overallTarget + variance()),
    ratingOrganization: clamp(overallTarget + variance()),
    ratingHygiene: clamp(overallTarget + variance()),
    ratingAmbience: clamp(overallTarget + variance()),
  };
}

async function createFeedback(
  userId: number,
  overallTarget: number,
  createdAt: Date,
) {
  const topics = generateTopicRatings(overallTarget);
  const rating =
    Math.round(
      ((topics.ratingCrowding +
        topics.ratingAnimation +
        topics.ratingOrganization +
        topics.ratingHygiene +
        topics.ratingAmbience) /
        5) *
        10,
    ) / 10;

  const sentiment = rating >= 3.5 ? 'positive' : rating >= 2.5 ? 'neutral' : 'negative';
  let comment: string | null;
  if (sentiment === 'positive') comment = pickRandom(FEEDBACK_COMMENTS_POSITIVE);
  else if (sentiment === 'neutral') comment = pickRandom(FEEDBACK_COMMENTS_NEUTRAL);
  else comment = pickRandom(FEEDBACK_COMMENTS_NEGATIVE);

  await prisma.feedback.create({
    data: {
      userId,
      establishmentId: ESTABLISHMENT_ID,
      rating,
      ratingCrowding: topics.ratingCrowding,
      ratingAnimation: topics.ratingAnimation,
      ratingOrganization: topics.ratingOrganization,
      ratingHygiene: topics.ratingHygiene,
      ratingAmbience: topics.ratingAmbience,
      comment,
      idempotencyKey: randomUUID(),
      createdAt,
      updatedAt: createdAt,
    },
  });
}

async function createFeedbacks(userIds: number[]) {
  let userIdx = 0;
  const nextUser = () => userIds[userIdx++ % userIds.length];

  // --- HOJE (16/04): 47 feedbacks distribuídos por hora SP ---
  // [horaUTC, ratings[]] — permite controlar exatamente o sentimento de cada bucket
  const todayBuckets: [number, number[]][] = [
    [5,  [5, 4]],                         // 02h SP — 2 positivos
    [6,  [4, 3]],                         // 03h SP — 1 positivo, 1 neutro
    [9,  [5, 5, 3]],                      // 06h SP — 2 positivos, 1 neutro
    [11, [4, 2, 5]],                      // 08h SP — 2 positivos, 1 negativo
    [13, [5, 4, 4, 3]],                   // 10h SP — 3 positivos, 1 neutro
    [15, [4, 5, 3, 2, 4]],               // 12h SP — 3 positivos, 1 neutro, 1 negativo
    [17, [5, 5, 4, 4, 3, 5]],            // 14h SP — 5 positivos, 1 neutro
    [18, [4, 5, 5, 4, 2, 3, 5]],         // 15h SP — 5 positivos, 1 neutro, 1 negativo
    [19, [5, 5, 4, 5, 4, 3, 2, 5]],      // 16h SP — 6 positivos, 1 neutro, 1 negativo
    [20, [5, 4, 5, 5, 4, 4, 3, 1, 5]],   // 17h SP — 7 positivos, 1 neutro, 1 negativo (pico)
  ];

  let todayTotal = 0;
  for (const [utcHour, ratings] of todayBuckets) {
    for (const rating of ratings) {
      const hourStart = new Date(`2026-04-16T${String(utcHour).padStart(2, '0')}:00:00.000Z`);
      const hourEnd = new Date(hourStart.getTime() + 59 * 60 * 1000);
      await createFeedback(nextUser(), rating, randomDateBetween(hourStart, hourEnd));
      todayTotal++;
    }
  }

  // Últimos 30 min (live window) — 17:30 a 17:59 SP = 20:30 a 20:59 UTC
  const liveRatings = [5, 4, 5, 5, 3, 4, 2, 5, 4, 5];
  const liveStart = new Date('2026-04-16T20:30:00.000Z');
  const liveEnd = new Date('2026-04-16T20:59:00.000Z');
  for (const rating of liveRatings) {
    await createFeedback(nextUser(), rating, randomDateBetween(liveStart, liveEnd));
    todayTotal++;
  }

  // --- ONTEM (15/04): 35 feedbacks para delta "vs ontem" ---
  const yesterdayBuckets: [number, number[]][] = [
    [5,  [4, 3]],                         // 02h SP
    [8,  [5, 4, 2]],                      // 05h SP
    [11, [4, 3, 5, 4]],                   // 08h SP
    [14, [5, 4, 3, 2, 5, 4]],            // 11h SP
    [17, [5, 5, 4, 3, 4, 5, 2, 4]],      // 14h SP
    [20, [4, 5, 5, 4, 3, 5, 4, 2, 5]],   // 17h SP (pico ontem)
    [23, [4, 3, 5]],                       // 20h SP
  ];

  let yesterdayTotal = 0;
  for (const [utcHour, ratings] of yesterdayBuckets) {
    for (const rating of ratings) {
      const hourStart = new Date(`2026-04-15T${String(utcHour).padStart(2, '0')}:00:00.000Z`);
      const hourEnd = new Date(hourStart.getTime() + 59 * 60 * 1000);
      await createFeedback(nextUser(), rating, randomDateBetween(hourStart, hourEnd));
      yesterdayTotal++;
    }
  }

  const todayPositive = todayBuckets.flatMap(([, r]) => r).concat(liveRatings).filter(r => r >= 4).length;
  const todayNeutral = todayBuckets.flatMap(([, r]) => r).concat(liveRatings).filter(r => r === 3).length;
  const todayNegative = todayBuckets.flatMap(([, r]) => r).concat(liveRatings).filter(r => r <= 2).length;

  console.log(
    `✓ ${todayTotal} feedbacks hoje (16/04): ${todayPositive} positivos, ${todayNeutral} neutros, ${todayNegative} negativos`,
  );
  console.log(
    `  → ${liveRatings.length} nos últimos 30min (live window)`,
  );
  console.log(
    `✓ ${yesterdayTotal} feedbacks ontem (15/04) — delta: ${todayTotal > yesterdayTotal ? '+' : ''}${Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100)}% vs ontem`,
  );
}

async function recalculateScore() {
  const feedbacks = await prisma.feedback.findMany({
    where: { establishmentId: ESTABLISHMENT_ID },
    select: { rating: true },
  });
  const score =
    feedbacks.length > 0
      ? Math.round(
          (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length) *
            10,
        ) / 10
      : 0;

  await prisma.establishment.update({
    where: { id: ESTABLISHMENT_ID },
    data: { score },
  });

  console.log(`✓ Score recalculado: ${score}`);
}

async function createOrders(userIds: number[], menuItemIds: number[]) {
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
    select: { id: true, name: true, price: true },
  });

  const orders: { status: 'PENDING' | 'IN_PROGRESS' | 'READY' | 'DELIVERED' | 'CANCELLED'; ago: number; location: string; itemCount: number }[] = [
    // PENDING — recém-chegados (últimos 60 min)
    { status: 'PENDING', ago: 2,  location: 'Mesa 3 - próximo ao bar', itemCount: 2 },
    { status: 'PENDING', ago: 5,  location: 'Camarote 2 - andar superior', itemCount: 4 },
    { status: 'PENDING', ago: 8,  location: 'Mesa 7 - área externa coberta', itemCount: 1 },
    { status: 'PENDING', ago: 12, location: 'Mesa 1 - frente ao palco', itemCount: 3 },
    { status: 'PENDING', ago: 18, location: 'Área lounge - sofá da direita', itemCount: 2 },
    { status: 'PENDING', ago: 22, location: 'Mesa 15 - jardim', itemCount: 1 },
    { status: 'PENDING', ago: 28, location: 'Camarote 4 - vista privilegiada', itemCount: 5 },
    { status: 'PENDING', ago: 35, location: 'Mesa 9 - próximo à pista de dança', itemCount: 2 },
    { status: 'PENDING', ago: 42, location: 'Mesa 2 - bar lateral', itemCount: 3 },
    { status: 'PENDING', ago: 50, location: 'Mesa 11 - terraço', itemCount: 1 },

    // IN_PROGRESS — em preparo
    { status: 'IN_PROGRESS', ago: 55,  location: 'Camarote 1 - segundo andar', itemCount: 4 },
    { status: 'IN_PROGRESS', ago: 62,  location: 'Mesa 5 - área VIP', itemCount: 2 },
    { status: 'IN_PROGRESS', ago: 70,  location: 'Mesa 14 - reservada aniversário', itemCount: 6 },
    { status: 'IN_PROGRESS', ago: 78,  location: 'Mesa 10 - entrada principal', itemCount: 3 },
    { status: 'IN_PROGRESS', ago: 85,  location: 'Camarote 3 - premium', itemCount: 5 },

    // READY — prontos para entrega
    { status: 'READY', ago: 95,  location: 'Mesa 8 - pista central', itemCount: 2 },
    { status: 'READY', ago: 105, location: 'Mesa 6 - sacada', itemCount: 1 },
    { status: 'READY', ago: 115, location: 'Área lounge - sofá esquerdo', itemCount: 3 },

    // DELIVERED — entregues ao longo da noite
    { status: 'DELIVERED', ago: 130, location: 'Mesa 3 - próximo ao bar', itemCount: 2 },
    { status: 'DELIVERED', ago: 150, location: 'Camarote 2 - andar superior', itemCount: 3 },
    { status: 'DELIVERED', ago: 175, location: 'Mesa 12 - varanda', itemCount: 1 },
    { status: 'DELIVERED', ago: 200, location: 'Mesa 1 - frente ao palco', itemCount: 4 },
    { status: 'DELIVERED', ago: 230, location: 'Mesa 5 - área VIP', itemCount: 2 },
    { status: 'DELIVERED', ago: 260, location: 'Camarote 1 - segundo andar', itemCount: 3 },
    { status: 'DELIVERED', ago: 300, location: 'Mesa 7 - área externa coberta', itemCount: 2 },
    { status: 'DELIVERED', ago: 340, location: 'Mesa 9 - próximo à pista de dança', itemCount: 1 },
    { status: 'DELIVERED', ago: 380, location: 'Camarote 3 - premium', itemCount: 5 },
    { status: 'DELIVERED', ago: 420, location: 'Mesa 15 - jardim', itemCount: 2 },
    { status: 'DELIVERED', ago: 460, location: 'Mesa 10 - entrada principal', itemCount: 3 },
    { status: 'DELIVERED', ago: 500, location: 'Área lounge - sofá da direita', itemCount: 1 },
    { status: 'DELIVERED', ago: 540, location: 'Mesa 2 - bar lateral', itemCount: 2 },
    { status: 'DELIVERED', ago: 580, location: 'Mesa 14 - reservada aniversário', itemCount: 4 },
    { status: 'DELIVERED', ago: 620, location: 'Camarote 4 - vista privilegiada', itemCount: 3 },
    { status: 'DELIVERED', ago: 660, location: 'Mesa 6 - sacada', itemCount: 2 },
    { status: 'DELIVERED', ago: 700, location: 'Mesa 11 - terraço', itemCount: 1 },

    // CANCELLED — alguns cancelamentos realistas
    { status: 'CANCELLED', ago: 160, location: 'Mesa 8 - pista central', itemCount: 2 },
    { status: 'CANCELLED', ago: 350, location: 'Mesa 13 - reserva não compareceu', itemCount: 3 },
  ];

  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    const userId = userIds[i % userIds.length];
    const createdAt = minutesAgo(o.ago);
    const selectedItems: typeof menuItems = [];
    for (let j = 0; j < o.itemCount; j++) {
      selectedItems.push(pickRandom(menuItems));
    }

    await prisma.customerOrder.create({
      data: {
        establishmentId: ESTABLISHMENT_ID,
        userId,
        locationNote: o.location,
        status: o.status,
        idempotencyKey: randomUUID(),
        createdAt,
        updatedAt: createdAt,
        items: {
          create: selectedItems.map((item) => ({
            menuItemId: item.id,
            quantity: randomBetween(1, 3),
            unitPrice: item.price,
            itemName: item.name,
            createdAt,
          })),
        },
      },
    });
  }

  console.log(`✓ ${orders.length} pedidos criados (10 PENDING, 5 IN_PROGRESS, 3 READY, 17 DELIVERED, 2 CANCELLED)`);
}

async function createEvents(userIds: number[]) {
  const events = [
    {
      name: 'Noite Eletrônica',
      description: 'Os melhores DJs da cena eletrônica gaúcha em uma noite inesquecível.',
      attractions: 'DJ Alok (confirmado)\nDJ Vintage Culture\nDJ Liu',
      dj: 'Alok',
      priceInfo: 'Entrada: R$ 50 | VIP: R$ 120 | Camarote: R$ 300 (4 pessoas)',
      startsIn: 7,
      listType: 'GENERAL' as const,
      offersTable: true,
      tableCap: 4,
      tablesAvail: 10,
      tablePrice: 200,
      offersBooth: true,
      boothCap: 8,
      boothsAvail: 5,
      boothPrice: 500,
    },
    {
      name: 'Funk & Sertanejo Night',
      description: 'A melhor mistura de funk e sertanejo universitário. Open bar até 01h!',
      attractions: 'MC Kevinho\nDupla sertaneja convidada',
      dj: 'DJ Rennan da Penha',
      priceInfo: 'Lista free até 23h | Após: R$ 40',
      startsIn: 14,
      listType: 'FREE_LIST' as const,
      offersTable: true,
      tableCap: 6,
      tablesAvail: 8,
      tablePrice: 150,
      offersBooth: false,
      boothCap: null,
      boothsAvail: null,
      boothPrice: null,
    },
    {
      name: 'Sunset Lounge Session',
      description: 'Tarde de drinks artesanais com música ao vivo e pôr do sol.',
      attractions: 'Saxofonista ao vivo\nBanda de jazz',
      dj: null,
      priceInfo: 'Entrada franca | Consumação mínima R$ 60',
      startsIn: 21,
      listType: 'VIP' as const,
      offersTable: true,
      tableCap: 2,
      tablesAvail: 15,
      tablePrice: 80,
      offersBooth: true,
      boothCap: 6,
      boothsAvail: 3,
      boothPrice: 350,
    },
  ];

  for (const ev of events) {
    const startsAt = daysFromNow(ev.startsIn);
    startsAt.setUTCHours(0, 0, 0, 0);
    const endsAt = new Date(startsAt.getTime() + 6 * 60 * 60 * 1000);

    const event = await prisma.scheduledEvent.create({
      data: {
        establishmentId: ESTABLISHMENT_ID,
        name: ev.name,
        description: ev.description,
        attractions: ev.attractions,
        dj: ev.dj,
        priceInfo: ev.priceInfo,
        eventStartsAt: startsAt,
        eventEndsAt: endsAt,
        listType: ev.listType,
        offersTableReservation: ev.offersTable,
        tablePeopleCapacity: ev.tableCap,
        tablesAvailable: ev.tablesAvail,
        tablePrice: ev.tablePrice,
        offersBoothReservation: ev.offersBooth,
        boothPeopleCapacity: ev.boothCap,
        boothsAvailable: ev.boothsAvail,
        boothPrice: ev.boothPrice,
      },
    });

    const regCount = randomBetween(15, 50);
    const shuffled = [...userIds].sort(() => Math.random() - 0.5);
    const registrants = shuffled.slice(0, Math.min(regCount, shuffled.length));

    for (const uid of registrants) {
      await prisma.eventRegistration.create({
        data: {
          userId: uid,
          scheduledEventId: event.id,
        },
      });
    }

    console.log(
      `  → Evento "${ev.name}" (+${ev.startsIn}d) com ${registrants.length} inscritos`,
    );
  }

  console.log(`✓ ${events.length} eventos futuros criados`);
}

async function createQuotes() {
  const quotes = [
    'Happy hour até 23h, drinks com 30% off!',
    'Bem-vindos à melhor noite da cidade!',
    'Camarote com 20% de desconto hoje!',
    'DJ convidado especial a partir das 23h!',
    'Narguilé em dobro até meia-noite!',
  ];

  for (const text of quotes) {
    await prisma.quote.create({
      data: {
        establishmentId: ESTABLISHMENT_ID,
        text,
        expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
      },
    });
  }

  console.log(`✓ ${quotes.length} quotes ativas criadas`);
}

async function cleanEstablishmentData() {
  console.log(`\nLimpando dados do estabelecimento ID ${ESTABLISHMENT_ID}...\n`);

  await prisma.eventRegistration.deleteMany({
    where: { scheduledEvent: { establishmentId: ESTABLISHMENT_ID } },
  });
  await prisma.scheduledEvent.deleteMany({
    where: { establishmentId: ESTABLISHMENT_ID },
  });
  await prisma.orderItem.deleteMany({
    where: { order: { establishmentId: ESTABLISHMENT_ID } },
  });
  await prisma.customerOrder.deleteMany({
    where: { establishmentId: ESTABLISHMENT_ID },
  });
  await prisma.feedback.deleteMany({
    where: { establishmentId: ESTABLISHMENT_ID },
  });
  await prisma.quote.deleteMany({
    where: { establishmentId: ESTABLISHMENT_ID },
  });
  await prisma.menuItem.deleteMany({
    where: { menu: { establishmentId: ESTABLISHMENT_ID } },
  });
  await prisma.menu.deleteMany({
    where: { establishmentId: ESTABLISHMENT_ID },
  });
  await prisma.establishmentEmployee.deleteMany({
    where: { establishmentId: ESTABLISHMENT_ID },
  });

  console.log('✓ Dados anteriores limpos\n');
}

async function main() {
  console.log('=== SEED DASHBOARD — Estabelecimento ID', ESTABLISHMENT_ID, '===\n');

  await cleanEstablishmentData();

  const userIds = await createUsers(30);
  await createEmployees(userIds);
  const menuItemIds = await createMenu();
  await createFeedbacks(userIds);
  await recalculateScore();
  await createOrders(userIds, menuItemIds);
  await createEvents(userIds);
  await createQuotes();

  console.log('\n=== SEED COMPLETO ===');
  console.log(`\nDashboard pronto para o estabelecimento ID ${ESTABLISHMENT_ID}`);
  console.log(`Owner user ID: ${OWNER_USER_ID}`);
  console.log(`Login portal: emaildodono2@gmail.com / (senha do owner)\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
