import type { Menu } from '../../types/menu.ts'

// The week the poster ships with. An empty photo `src` renders the built-in placeholder.
export const defaultMenu: Menu = {
  restaurant: {
    name: 'ZÓNA ÉTTEREM',
    city: 'VESZPRÉM',
    address: 'RADNÓTI TÉR 2',
    phone: 'TEL.: 88/426-706',
  },
  title: 'HETI AJÁNLAT',
  dateRange: '2026. 08. 31. – 09. 04.',
  badge: {
    small: ['JÓ ÉTVÁGYAT', 'KÍVÁN A'],
    large: 'ZÓNA',
    medium: 'ÉTTEREM',
  },
  sidePrices: [
    {
      label: 'Levesek:',
      price: 1000,
    },
    {
      label: 'Húsos levesek:',
      price: 1100,
    },
    {
      label: 'Saláták:',
      price: 800,
    },
    {
      label: 'Köretek:',
      price: 800,
    },
  ],
  menuLabel: 'MENÜ',
  closedLabel: 'ZÁRVA',
  dishTypes: [
    { id: 'fozelek', name: 'Főzelék', price: 1700 },
    { id: 'foetel', name: 'Főétel', price: 2000 },
    { id: 'teszta', name: 'Tészta', price: 1400 },
  ],
  menuPrice: 2000,
  days: [
    {
      id: 'hetfo',
      name: 'HÉTFŐ',
      closed: false,
      dishes: [
        {
          name: 'SÁRGABORSÓFŐZELÉK, SERTÉS PÖRKÖLT',
          price: 1700,
        },
        {
          name: 'KÍANICSIRKEMELL TOKÁNY, RIZS',
          price: 2000,
        },
        {
          name: 'PALERMÓI CSIRKEMELL, HASÁBBURGONYA',
          price: 2000,
        },
        {
          name: 'KÁPOSZTÁSTÉSZTA',
          price: 1400,
        },
      ],
      menu: {
        name: 'CSONTLEVES, DEBRECENI TOKÁNY, TARHONYA',
        price: 2000,
      },
    },
    {
      id: 'kedd',
      name: 'KEDD',
      closed: false,
      dishes: [
        {
          name: 'TÖKFŐZELÉK, VAGDALT',
          price: 1700,
        },
        {
          name: 'CSABAI KARAJ, PÁROLT KÁPOSZTA, FŐTT BURGONYA',
          price: 2000,
        },
        {
          name: 'RÁNTOTT GOMBAFEJEK, RIZS, TARTÁR',
          price: 2000,
        },
      ],
      menu: {
        name: 'GULYÁSLEVES, MÁKOSTÉSZTA',
        price: 2000,
      },
    },
    {
      id: 'szerda',
      name: 'SZERDA',
      closed: false,
      dishes: [
        {
          name: 'ERDÉLYI RAKOTTKÁPOSZTA',
          price: 2000,
        },
        {
          name: 'RÁNTOTT CSIRKEMELL, PÁROLT ZÖLDSÉG, RIZS',
          price: 2000,
        },
        {
          name: 'SONKÁSPENNE',
          price: 1400,
        },
      ],
      menu: {
        name: 'TAVASZILEVES, ZÖLDBABFŐZELÉK, SERTÉS PÖRKÖLT',
        price: 2000,
      },
    },
    {
      id: 'csutortok',
      name: 'CSÜTÖRTÖK',
      closed: false,
      dishes: [
        {
          name: 'SÓSKAMÁRTÁS, FŐTT BURGONYA, FŐTT TOJÁS',
          price: 1700,
        },
        {
          name: 'BRASSÓI APRÓPECSENYE',
          price: 2000,
        },
        {
          name: 'RÁNTOTT SERTÉSKARAJ, PETREZSELYMES BURGONYA',
          price: 2000,
        },
        {
          name: 'RIZSFELFÚJT',
          price: 1400,
        },
      ],
      menu: {
        name: 'KARFIOLLEVES, SERTÉS PAPRIKÁS, GALUSKA',
        price: 2000,
      },
    },
    {
      id: 'pentek',
      name: 'PÉNTEK',
      closed: false,
      dishes: [
        {
          name: 'KELKÁPOSZTAFŐZELÉK, VAGDALT',
          price: 1700,
        },
        {
          name: 'TÖLTÖTT CSIRKECOMB, RIZIBIZI',
          price: 2000,
        },
        {
          name: 'BORZASSERTÉS BORDA, PETREZSELYMES BURGONYA',
          price: 2000,
        },
        {
          name: 'VARGABÉLES',
          price: 1400,
        },
      ],
      menu: {
        name: 'GYÜMÖLCSLEVES, RÁNTOTT TONHAL, RIZS, TARTÁR MÁRTÁS',
        price: 2000,
      },
    },
  ],
  photos: {
    left: {
      src: '',
      alt: '',
    },
    right: {
      src: '',
      alt: '',
    },
  },
  footer: {
    takeaway: 'Elviteles doboz ára: 100 Ft',
    facebook: 'Étlapunk aktuális ajánlata a Facebook oldalon tekinthető meg.',
  },
} satisfies Menu
