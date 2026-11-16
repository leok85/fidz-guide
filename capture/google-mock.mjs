// Respostas falsas do Google Places (busca da loja e detalhes) durante a captura: o guia mostra a
// própria loja de demonstração, nunca uma loja real que apareceria na busca.
// O SDK do Maps fala JSPB (arrays por posição) nos endpoints $rpc; o formato veio de uma chamada real.

const TYPES = ['bakery', 'cake_shop', 'confectionery', 'food_store', 'store', 'food', 'point_of_interest', 'establishment'];

export const DEMO_PLACES = {
  'doce-vida-beira-mar': {
    id: 'ChIJGuiaFidzDoceVidaBMar01',
    name: 'Doce Vida Confeitaria - Beira-Mar',
    secondary: 'Av. Beira-Mar Norte, 2500 - Agronômica, Florianópolis - SC',
    address: 'Av. Beira-Mar Norte, 2500 - Agronômica, Florianópolis - SC, 88025-301',
    phone: '(48) 3222-4477',
    components: [
      ['2500', '2500', ['street_number'], 'pt-BR'],
      ['Avenida Beira-Mar Norte', 'Av. Beira-Mar Norte', ['route'], 'pt'],
      ['Agronômica', 'Agronômica', ['sublocality_level_1', 'sublocality', 'political'], 'pt'],
      ['Florianópolis', 'Florianópolis', ['administrative_area_level_2', 'political'], 'pt'],
      ['Santa Catarina', 'SC', ['administrative_area_level_1', 'political'], 'pt'],
      ['Brasil', 'BR', ['country', 'political'], 'pt'],
      ['88025-301', '88025-301', ['postal_code'], 'pt-BR'],
    ],
    latlng: [-27.5835, -48.5436],
  },
  // As unidades do seed já ligadas ao Google (capture/seed.sql): só respondem aos detalhes.
  'doce-vida-centro': {
    id: 'ChIJGuiaFidzDoceVidaCentr1',
    name: 'Doce Vida Confeitaria - Centro',
    secondary: 'Rua Felipe Schmidt, 210 - Centro, Florianópolis - SC',
    address: 'Rua Felipe Schmidt, 210 - Centro, Florianópolis - SC, 88010-000',
    phone: '(48) 3222-4455',
    components: [],
    latlng: [-27.5969, -48.5495],
  },
  'doce-vida-shopping': {
    id: 'ChIJGuiaFidzDoceVidaShopp1',
    name: 'Doce Vida Confeitaria - Shopping',
    secondary: 'Av. Rio Branco, 450 - Centro, Florianópolis - SC',
    address: 'Av. Rio Branco, 450 - Centro, Florianópolis - SC, 88015-200',
    phone: '(48) 3222-4466',
    components: [],
    latlng: [-27.5925, -48.5530],
  },
};

const HOURS = [
  0,
  [1, 2, 3, 4, 5, 6].map((d) => [[d, 9, 0], [d, d === 6 ? 14 : 19, 0]]),
  ['segunda-feira: 09:00 – 19:00', 'terça-feira: 09:00 – 19:00', 'quarta-feira: 09:00 – 19:00',
    'quinta-feira: 09:00 – 19:00', 'sexta-feira: 09:00 – 19:00', 'sábado: 09:00 – 14:00', 'domingo: Fechado'],
];

function autocompleteBody(places) {
  const preds = places.map((p) => [[
    `places/${p.id}`, p.id,
    [`${p.name}, ${p.secondary}`, [[null, p.name.length]]],
    [[p.name, [[null, p.name.length]]], [p.secondary]],
    TYPES,
  ]]);
  return JSON.stringify([preds]);
}

function placeBody(p) {
  const a = [];
  a[1] = p.id;
  a[4] = TYPES;
  a[6] = p.phone;
  a[8] = p.address;
  a[9] = p.components;
  a[11] = p.latlng;
  a[13] = 5;
  a[14] = `https://maps.google.com/?cid=${p.id}`;
  a[20] = HOURS;
  a[27] = 9;
  a[30] = [p.name.split(' - ')[0], 'pt'];
  a[49] = 'bakery';
  return JSON.stringify(a.map((v) => (v === undefined ? null : v)));
}

/** Liga as respostas falsas no contexto. `keys` escolhe quais lojas a busca devolve. */
export async function mockGooglePlaces(context, keys = ['doce-vida-beira-mar']) {
  const all = Object.values(DEMO_PLACES);
  const found = keys.map((k) => DEMO_PLACES[k]);
  await context.route('https://places.googleapis.com/$rpc/google.maps.places.v1.Places/AutocompletePlaces', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json+protobuf', body: autocompleteBody(found) }));
  await context.route('https://places.googleapis.com/$rpc/google.maps.places.v1.Places/GetPlace', (route) => {
    const [name] = JSON.parse(route.request().postData() ?? '[]');
    const place = all.find((p) => name === `places/${p.id}`) ?? found[0];
    return route.fulfill({ status: 200, contentType: 'application/json+protobuf', body: placeBody(place) });
  });
}
