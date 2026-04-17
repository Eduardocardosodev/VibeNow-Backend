import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

/** Horários reutilizáveis (abertura/fechamento em HH:mm). */
const openingHours = {
  /** Qui a Dom 19h–02h (lounge). */
  thuToSun: {
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: { open: '19:00', close: '02:00' },
    friday: { open: '19:00', close: '02:00' },
    saturday: { open: '19:00', close: '02:00' },
    sunday: { open: '19:00', close: '02:00' },
  },
  /** Sex e Sáb 20h–04h (balada). */
  friSatLate: {
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: { open: '20:00', close: '04:00' },
    saturday: { open: '20:00', close: '04:00' },
    sunday: null,
  },
  /** Sex a Dom 18h–02h. */
  friToSun: {
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: { open: '18:00', close: '02:00' },
    saturday: { open: '18:00', close: '02:00' },
    sunday: { open: '18:00', close: '02:00' },
  },
  /** Seg a Sáb 10h–22h (salão de festas diurno). */
  monToSatDay: {
    monday: { open: '10:00', close: '22:00' },
    tuesday: { open: '10:00', close: '22:00' },
    wednesday: { open: '10:00', close: '22:00' },
    thursday: { open: '10:00', close: '22:00' },
    friday: { open: '10:00', close: '22:00' },
    saturday: { open: '10:00', close: '22:00' },
    sunday: null,
  },
} as const;

const establishments = [
  {
    name: 'Lounge Canoas Centro',
    cnpj: '12345678000191',
    address: 'Av. Getúlio Vargas, 4200',
    addressNumber: '4200',
    city: 'Canoas',
    state: 'RS',
    zipCode: '92020000',
    phone: '51996225855',
    email: 'contato@loungecanoascentro.com',
    instagram: '@loungecanoascentro',
    establishmentType: 'LOUNGE' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
    latitude: -29.9178,
    longitude: -51.1836,
    score: 0,
    openingHours: openingHours.thuToSun,
  },
  {
    name: 'Festas Nossa Sra. das Graças',
    cnpj: '12345678000192',
    address: 'Rua Tiradentes, 850',
    addressNumber: '850',
    city: 'Canoas',
    state: 'RS',
    zipCode: '92025010',
    phone: '51989338157',
    email: 'contato@festasgraças.com',
    instagram: '@festasnossasenhora',
    establishmentType: 'PARTY' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400',
    latitude: -29.9152,
    longitude: -51.181,
    score: 0,
    openingHours: openingHours.monToSatDay,
  },
  {
    name: 'Lounge Mathias Velho',
    cnpj: '12345678000193',
    address: 'Av. Guilherme Schell, 6100',
    addressNumber: '6100',
    city: 'Canoas',
    state: 'RS',
    zipCode: '92320000',
    phone: '5134123458',
    email: 'contato@loungemathias.com',
    instagram: '@loungemathiasvelho',
    establishmentType: 'LOUNGE' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1572119699694-47089d979b0c?w=400',
    latitude: -29.928,
    longitude: -51.195,
    score: 0,
    openingHours: openingHours.friSatLate,
  },
  {
    name: 'House Party Canoas',
    cnpj: '12345678000194',
    address: 'Rua Dona Isabel, 720',
    addressNumber: '720',
    city: 'Canoas',
    state: 'RS',
    zipCode: '92010020',
    phone: '5134123459',
    email: 'contato@housepartycanoas.com',
    instagram: '@housepartycanoas',
    establishmentType: 'PARTY' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400',
    latitude: -29.912,
    longitude: -51.178,
    score: 0,
    openingHours: openingHours.friSatLate,
  },
  {
    name: 'Lounge São Luís',
    cnpj: '12345678000195',
    address: 'Av. Victor Barreto, 3500',
    addressNumber: '3500',
    city: 'Canoas',
    state: 'RS',
    zipCode: '92030000',
    phone: '5134123460',
    email: 'contato@loungesaoluis.com',
    instagram: '@loungesaoluis',
    establishmentType: 'LOUNGE' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400',
    latitude: -29.922,
    longitude: -51.172,
    score: 0,
    openingHours: openingHours.thuToSun,
  },
  {
    name: 'Salão de Festas Estância Velha',
    cnpj: '12345678000196',
    address: 'Rua São José, 450',
    addressNumber: '450',
    city: 'Canoas',
    state: 'RS',
    zipCode: '92040000',
    phone: '5134123461',
    email: 'contato@festasestancia.com',
    instagram: '@festasestanciavelha',
    establishmentType: 'PARTY' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
    latitude: -29.935,
    longitude: -51.188,
    score: 0,
    openingHours: openingHours.monToSatDay,
  },
  {
    name: 'Lounge Olaria Canoas',
    cnpj: '12345678000197',
    address: 'Rua Olaria, 180',
    addressNumber: '180',
    city: 'Canoas',
    state: 'RS',
    zipCode: '92020150',
    phone: '5134123470',
    email: 'contato@loungeolaria.com.br',
    instagram: '@loungeolaria',
    establishmentType: 'LOUNGE' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1566417713940-fe1c922adcdb?w=400',
    latitude: -29.905,
    longitude: -51.168,
    score: 0,
    openingHours: openingHours.thuToSun,
  },
  {
    name: 'Balada Igara Canoas',
    cnpj: '12345678000198',
    address: 'Av. Dr. Sezefredo Azambuja Vieira, 2400',
    addressNumber: '2400',
    city: 'Canoas',
    state: 'RS',
    zipCode: '92480000',
    phone: '5134123471',
    email: 'reservas@baladaigara.com.br',
    instagram: '@baladaigara',
    establishmentType: 'PARTY' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=400',
    latitude: -29.938,
    longitude: -51.202,
    score: 0,
    openingHours: openingHours.friSatLate,
  },
  {
    name: 'Espaço Harmonia Eventos — Canoas',
    cnpj: '12345678000199',
    address: 'Rua Jacob Wiegand, 120',
    addressNumber: '120',
    city: 'Canoas',
    state: 'RS',
    zipCode: '92025580',
    phone: '5134123472',
    email: 'eventos@harmoniacanoas.com.br',
    instagram: '@harmoniacanoas',
    establishmentType: 'PARTY' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400',
    latitude: -29.908,
    longitude: -51.175,
    score: 0,
    openingHours: openingHours.monToSatDay,
  },
  {
    name: 'Verona Rooftop Canoas',
    cnpj: '12345678000200',
    address: 'Av. Farroupilha, 4545',
    addressNumber: '4545',
    city: 'Canoas',
    state: 'RS',
    zipCode: '92020100',
    phone: '5134123473',
    email: 'contato@veronarooftop.com.br',
    instagram: '@veronarooftopcanoas',
    establishmentType: 'LOUNGE' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
    latitude: -29.921,
    longitude: -51.191,
    score: 0,
    openingHours: openingHours.friToSun,
  },
  {
    name: 'Festas Nilo Peçanha — Canoas',
    cnpj: '12345678000201',
    address: 'Rua Nilo Peçanha, 890',
    addressNumber: '890',
    city: 'Canoas',
    state: 'RS',
    zipCode: '92020420',
    phone: '5134123474',
    email: 'orcamento@festasnilopcanoas.com.br',
    instagram: '@festasnilopcanoas',
    establishmentType: 'PARTY' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1519167758481-83f29da09031?w=400',
    latitude: -29.899,
    longitude: -51.171,
    score: 0,
    openingHours: openingHours.monToSatDay,
  },
  {
    name: 'Bohème Cidade Baixa',
    cnpj: '12345678000202',
    address: 'Rua da República, 152',
    addressNumber: '152',
    city: 'Porto Alegre',
    state: 'RS',
    zipCode: '90050161',
    phone: '5134123475',
    email: 'ola@bohemepoa.com.br',
    instagram: '@bohemecidadebaixa',
    establishmentType: 'LOUNGE' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400',
    latitude: -30.036,
    longitude: -51.222,
    score: 0,
    openingHours: openingHours.thuToSun,
  },
  {
    name: 'Sky Lounge Moinhos de Vento',
    cnpj: '12345678000203',
    address: 'Av. Independência, 1350',
    addressNumber: '1350',
    city: 'Porto Alegre',
    state: 'RS',
    zipCode: '90570000',
    phone: '5134123476',
    email: 'reservas@skyloungemoinhos.com.br',
    instagram: '@skyloungemoinhos',
    establishmentType: 'LOUNGE' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1572116469694-47508c067dc3?w=400',
    latitude: -30.014,
    longitude: -51.163,
    score: 0,
    openingHours: openingHours.friToSun,
  },
  {
    name: 'Groove Bom Fim',
    cnpj: '12345678000204',
    address: 'Av. Osvaldo Aranha, 640',
    addressNumber: '640',
    city: 'Porto Alegre',
    state: 'RS',
    zipCode: '90035190',
    phone: '5134123477',
    email: 'contato@groovebomfim.com.br',
    instagram: '@groovebomfim',
    establishmentType: 'PARTY' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400',
    latitude: -30.039,
    longitude: -51.21,
    score: 0,
    openingHours: openingHours.friSatLate,
  },
  {
    name: 'Salão Festas Tristeza Sul',
    cnpj: '12345678000205',
    address: 'Av. Wenceslau Escobar, 3220',
    addressNumber: '3220',
    city: 'Porto Alegre',
    state: 'RS',
    zipCode: '91900000',
    phone: '5134123478',
    email: 'eventos@salatristeza.com.br',
    instagram: '@salonfestastristeza',
    establishmentType: 'PARTY' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1520854221050-0f4caff449fb?w=400',
    latitude: -30.115,
    longitude: -51.243,
    score: 0,
    openingHours: openingHours.monToSatDay,
  },
  {
    name: 'Sunset Praia de Belas',
    cnpj: '12345678000206',
    address: 'Av. Praia de Belas, 1188',
    addressNumber: '1188',
    city: 'Porto Alegre',
    state: 'RS',
    zipCode: '90110000',
    phone: '5134123479',
    email: 'contato@sunsetpraiadebelas.com.br',
    instagram: '@sunsetpraiadebelas',
    establishmentType: 'LOUNGE' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400',
    latitude: -30.098,
    longitude: -51.245,
    score: 0,
    openingHours: openingHours.thuToSun,
  },
  {
    name: 'Barba Negra Historic POA',
    cnpj: '12345678000207',
    address: 'Rua Vigário José Inácio, 160',
    addressNumber: '160',
    city: 'Porto Alegre',
    state: 'RS',
    zipCode: '90020110',
    phone: '5134123480',
    email: 'contato@barbanegrapoa.com.br',
    instagram: '@barbanegrahistoric',
    establishmentType: 'LOUNGE' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1575444758702-4ed6b7ddd66e?w=400',
    latitude: -30.029,
    longitude: -51.231,
    score: 0,
    openingHours: openingHours.thuToSun,
  },
  {
    name: 'Arena Hall Petrópolis',
    cnpj: '12345678000208',
    address: 'Rua Almirante Barroso, 2400',
    addressNumber: '2400',
    city: 'Porto Alegre',
    state: 'RS',
    zipCode: '90035100',
    phone: '5134123481',
    email: 'festas@arenahallpetropolis.com.br',
    instagram: '@arenahallpetropolis',
    establishmentType: 'PARTY' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
    latitude: -30.04,
    longitude: -51.205,
    score: 0,
    openingHours: openingHours.friSatLate,
  },
  {
    name: 'Bela Vista Premium Lounge',
    cnpj: '12345678000209',
    address: 'Av. Borges de Medeiros, 2100',
    addressNumber: '2100',
    city: 'Porto Alegre',
    state: 'RS',
    zipCode: '90110020',
    phone: '5134123482',
    email: 'vip@belavistapremium.com.br',
    instagram: '@belavistapremiumpoa',
    establishmentType: 'LOUNGE' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
    latitude: -30.031,
    longitude: -51.226,
    score: 0,
    openingHours: openingHours.friToSun,
  },
  {
    name: 'Chácara das Pedras Festas',
    cnpj: '12345678000210',
    address: 'Av. Dr. Nilo Peçanha, 3300',
    addressNumber: '3300',
    city: 'Porto Alegre',
    state: 'RS',
    zipCode: '91330100',
    phone: '5134123483',
    email: 'orcamento@chacarapedraspoa.com.br',
    instagram: '@chacarapedraspoa',
    establishmentType: 'PARTY' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400',
    latitude: -30.092,
    longitude: -51.198,
    score: 0,
    openingHours: openingHours.monToSatDay,
  },
  {
    name: 'Opinião Night Porto Alegre',
    cnpj: '12345678000211',
    address: 'Rua José do Patrocínio, 834',
    addressNumber: '834',
    city: 'Porto Alegre',
    state: 'RS',
    zipCode: '90050103',
    phone: '5134123484',
    email: 'contato@opiniaonightpoa.com.br',
    instagram: '@opiniaonightpoa',
    establishmentType: 'PARTY' as const,
    profilePhoto:
      'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400',
    latitude: -30.034,
    longitude: -51.218,
    score: 0,
    openingHours: openingHours.friSatLate,
  },
];

/** Imagens Unsplash para itens do cardápio (drinks, garrafas, combos, narguile, comidas). */
const menuItemPhotos = {
  caipirinha:
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400',
  cocktail:
    'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400',
  beer: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400',
  wine: 'https://images.unsplash.com/photo-1510812431401-41d2d2c81880?w=400',
  champagne: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
  whisky: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400',
  refrigerante:
    'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400',
  agua: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
  suco: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400',
  garrafaVodka:
    'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400',
  garrafaVinho:
    'https://images.unsplash.com/photo-1510812431401-41d2d2c81880?w=400',
  combo: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400',
  narguile: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400',
  comida: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
  petisco: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400',
} as const;

type MenuItemSeed = {
  name: string;
  description: string | null;
  photoMenuItem: string;
  price: number;
  type:
    | 'ALCOHOLIC_DRINK'
    | 'NON_ALCOHOLIC_DRINK'
    | 'COMBO'
    | 'BOTTLE'
    | 'FOOD'
    | 'HOOKAH';
};

/** Cardápios reutilizáveis — novos estabelecimentos Canoas / Porto Alegre. */
const menuPackLoungeFull: MenuItemSeed[] = [
  {
    name: 'Caipirinha',
    description: 'Limão, cachaça, gelo e açúcar',
    photoMenuItem: menuItemPhotos.caipirinha,
    price: 27,
    type: 'ALCOHOLIC_DRINK',
  },
  {
    name: 'Gin Tônica',
    description: 'Gin, tônica e limão',
    photoMenuItem: menuItemPhotos.cocktail,
    price: 34,
    type: 'ALCOHOLIC_DRINK',
  },
  {
    name: 'Chopp 300ml',
    description: 'Chopp gelado',
    photoMenuItem: menuItemPhotos.beer,
    price: 13,
    type: 'ALCOHOLIC_DRINK',
  },
  {
    name: 'Água / refrigerante',
    description: 'Lata ou 500ml',
    photoMenuItem: menuItemPhotos.refrigerante,
    price: 7,
    type: 'NON_ALCOHOLIC_DRINK',
  },
  {
    name: 'Suco natural',
    description: 'Laranja ou maracujá',
    photoMenuItem: menuItemPhotos.suco,
    price: 15,
    type: 'NON_ALCOHOLIC_DRINK',
  },
  {
    name: 'Combo happy hour',
    description: '2 drinks clássicos',
    photoMenuItem: menuItemPhotos.combo,
    price: 48,
    type: 'COMBO',
  },
  {
    name: 'Garrafa espumante',
    description: '750ml',
    photoMenuItem: menuItemPhotos.champagne,
    price: 195,
    type: 'BOTTLE',
  },
  {
    name: 'Narguile',
    description: 'Sabores da casa',
    photoMenuItem: menuItemPhotos.narguile,
    price: 42,
    type: 'HOOKAH',
  },
];

const menuPackLoungePOA: MenuItemSeed[] = menuPackLoungeFull.map((it) => ({
  ...it,
  price: Math.round(it.price * 1.12 * 100) / 100,
}));

const menuPackPartyHall: MenuItemSeed[] = [
  {
    name: 'Refrigerante',
    description: 'Lata 350ml',
    photoMenuItem: menuItemPhotos.refrigerante,
    price: 6,
    type: 'NON_ALCOHOLIC_DRINK',
  },
  {
    name: 'Suco natural',
    description: 'Jarra 1L',
    photoMenuItem: menuItemPhotos.suco,
    price: 22,
    type: 'NON_ALCOHOLIC_DRINK',
  },
  {
    name: 'Água mineral',
    description: '500ml',
    photoMenuItem: menuItemPhotos.agua,
    price: 5,
    type: 'NON_ALCOHOLIC_DRINK',
  },
  {
    name: 'Combo coffee break',
    description: 'Café, água e salgados para 20 pax',
    photoMenuItem: menuItemPhotos.combo,
    price: 280,
    type: 'COMBO',
  },
  {
    name: 'Buffet executivo',
    description: 'Consulte cardápio do chef',
    photoMenuItem: menuItemPhotos.comida,
    price: 65,
    type: 'FOOD',
  },
  {
    name: 'Espumante brinde',
    description: 'Taça para brinde',
    photoMenuItem: menuItemPhotos.champagne,
    price: 18,
    type: 'ALCOHOLIC_DRINK',
  },
];

const menuPackBalada: MenuItemSeed[] = [
  {
    name: 'Caipirinha',
    description: 'Tradicional',
    photoMenuItem: menuItemPhotos.caipirinha,
    price: 25,
    type: 'ALCOHOLIC_DRINK',
  },
  {
    name: 'Vodka energy',
    description: 'Dose + energético',
    photoMenuItem: menuItemPhotos.cocktail,
    price: 28,
    type: 'ALCOHOLIC_DRINK',
  },
  {
    name: 'Long neck',
    description: 'Seleção premium',
    photoMenuItem: menuItemPhotos.beer,
    price: 12,
    type: 'ALCOHOLIC_DRINK',
  },
  {
    name: 'Combo 4 cervejas',
    description: 'Com gelo e limão',
    photoMenuItem: menuItemPhotos.combo,
    price: 44,
    type: 'COMBO',
  },
  {
    name: 'Garrafa vodka',
    description: '750ml + gelo',
    photoMenuItem: menuItemPhotos.garrafaVodka,
    price: 190,
    type: 'BOTTLE',
  },
  {
    name: 'Narguile VIP',
    description: 'Sessão prolongada',
    photoMenuItem: menuItemPhotos.narguile,
    price: 60,
    type: 'HOOKAH',
  },
  {
    name: 'Refrigerante',
    description: 'Lata',
    photoMenuItem: menuItemPhotos.refrigerante,
    price: 8,
    type: 'NON_ALCOHOLIC_DRINK',
  },
  {
    name: 'Porção mix',
    description: 'Salgados sortidos',
    photoMenuItem: menuItemPhotos.petisco,
    price: 32,
    type: 'FOOD',
  },
];

/** Itens de cardápio por estabelecimento (cnpj -> itens). Apenas alguns têm menu. */
const menuItemsByCnpj: Record<string, MenuItemSeed[]> = {
  '12345678000191': [
    {
      name: 'Caipirinha',
      description: 'Limão, cachaça, gelo e açúcar',
      photoMenuItem: menuItemPhotos.caipirinha,
      price: 28,
      type: 'ALCOHOLIC_DRINK',
    },
    {
      name: 'Gin Tônica',
      description: 'Gin, água tônica e limão',
      photoMenuItem: menuItemPhotos.cocktail,
      price: 35,
      type: 'ALCOHOLIC_DRINK',
    },
    {
      name: 'Chopp',
      description: 'Chopp gelado 300ml',
      photoMenuItem: menuItemPhotos.beer,
      price: 12,
      type: 'ALCOHOLIC_DRINK',
    },
    {
      name: 'Água com gás',
      description: null,
      photoMenuItem: menuItemPhotos.agua,
      price: 6,
      type: 'NON_ALCOHOLIC_DRINK',
    },
    {
      name: 'Suco natural',
      description: 'Laranja, limão ou maracujá',
      photoMenuItem: menuItemPhotos.suco,
      price: 14,
      type: 'NON_ALCOHOLIC_DRINK',
    },
    {
      name: 'Combo 2 drinks',
      description: 'Qualquer 2 drinks do cardápio',
      photoMenuItem: menuItemPhotos.combo,
      price: 50,
      type: 'COMBO',
    },
    {
      name: 'Garrafa vodka',
      description: 'Vodka importada 750ml',
      photoMenuItem: menuItemPhotos.garrafaVodka,
      price: 180,
      type: 'BOTTLE',
    },
    {
      name: 'Narguile',
      description: 'Sabor da casa',
      photoMenuItem: menuItemPhotos.narguile,
      price: 45,
      type: 'HOOKAH',
    },
  ],
  '12345678000193': [
    {
      name: 'Caipirinha',
      description: 'Tradicional ou saborizada',
      photoMenuItem: menuItemPhotos.caipirinha,
      price: 26,
      type: 'ALCOHOLIC_DRINK',
    },
    {
      name: 'Cerveja long neck',
      description: 'Heineken, Stella ou Brahma',
      photoMenuItem: menuItemPhotos.beer,
      price: 10,
      type: 'ALCOHOLIC_DRINK',
    },
    {
      name: 'Vinho tinto taça',
      description: 'Taça 300ml',
      photoMenuItem: menuItemPhotos.wine,
      price: 22,
      type: 'ALCOHOLIC_DRINK',
    },
    {
      name: 'Refrigerante',
      description: 'Lata 350ml',
      photoMenuItem: menuItemPhotos.refrigerante,
      price: 7,
      type: 'NON_ALCOHOLIC_DRINK',
    },
    {
      name: 'Combo 4 long necks',
      description: '4 cervejas + gelo',
      photoMenuItem: menuItemPhotos.combo,
      price: 36,
      type: 'COMBO',
    },
    {
      name: 'Garrafa champagne',
      description: 'Espumante 750ml',
      photoMenuItem: menuItemPhotos.champagne,
      price: 220,
      type: 'BOTTLE',
    },
    {
      name: 'Narguile premium',
      description: 'Sessão 1h, sabores especiais',
      photoMenuItem: menuItemPhotos.narguile,
      price: 55,
      type: 'HOOKAH',
    },
  ],
  '12345678000195': [
    {
      name: 'Whisky dose',
      description: 'Jack Daniels ou Johnnie Walker',
      photoMenuItem: menuItemPhotos.whisky,
      price: 38,
      type: 'ALCOHOLIC_DRINK',
    },
    {
      name: 'Caipiroska',
      description: 'Vodka, limão e gelo',
      photoMenuItem: menuItemPhotos.cocktail,
      price: 32,
      type: 'ALCOHOLIC_DRINK',
    },
    {
      name: 'Água mineral',
      description: '500ml',
      photoMenuItem: menuItemPhotos.agua,
      price: 5,
      type: 'NON_ALCOHOLIC_DRINK',
    },
    {
      name: 'Combo open bar 2h',
      description: 'Drinks à vontade por 2 horas',
      photoMenuItem: menuItemPhotos.combo,
      price: 120,
      type: 'COMBO',
    },
    {
      name: 'Garrafa vinho',
      description: 'Tinto ou branco 750ml',
      photoMenuItem: menuItemPhotos.garrafaVinho,
      price: 95,
      type: 'BOTTLE',
    },
    {
      name: 'Narguile',
      description: 'Menta, maçã ou pêssego',
      photoMenuItem: menuItemPhotos.narguile,
      price: 40,
      type: 'HOOKAH',
    },
    {
      name: 'Porção batata frita',
      description: 'Serve 2 pessoas',
      photoMenuItem: menuItemPhotos.petisco,
      price: 25,
      type: 'FOOD',
    },
  ],
  '12345678000192': [
    {
      name: 'Refrigerante',
      description: 'Lata 350ml',
      photoMenuItem: menuItemPhotos.refrigerante,
      price: 5,
      type: 'NON_ALCOHOLIC_DRINK',
    },
    {
      name: 'Suco de laranja',
      description: '500ml',
      photoMenuItem: menuItemPhotos.suco,
      price: 10,
      type: 'NON_ALCOHOLIC_DRINK',
    },
    {
      name: 'Combo festa',
      description: 'Refrigerante + salgados para 10 pessoas',
      photoMenuItem: menuItemPhotos.combo,
      price: 150,
      type: 'COMBO',
    },
    {
      name: 'Salada de frutas',
      description: 'Porção individual',
      photoMenuItem: menuItemPhotos.comida,
      price: 18,
      type: 'FOOD',
    },
  ],
  // Canoas / Porto Alegre — novos seeds
  '12345678000197': menuPackLoungeFull,
  '12345678000198': menuPackBalada,
  '12345678000199': menuPackPartyHall,
  '12345678000200': menuPackLoungeFull,
  '12345678000201': menuPackPartyHall,
  '12345678000202': menuPackLoungePOA,
  '12345678000203': menuPackLoungePOA,
  '12345678000204': menuPackBalada,
  '12345678000205': menuPackPartyHall,
  '12345678000206': menuPackLoungePOA,
  '12345678000207': menuPackLoungePOA,
  '12345678000208': menuPackBalada,
  '12345678000209': menuPackLoungePOA,
  '12345678000210': menuPackPartyHall,
  '12345678000211': menuPackBalada,
};

/** Quotes por CNPJ (até 80 caracteres). Recriadas no seed com validade de 12h. */
const quotesByCnpj: Record<string, string[]> = {
  '12345678000191': [
    'Hoje: happy hour 2x1 em drinks até 20h! 🍹',
    'Entrada free para lista VIP — chama no Insta!',
  ],
  '12345678000192': [
    'Pacote festa infantil com desconto para reservas nesta semana.',
  ],
  '12345678000193': [
    'Sexta e sábado: DJ ao vivo a partir das 23h.',
    'Combo open bar especial — consulte no balcão.',
  ],
  '12345678000194': ['Hoje tem open format até 1h! Não fica de fora.'],
  '12345678000195': [
    'Garrafa com gelo e energético em promo no fim de semana.',
    'Reserva de mesa pelo Instagram @loungesaoluis',
  ],
  '12345678000196': [
    'Buffet completo para eventos corporativos — orçamento sem custo.',
  ],
  '12345678000197': [
    'Canoas: open bar especial de quinta a sábado. Chama no Insta!',
    'Reserva de mesa VIP com cortesia na primeira rodada.',
  ],
  '12345678000198': [
    'Igara: lista amiga até 1h — manda DM com nome completo.',
    'Combo garrafa + energético com desconto no fim de semana.',
  ],
  '12345678000199': [
    'Harmonia: pacote festa com buffet e decoração — orçamento grátis.',
  ],
  '12345678000200': [
    'Verona Lounge: sunset com DJ às sextas. Entrada promocional até 22h.',
  ],
  '12345678000201': [
    'Nilo Peçanha: salão climatizado para formaturas e casamentos.',
  ],
  '12345678000202': [
    'POA: happy hour estendido na Cidade Baixa. 2x1 em clássicos.',
  ],
  '12345678000203': [
    'Moinhos: rooftop com vista — reserve mesa pelo app.',
    'Garrafa premium com gelo e mixers na promo sexta.',
  ],
  '12345678000204': [
    'Cidade Baixa: noite eletrônica — ingresso antecipado no link da bio.',
  ],
  '12345678000205': [
    'Zona Sul: salão para 15 anos com DJ e buffet — vagas limitadas.',
  ],
  '12345678000206': [
    'Centro Histórico: jazz ao vivo às quintas. Mesa com consumação.',
  ],
  '12345678000207': ['Moinhos de Vento: wine bar — taças em dobro na terça.'],
  '12345678000208': [
    'Azenha: festa temática todo sábado. Dress code na descrição do evento.',
  ],
  '12345678000209': [
    'Bom Fim: drinks autorais e petiscos — reserva para grupos 6+.',
  ],
  '12345678000210': [
    'Cristal: espaço para eventos corporativos com coffee e almoço.',
  ],
  '12345678000211': [
    'Passo d Areia: sunset party domingo — entrada free até 19h.',
  ],
};

type EventListTypeSeed = 'GENERAL' | 'FREE_LIST' | 'FRIEND_LIST' | 'VIP';

type ScheduledEventSeed = {
  name: string;
  description?: string;
  attractions?: string;
  dj?: string;
  priceInfo?: string;
  /** Dias a partir da data UTC do seed (0 = hoje) */
  daysFromNow: number;
  startHourUTC: number;
  startMinuteUTC?: number;
  durationHours?: number;
  listType: EventListTypeSeed;
  posterImageUrl?: string;
  offersTableReservation?: boolean;
  tablePeopleCapacity?: number;
  tablesAvailable?: number;
  offersBoothReservation?: boolean;
  boothPeopleCapacity?: number;
  boothsAvailable?: number;
  /** Valor por mesa (reais, ex.: 134.23) */
  tablePrice?: number;
  /** Valor por camarote (reais) */
  boothPrice?: number;
};

/** Eventos agendados por CNPJ (recriados no seed com datas futuras). */
const scheduledEventsByCnpj: Record<string, ScheduledEventSeed[]> = {
  '12345678000191': [
    {
      name: 'Noite do Samba & Pagode',
      description: 'Especial de verão com open de caipirinha na entrada.',
      attractions: 'Grupo Raízes do Sul\nParticipação especial',
      dj: 'DJ Marquinhos',
      priceInfo:
        'Lista amiga até 22h | Entrada R$ 40 após | VIP camarote R$ 150',
      daysFromNow: 3,
      startHourUTC: 23,
      durationHours: 6,
      listType: 'FRIEND_LIST',
      posterImageUrl:
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 6,
      tablesAvailable: 12,
      tablePrice: 134.23,
    },
    {
      name: 'Sexta Eletrônica',
      description: 'House e techno com pista principal e lounge.',
      attractions: 'Line-up surpresa',
      dj: 'DJ Ana Bloom',
      priceInfo: 'Entrada R$ 35 | Lista free até 21h (masc/fem)',
      daysFromNow: 10,
      startHourUTC: 22,
      durationHours: 7,
      listType: 'FREE_LIST',
      posterImageUrl:
        'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 8,
      tablesAvailable: 15,
      offersBoothReservation: true,
      boothPeopleCapacity: 6,
      boothsAvailable: 4,
      tablePrice: 280.5,
      boothPrice: 899.99,
    },
  ],
  '12345678000192': [
    {
      name: 'Pacote Festa Teen — Sábado',
      description: 'Salão decorado, DJ e buffet para até 80 convidados.',
      attractions: 'Animação\nBrinde para o aniversariante',
      dj: 'DJ Kids Party',
      priceInfo: 'Consulte valores no Instagram @festasnossasenhora',
      daysFromNow: 14,
      startHourUTC: 16,
      durationHours: 5,
      listType: 'GENERAL',
      posterImageUrl:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 8,
      tablesAvailable: 20,
      tablePrice: 350.75,
    },
  ],
  '12345678000193': [
    {
      name: 'Open Format — Especial Funk',
      dj: 'DJ Tubarão',
      priceInfo: 'Mesa para 6: R$ 450 | Entrada avulsa R$ 45',
      daysFromNow: 5,
      startHourUTC: 21,
      durationHours: 8,
      listType: 'VIP',
      posterImageUrl:
        'https://images.unsplash.com/photo-1572119699694-47089d979b0c?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 6,
      tablesAvailable: 10,
      offersBoothReservation: true,
      boothPeopleCapacity: 10,
      boothsAvailable: 4,
      tablePrice: 450,
      boothPrice: 1200.5,
    },
    {
      name: 'Domingo Sunset',
      description: 'Música ao vivo e drinks em dobro até 20h.',
      attractions: 'Banda Acústico RS',
      priceInfo: 'Entrada R$ 25',
      daysFromNow: 7,
      startHourUTC: 19,
      durationHours: 4,
      listType: 'GENERAL',
      posterImageUrl:
        'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 4,
      tablesAvailable: 8,
      offersBoothReservation: true,
      boothPeopleCapacity: 6,
      boothsAvailable: 3,
      tablePrice: 89.9,
      boothPrice: 320.75,
    },
  ],
  '12345678000194': [
    {
      name: 'House Party — Edição Carnaval',
      attractions: 'Concurso de fantasia\nPrêmios',
      dj: 'DJ Line + convidados',
      priceInfo: 'Lista VIP camarote | Entrada R$ 50',
      daysFromNow: 2,
      startHourUTC: 22,
      durationHours: 8,
      listType: 'VIP',
      posterImageUrl:
        'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600',
      offersBoothReservation: true,
      boothPeopleCapacity: 8,
      boothsAvailable: 5,
      boothPrice: 550.25,
    },
  ],
  '12345678000195': [
    {
      name: 'Noite Premium — Whisky & Jazz',
      description: 'Ambiente reservado no mezanino.',
      dj: 'DJ Smooth',
      priceInfo: 'Consumação mínima R$ 120 | Reserva pelo Insta',
      daysFromNow: 6,
      startHourUTC: 21,
      durationHours: 5,
      listType: 'VIP',
      posterImageUrl:
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 4,
      tablesAvailable: 6,
      offersBoothReservation: true,
      boothPeopleCapacity: 12,
      boothsAvailable: 3,
      tablePrice: 199.99,
      boothPrice: 1499.9,
    },
    {
      name: 'Quinta do Pagode',
      priceInfo: 'Lista amiga até 23h',
      daysFromNow: 1,
      startHourUTC: 20,
      durationHours: 6,
      listType: 'FRIEND_LIST',
      posterImageUrl:
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 6,
      tablesAvailable: 12,
      offersBoothReservation: true,
      boothPeopleCapacity: 8,
      boothsAvailable: 4,
      tablePrice: 95.5,
      boothPrice: 450,
    },
  ],
  '12345678000196': [
    {
      name: 'Formatura & Corporativo — Open House',
      description: 'Venha conhecer o espaço e cardápio para seu evento.',
      attractions: 'Tour pelo salão\nDegustação do buffet',
      priceInfo: 'Entrada gratuita com confirmação no WhatsApp',
      daysFromNow: 12,
      startHourUTC: 15,
      durationHours: 3,
      listType: 'FREE_LIST',
      posterImageUrl:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 10,
      tablesAvailable: 5,
      offersBoothReservation: true,
      boothPeopleCapacity: 15,
      boothsAvailable: 2,
      tablePrice: 210.33,
      boothPrice: 850,
    },
  ],
  '12345678000197': [
    {
      name: 'Quinta Sunset — Canoas',
      description: 'Open de caipirinha na primeira hora e DJ set chill.',
      dj: 'DJ Litoral',
      priceInfo: 'Lista amiga até 22h | Mesa 6 pax R$ 120',
      daysFromNow: 4,
      startHourUTC: 22,
      durationHours: 5,
      listType: 'FRIEND_LIST',
      posterImageUrl:
        'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 6,
      tablesAvailable: 14,
      tablePrice: 120,
    },
    {
      name: 'Sábado Premium Lounge',
      attractions: 'House progressivo\nBar autoral',
      dj: 'DJ Matheus POA',
      priceInfo: 'Entrada R$ 35 | VIP mesa R$ 220',
      daysFromNow: 11,
      startHourUTC: 23,
      durationHours: 6,
      listType: 'VIP',
      posterImageUrl:
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 6,
      tablesAvailable: 10,
      offersBoothReservation: true,
      boothPeopleCapacity: 8,
      boothsAvailable: 3,
      tablePrice: 220,
      boothPrice: 680,
    },
  ],
  '12345678000198': [
    {
      name: 'Noite Eletrônica — Igara',
      description: 'Pista principal + lounge com narguile.',
      dj: 'DJ Voltage',
      priceInfo: 'Lista free até 1h (masc/fem) | Depois R$ 40',
      daysFromNow: 5,
      startHourUTC: 23,
      durationHours: 7,
      listType: 'FREE_LIST',
      posterImageUrl:
        'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 8,
      tablesAvailable: 18,
      tablePrice: 260,
    },
    {
      name: 'Funk & Open Bar Parcial',
      attractions: 'Line-up convidado',
      dj: 'DJ Tubarão RS',
      priceInfo: 'Camarote 10 pax — consulte',
      daysFromNow: 18,
      startHourUTC: 22,
      durationHours: 8,
      listType: 'VIP',
      posterImageUrl:
        'https://images.unsplash.com/photo-1572119699694-47089d979b0c?w=600',
      offersBoothReservation: true,
      boothPeopleCapacity: 10,
      boothsAvailable: 5,
      boothPrice: 950,
    },
  ],
  '12345678000199': [
    {
      name: 'Open House — Formaturas',
      description: 'Tour pelo salão e degustação do buffet.',
      attractions: 'Equipe de eventos presente',
      priceInfo: 'Entrada gratuita com RSVP',
      daysFromNow: 9,
      startHourUTC: 15,
      durationHours: 3,
      listType: 'FREE_LIST',
      posterImageUrl:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 10,
      tablesAvailable: 8,
      tablePrice: 0,
    },
    {
      name: 'Casamento — Noite de degustação',
      description: 'Menu degustação para noivos (vagas limitadas).',
      priceInfo: 'Confirmação pelo Instagram',
      daysFromNow: 22,
      startHourUTC: 19,
      durationHours: 4,
      listType: 'GENERAL',
      posterImageUrl:
        'https://images.unsplash.com/photo-1519167758481-83f29da8c0f4?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 4,
      tablesAvailable: 12,
      tablePrice: 89.9,
    },
  ],
  '12345678000200': [
    {
      name: 'Verona — Jazz ao pôr do sol',
      attractions: 'Trio acústico',
      priceInfo: 'Consumação mínima R$ 60 por mesa',
      daysFromNow: 2,
      startHourUTC: 20,
      durationHours: 4,
      listType: 'GENERAL',
      posterImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 4,
      tablesAvailable: 10,
      tablePrice: 60,
    },
    {
      name: 'Sexta Verona — DJ & Drinks',
      dj: 'DJ Sunset',
      priceInfo: 'Happy hour até 22h',
      daysFromNow: 6,
      startHourUTC: 21,
      durationHours: 6,
      listType: 'FRIEND_LIST',
      posterImageUrl:
        'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 6,
      tablesAvailable: 12,
      tablePrice: 110.5,
    },
  ],
  '12345678000201': [
    {
      name: 'Pacote Festa — Sábado Nilo Peçanha',
      description: 'Salão climatizado, som e iluminação inclusos.',
      attractions: 'DJ + MC opcional',
      dj: 'DJ Festa Total',
      priceInfo: 'Orçamento no WhatsApp do espaço',
      daysFromNow: 16,
      startHourUTC: 17,
      durationHours: 6,
      listType: 'GENERAL',
      posterImageUrl:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 8,
      tablesAvailable: 25,
      tablePrice: 320,
    },
  ],
  '12345678000202': [
    {
      name: 'Happy Hour Estendido — Cidade Baixa',
      description: '2x1 em drinks clássicos até 21h.',
      dj: 'DJ Baixa',
      priceInfo: 'Entrada free',
      daysFromNow: 1,
      startHourUTC: 19,
      durationHours: 5,
      listType: 'FREE_LIST',
      posterImageUrl:
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 4,
      tablesAvailable: 20,
      tablePrice: 75,
    },
    {
      name: 'Sábado Open Format',
      attractions: 'Pop, funk e hits',
      dj: 'DJ Line POA',
      priceInfo: 'Mesa VIP R$ 300',
      daysFromNow: 8,
      startHourUTC: 22,
      durationHours: 7,
      listType: 'VIP',
      posterImageUrl:
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 6,
      tablesAvailable: 15,
      offersBoothReservation: true,
      boothPeopleCapacity: 8,
      boothsAvailable: 4,
      tablePrice: 300,
      boothPrice: 720,
    },
  ],
  '12345678000203': [
    {
      name: 'Rooftop Sunset — Moinhos',
      description: 'Vista da cidade e drinks autorais.',
      priceInfo: 'Reserva obrigatória para mesa na varanda',
      daysFromNow: 3,
      startHourUTC: 20,
      durationHours: 5,
      listType: 'GENERAL',
      posterImageUrl:
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 4,
      tablesAvailable: 8,
      tablePrice: 150,
    },
    {
      name: 'Noite Garrafa Premium',
      dj: 'DJ Skyline',
      priceInfo: 'Promo garrafa + mixers na sexta',
      daysFromNow: 12,
      startHourUTC: 23,
      durationHours: 6,
      listType: 'VIP',
      posterImageUrl:
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 8,
      tablesAvailable: 10,
      tablePrice: 400,
    },
  ],
  '12345678000204': [
    {
      name: 'Techno Night — Cidade Baixa',
      description: 'Pista dark room + lounge.',
      dj: 'DJ Berlin POA',
      priceInfo: 'Ingresso antecipado R$ 45',
      daysFromNow: 7,
      startHourUTC: 23,
      durationHours: 8,
      listType: 'GENERAL',
      posterImageUrl:
        'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600',
      offersBoothReservation: true,
      boothPeopleCapacity: 6,
      boothsAvailable: 6,
      boothPrice: 499.99,
    },
  ],
  '12345678000205': [
    {
      name: 'Showcase 15 anos — Zona Sul',
      description: 'Pacote com buffet, DJ e decoração base.',
      attractions: 'Animação teen',
      dj: 'DJ Teen RS',
      priceInfo: 'Vagas para visita ao salão aos sábados',
      daysFromNow: 13,
      startHourUTC: 14,
      durationHours: 3,
      listType: 'FREE_LIST',
      posterImageUrl:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 10,
      tablesAvailable: 6,
      tablePrice: 180,
    },
    {
      name: 'Festa teen — Sábado à noite',
      priceInfo: 'Consulte pacotes fechados',
      daysFromNow: 20,
      startHourUTC: 19,
      durationHours: 5,
      listType: 'GENERAL',
      posterImageUrl:
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 8,
      tablesAvailable: 15,
      tablePrice: 290,
    },
  ],
  '12345678000206': [
    {
      name: 'Jazz na Quinta — Centro Histórico',
      attractions: 'Quarteto instrumental',
      priceInfo: 'Mesa com consumação mínima R$ 90',
      daysFromNow: 4,
      startHourUTC: 20,
      durationHours: 4,
      listType: 'GENERAL',
      posterImageUrl:
        'https://images.unsplash.com/photo-1415201365734-1fe477688aaa?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 4,
      tablesAvailable: 12,
      tablePrice: 90,
    },
    {
      name: 'Blues & Soul — Edição especial',
      dj: 'DJ Vinyl',
      priceInfo: 'Entrada R$ 30',
      daysFromNow: 17,
      startHourUTC: 21,
      durationHours: 5,
      listType: 'FRIEND_LIST',
      posterImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 6,
      tablesAvailable: 8,
      tablePrice: 125,
    },
  ],
  '12345678000207': [
    {
      name: 'Wine Tuesday — Moinhos de Vento',
      description: 'Taças em dobro em rótulos selecionados.',
      priceInfo: 'Reserva para grupos 4+',
      daysFromNow: 5,
      startHourUTC: 19,
      durationHours: 4,
      listType: 'VIP',
      posterImageUrl:
        'https://images.unsplash.com/photo-1510812431401-41d2d2c81880?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 4,
      tablesAvailable: 14,
      tablePrice: 85.5,
    },
  ],
  '12345678000208': [
    {
      name: 'Festa Temática — Azenha',
      description: 'Dress code divulgado no Instagram.',
      attractions: 'Concurso de melhor fantasia',
      dj: 'DJ Azenha',
      priceInfo: 'Lista amiga até meia-noite',
      daysFromNow: 6,
      startHourUTC: 22,
      durationHours: 7,
      listType: 'FRIEND_LIST',
      posterImageUrl:
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 6,
      tablesAvailable: 16,
      tablePrice: 140,
    },
    {
      name: 'Domingo Day Party',
      priceInfo: 'Entrada R$ 25 | Open bar parcial 18h–20h',
      daysFromNow: 14,
      startHourUTC: 18,
      durationHours: 5,
      listType: 'GENERAL',
      posterImageUrl:
        'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 6,
      tablesAvailable: 10,
      tablePrice: 95,
    },
  ],
  '12345678000209': [
    {
      name: 'Bom Fim — Coquetéis autorais',
      description: 'Menu harmonizado com petiscos.',
      priceInfo: 'Reserva para 6+ pessoas',
      daysFromNow: 2,
      startHourUTC: 20,
      durationHours: 5,
      listType: 'GENERAL',
      posterImageUrl:
        'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 6,
      tablesAvailable: 9,
      tablePrice: 155,
    },
    {
      name: 'Sexta Friends — lista VIP',
      dj: 'DJ Bom Fim',
      priceInfo: 'VIP até 23h',
      daysFromNow: 10,
      startHourUTC: 22,
      durationHours: 6,
      listType: 'FRIEND_LIST',
      posterImageUrl:
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 6,
      tablesAvailable: 11,
      tablePrice: 130,
    },
  ],
  '12345678000210': [
    {
      name: 'Corporativo — Coffee & Networking',
      description: 'Café da manhã e palestra rápida sobre eventos.',
      priceInfo: 'Confirmação por e-mail',
      daysFromNow: 11,
      startHourUTC: 9,
      startMinuteUTC: 30,
      durationHours: 2,
      listType: 'FREE_LIST',
      posterImageUrl:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 8,
      tablesAvailable: 10,
      tablePrice: 0,
    },
  ],
  '12345678000211': [
    {
      name: 'Sunset Guaíba — Passo d Areia',
      description: 'Música ao vivo e entrada free até 19h.',
      attractions: 'Banda regional',
      priceInfo: 'Depois das 19h R$ 20',
      daysFromNow: 0,
      startHourUTC: 17,
      durationHours: 5,
      listType: 'FREE_LIST',
      posterImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 6,
      tablesAvailable: 20,
      tablePrice: 70,
    },
    {
      name: 'Domingo na Orla',
      dj: 'DJ Praia',
      priceInfo: 'Petiscos e chopp em promo',
      daysFromNow: 9,
      startHourUTC: 16,
      durationHours: 6,
      listType: 'GENERAL',
      posterImageUrl:
        'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600',
      offersTableReservation: true,
      tablePeopleCapacity: 6,
      tablesAvailable: 14,
      tablePrice: 88,
    },
  ],
};

function buildEventDates(seed: ScheduledEventSeed, now: Date) {
  const startsAt = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + seed.daysFromNow,
      seed.startHourUTC,
      seed.startMinuteUTC ?? 0,
      0,
      0,
    ),
  );
  const endsAt =
    seed.durationHours != null
      ? new Date(startsAt.getTime() + seed.durationHours * 60 * 60 * 1000)
      : null;
  return { startsAt, endsAt };
}

async function cleanDatabase() {
  console.log('Limpando banco de dados...');

  await prisma.orderItem.deleteMany();
  await prisma.customerOrder.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.scheduledEvent.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.establishmentEmployee.deleteMany();
  await prisma.establishment.deleteMany();
  await prisma.user.deleteMany();

  console.log('Banco de dados limpo com sucesso.');
}

async function main() {
  await cleanDatabase();

  for (const e of establishments) {
    await prisma.establishment.upsert({
      where: { cnpj: e.cnpj },
      /** Sincroniza dados do seed a cada execução (telefone, endereço, etc.). */
      update: {
        name: e.name,
        address: e.address,
        addressNumber: e.addressNumber,
        city: e.city,
        state: e.state,
        zipCode: e.zipCode,
        phone: e.phone,
        email: e.email,
        instagram: e.instagram,
        establishmentType: e.establishmentType,
        profilePhoto: e.profilePhoto,
        latitude: e.latitude,
        longitude: e.longitude,
        score: e.score,
        openingHours: e.openingHours,
      },
      create: e,
    });
  }

  /** Dono seed: mesmo `email` e `phone` da ficha; senha dev partilhada para login no portal (`POST /auth/login-email`). */
  const SEED_OWNER_PASSWORD_PLAIN = 'Owner123!';
  const ownerPasswordHash = await bcrypt.hash(SEED_OWNER_PASSWORD_PLAIN, 10);
  for (const e of establishments) {
    const est = await prisma.establishment.findUnique({
      where: { cnpj: e.cnpj },
    });
    if (!est) continue;
    const ownerUser = await prisma.user.upsert({
      where: { phone: e.phone },
      create: {
        name: `Dono — ${e.name}`,
        phone: e.phone,
        email: e.email,
        password: ownerPasswordHash,
        role: 'OWNER_ESTABLISHMENT',
        dateOfBirth: new Date('1990-01-01'),
        acceptedTermsOfUse: true,
        acceptedPrivacyPolicy: true,
      },
      update: {
        name: `Dono — ${e.name}`,
        email: e.email,
        password: ownerPasswordHash,
        role: 'OWNER_ESTABLISHMENT',
        dateOfBirth: new Date('1990-01-01'),
        acceptedTermsOfUse: true,
        acceptedPrivacyPolicy: true,
      },
    });
    await prisma.establishment.update({
      where: { id: est.id },
      data: { ownerUserId: ownerUser.id },
    });
  }
  console.log(
    `seedOwners | ${establishments.length} dono(s): POST /auth/login-email com o e-mail de contacto de cada estabelecimento | senha dev (todos): ${SEED_OWNER_PASSWORD_PLAIN}`,
  );

  /** Lounge Canoas Centro: recompensa pós-feedback ligada (para testar `POST /feedbacks` → `reward`). */
  const loungeCentroCnpj = '12345678000191';
  await prisma.establishment.update({
    where: { cnpj: loungeCentroCnpj },
    data: {
      feedbackRewardEnabled: true,
      feedbackRewardMessage:
        'Obrigado pelo feedback! Você ganha 10% de desconto na próxima consumação — mostre este aviso no balcão.',
    },
  });
  console.log(
    `Recompensa pós-feedback ativa: Lounge Canoas Centro (CNPJ ${loungeCentroCnpj}).`,
  );

  /** Verona Rooftop Canoas: recompensa pós-feedback (rooftop). */
  const veronaRooftopCnpj = '12345678000200';
  await prisma.establishment.update({
    where: { cnpj: veronaRooftopCnpj },
    data: {
      feedbackRewardEnabled: true,
      feedbackRewardMessage:
        'Obrigado pelo feedback no Verona Rooftop! Você ganha uma caipirinha tradicional na próxima visita — mostre este aviso na recepção do rooftop.',
    },
  });
  console.log(
    `Recompensa pós-feedback ativa: Verona Rooftop Canoas (CNPJ ${veronaRooftopCnpj}).`,
  );

  console.log(
    `Seed concluído: ${establishments.length} estabelecimentos (Canoas e Porto Alegre, RS).`,
  );

  /**
   * Funcionário de teste no Lounge Canoas Centro (mesmo estabelecimento dos pedidos seed).
   * `seedEmployeeUserId` é preenchido após o upsert e usado como `userId` dos `customer_orders` seed.
   */
  const seedEmployeeCnpj = '12345678000191';
  const seedEmployee = {
    phone: '51999999999',
    name: 'Funcionário Seed',
    email: 'funcionario.seed1@vibenow.test',
    passwordPlain: 'Employee123!',
  };
  let seedEmployeeUserId: number | undefined;
  const loungeCanoas = await prisma.establishment.findUnique({
    where: { cnpj: seedEmployeeCnpj },
  });
  if (loungeCanoas) {
    const hashed = await bcrypt.hash(seedEmployee.passwordPlain, 10);
    const employeeUser = await prisma.user.upsert({
      where: { phone: seedEmployee.phone },
      create: {
        name: seedEmployee.name,
        phone: seedEmployee.phone,
        email: seedEmployee.email,
        password: hashed,
        role: 'EMPLOYEE_ESTABLISHMENT',
        dateOfBirth: new Date('1995-06-15'),
        acceptedTermsOfUse: true,
        acceptedPrivacyPolicy: true,
      },
      update: {
        name: seedEmployee.name,
        email: seedEmployee.email,
        password: hashed,
        role: 'EMPLOYEE_ESTABLISHMENT',
        dateOfBirth: new Date('1995-06-15'),
        acceptedTermsOfUse: true,
        acceptedPrivacyPolicy: true,
      },
    });
    seedEmployeeUserId = employeeUser.id;
    await prisma.establishmentEmployee.upsert({
      where: {
        establishmentId_userId: {
          establishmentId: loungeCanoas.id,
          userId: employeeUser.id,
        },
      },
      create: {
        establishmentId: loungeCanoas.id,
        userId: employeeUser.id,
      },
      update: {},
    });
    console.log(
      `seedEmployee | userId=${employeeUser.id} | telefone ${seedEmployee.phone} | senha: ${seedEmployee.passwordPlain} | establishmentId=${loungeCanoas.id} (${loungeCanoas.name}) | painel: GET /establishments/${loungeCanoas.id}/orders | login: POST /auth/login`,
    );
  } else {
    console.warn(
      `Seed employee: estabelecimento CNPJ ${seedEmployeeCnpj} não encontrado; funcionário de teste não criado.`,
    );
  }

  // Menus com itens apenas para estabelecimentos que têm entrada em menuItemsByCnpj
  const establishmentIds = await prisma.establishment.findMany({
    select: { id: true, cnpj: true },
  });
  let menusCreated = 0;
  for (const est of establishmentIds) {
    const items = menuItemsByCnpj[est.cnpj];
    if (!items?.length) continue;
    const existingMenu = await prisma.menu.findUnique({
      where: { establishmentId: est.id },
    });
    if (existingMenu) {
      await prisma.menuItem.deleteMany({
        where: { menuId: existingMenu.id },
      });
      await prisma.menu.delete({ where: { id: existingMenu.id } });
    }
    const menu = await prisma.menu.create({
      data: { establishmentId: est.id },
    });
    for (const it of items) {
      await prisma.menuItem.create({
        data: {
          menuId: menu.id,
          name: it.name,
          description: it.description ?? undefined,
          photoMenuItem: it.photoMenuItem,
          price: it.price,
          type: it.type,
        },
      });
    }
    menusCreated++;
  }
  console.log(`Menus criados/atualizados: ${menusCreated} (com itens).`);

  /**
   * Pedidos de teste no mesmo estabelecimento do `seedEmployee` (Lounge Canoas Centro).
   * `userId` dos pedidos = `seedEmployeeUserId` (funcionário criado acima).
   * Abertos: PENDING / IN_PROGRESS / READY. Finalizados: DELIVERED / CANCELLED.
   * Idempotente: apaga pedidos seed deste estabelecimento pelo prefixo em locationNote.
   */
  const SEED_ORDER_NOTE_PREFIX = '[SEED_ORDER]';
  const seedOrdersCnpj = seedEmployeeCnpj;
  const seedOrderUserId =
    seedEmployeeUserId ??
    (
      await prisma.user.findUnique({
        where: { phone: seedEmployee.phone },
        select: { id: true },
      })
    )?.id;
  const seedOrderUser =
    seedOrderUserId != null
      ? await prisma.user.findUnique({ where: { id: seedOrderUserId } })
      : null;
  const estForSeedOrders = await prisma.establishment.findUnique({
    where: { cnpj: seedOrdersCnpj },
    select: { id: true, name: true },
  });
  if (!seedOrderUserId || !seedOrderUser) {
    console.warn(
      `Seed orders: utilizador seedEmployee não encontrado (telefone ${seedEmployee.phone}); pedidos de teste não criados.`,
    );
  } else if (!estForSeedOrders) {
    console.warn(
      `Seed orders: estabelecimento CNPJ ${seedOrdersCnpj} não encontrado.`,
    );
  } else {
    const menuForOrders = await prisma.menu.findUnique({
      where: { establishmentId: estForSeedOrders.id },
      include: { items: { orderBy: { id: 'asc' } } },
    });
    if (!menuForOrders?.items.length) {
      console.warn(
        `Seed orders: sem itens de cardápio no estabelecimento id=${estForSeedOrders.id}.`,
      );
    } else {
      await prisma.customerOrder.deleteMany({
        where: {
          establishmentId: estForSeedOrders.id,
          locationNote: { startsWith: SEED_ORDER_NOTE_PREFIX },
        },
      });
      const mi = menuForOrders.items;
      const line = (
        item: (typeof mi)[number],
        quantity: number,
      ): {
        menuItemId: number;
        quantity: number;
        unitPrice: typeof item.price;
        itemName: string;
      } => ({
        menuItemId: item.id,
        quantity,
        unitPrice: item.price,
        itemName: item.name,
      });

      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      /** Pedidos ainda em curso (painel “ativos”). */
      await prisma.customerOrder.create({
        data: {
          establishmentId: estForSeedOrders.id,
          userId: seedOrderUserId,
          locationNote: `${SEED_ORDER_NOTE_PREFIX} Mesa 12 — área principal`,
          status: 'PENDING',
          items: {
            create: [line(mi[0], 2), line(mi[mi.length > 1 ? 1 : 0], 1)],
          },
        },
      });
      await prisma.customerOrder.create({
        data: {
          establishmentId: estForSeedOrders.id,
          userId: seedOrderUserId,
          locationNote: `${SEED_ORDER_NOTE_PREFIX} Camarote B / número 4`,
          status: 'IN_PROGRESS',
          items: { create: [line(mi[0], 1)] },
        },
      });
      await prisma.customerOrder.create({
        data: {
          establishmentId: estForSeedOrders.id,
          userId: seedOrderUserId,
          locationNote: `${SEED_ORDER_NOTE_PREFIX} Área externa — mesa alta`,
          status: 'READY',
          items: {
            create:
              mi.length >= 3
                ? [line(mi[2], 3)]
                : [line(mi[0], 1), line(mi[mi.length > 1 ? 1 : 0], 2)],
          },
        },
      });
      await prisma.customerOrder.create({
        data: {
          establishmentId: estForSeedOrders.id,
          userId: seedOrderUserId,
          locationNote: `${SEED_ORDER_NOTE_PREFIX} Bar — bancada`,
          status: 'PENDING',
          items: { create: [line(mi[0], 1)] },
        },
      });

      /** Pedidos finalizados (histórico / filtros DELIVERED ou CANCELLED). */
      await prisma.customerOrder.create({
        data: {
          establishmentId: estForSeedOrders.id,
          userId: seedOrderUserId,
          locationNote: `${SEED_ORDER_NOTE_PREFIX} Mesa 3 — entregue ontem`,
          status: 'DELIVERED',
          createdAt: twoDaysAgo,
          items: {
            create: [line(mi[mi.length > 1 ? 1 : 0], 2)],
          },
        },
      });
      await prisma.customerOrder.create({
        data: {
          establishmentId: estForSeedOrders.id,
          userId: seedOrderUserId,
          locationNote: `${SEED_ORDER_NOTE_PREFIX} VIP 1 — cliente desistiu`,
          status: 'CANCELLED',
          createdAt: threeDaysAgo,
          items: { create: [line(mi[0], 1)] },
        },
      });

      console.log(
        `Pedidos seed: 4 abertos (2×PENDING, IN_PROGRESS, READY) + 2 finalizados (DELIVERED, CANCELLED) | userId=${seedOrderUserId} (= seedEmployee) | establishmentId=${estForSeedOrders.id} (${estForSeedOrders.name}).`,
      );
    }
  }

  const TWELVE_H_MS = 12 * 60 * 60 * 1000;
  let quotesCreated = 0;
  for (const est of establishmentIds) {
    const texts = quotesByCnpj[est.cnpj];
    if (!texts?.length) continue;
    await prisma.quote.deleteMany({ where: { establishmentId: est.id } });
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TWELVE_H_MS);
    for (const text of texts) {
      await prisma.quote.create({
        data: {
          establishmentId: est.id,
          text: text.slice(0, 80),
          expiresAt,
        },
      });
      quotesCreated++;
    }
  }
  console.log(
    `Quotes criadas: ${quotesCreated} (válidas por 12h a partir do seed).`,
  );

  const seedNow = new Date();
  let eventsCreated = 0;
  /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  for (const est of establishmentIds) {
    const eventSeeds = scheduledEventsByCnpj[est.cnpj];
    if (!eventSeeds?.length) continue;
    await prisma.scheduledEvent.deleteMany({
      where: { establishmentId: est.id },
    });
    for (const ev of eventSeeds) {
      const { startsAt, endsAt } = buildEventDates(ev, seedNow);
      await prisma.scheduledEvent.create({
        data: {
          establishmentId: est.id,
          name: ev.name,
          description: ev.description ?? undefined,
          attractions: ev.attractions ?? undefined,
          dj: ev.dj ?? undefined,
          priceInfo: ev.priceInfo ?? undefined,
          eventStartsAt: startsAt,
          eventEndsAt: endsAt ?? undefined,
          listType: ev.listType,
          posterImageUrl: ev.posterImageUrl ?? undefined,
          offersTableReservation: ev.offersTableReservation ?? false,
          tablePeopleCapacity:
            ev.offersTableReservation === true
              ? (ev.tablePeopleCapacity ?? undefined)
              : undefined,
          tablesAvailable:
            ev.offersTableReservation === true
              ? (ev.tablesAvailable ?? undefined)
              : undefined,
          tablePrice:
            ev.offersTableReservation === true
              ? (ev.tablePrice ?? undefined)
              : undefined,
          offersBoothReservation: ev.offersBoothReservation ?? false,
          boothPeopleCapacity:
            ev.offersBoothReservation === true
              ? (ev.boothPeopleCapacity ?? undefined)
              : undefined,
          boothsAvailable:
            ev.offersBoothReservation === true
              ? (ev.boothsAvailable ?? undefined)
              : undefined,
          boothPrice:
            ev.offersBoothReservation === true
              ? (ev.boothPrice ?? undefined)
              : undefined,
        },
      });
      eventsCreated++;
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  console.log(
    `Eventos agendados criados: ${eventsCreated} (datas relativas ao seed, sempre futuras).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
