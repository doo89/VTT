const NAME_THEMES = {
  fantasy: {
    label: 'Fantasy',
    prefixes: ['Ael', 'Thor', 'Grim', 'El', 'Mor', 'Gal', 'Fen', 'Syl', 'Dra', 'Val', 'Ara', 'Bel', 'Cael', 'Dun', 'Ere', 'Fae', 'Gor', 'Hal', 'Ith', 'Kal', 'Lor', 'Myr', 'Nim', 'Orin', 'Pyr', 'Quel', 'Rav', 'Ser', 'Thal', 'Ul', 'Vex', 'Wyn', 'Xan', 'Yor', 'Zeph'],
    suffixes: ['orn', 'ian', 'iel', 'ath', 'wen', 'ar', 'is', 'on', 'us', 'a', 'ira', 'oth', 'und', 'gar', 'mir', 'riel', 'thas', 'din', 'fir', 'gon', 'har', 'in', 'jar', 'kor', 'lin', 'mor', 'nar', 'os', 'pin', 'ros', 'tar', 'un', 'var', 'win', 'zar'],
  },
  scifi: {
    label: 'Science-Fiction',
    prefixes: ['Zyx', 'Neo', 'Vex', 'Qua', 'Xen', 'Kry', 'Orb', 'Tek', 'Syn', 'Cyb', 'Ast', 'Bio', 'Cor', 'Dat', 'Eco', 'Flx', 'Grv', 'Hel', 'Ion', 'Jet', 'Kin', 'Lux', 'Mag', 'Nul', 'Opt', 'Pix', 'Qub', 'Rad', 'Sol', 'Trn', 'Ult', 'Vid', 'Wav', 'Xyt', 'Yon', 'Zet'],
    suffixes: ['tron', 'ix', 'on', 'ex', 'ax', 'oid', 'ion', 'ar', 'is', 'us', 'al', 'el', 'or', 'um', 'an', 'en', 'in', 'yn', 'os', 'as', 'es', 'ix', 'ux', 'ox', 'yx', 'zx', 'qx', 'vx', 'nx', 'lx', 'rx', 'tx', 'sx', 'px', 'kx'],
  },
  horror: {
    label: 'Horreur',
    prefixes: ['Mor', 'Grim', 'Dra', 'Vam', 'Zom', 'Sha', 'Wra', 'Bla', 'Cro', 'Dar', 'Dre', 'Evi', 'Fle', 'Gho', 'Hex', 'Icy', 'Jinx', 'Kil', 'Lur', 'Mad', 'Nig', 'Ogre', 'Poi', 'Rav', 'Sca', 'Tor', 'Und', 'Ven', 'War', 'Wic', 'Xen', 'Yel', 'Zar'],
    suffixes: ['oth', 'ark', 'ane', 'ull', 'ire', 'aw', 'eep', 'ight', 'oom', 'ust', 'aze', 'ell', 'end', 'ear', 'one', 'our', 'iss', 'ake', 'old', 'ume', 'awn', 'oth', 'eath', 'irk', 'ull', 'urn', 'ash', 'one', 'oth', 'ane', 'ire', 'ull', 'aw', 'ight', 'oom'],
  },
  medieval: {
    label: 'Médiéval',
    prefixes: ['Wil', 'Rich', 'Edw', 'Hen', 'Rob', 'God', 'Hum', 'Bal', 'Ced', 'Edg', 'Fer', 'Geo', 'Har', 'Ivo', 'Jos', 'Leo', 'Mar', 'Nor', 'Odo', 'Pet', 'Ral', 'Sam', 'Theo', 'Ulf', 'Wal', 'Yve', 'Alf', 'Ber', 'Col', 'Dro', 'Eil', 'Ful', 'Gil', 'Her'],
    suffixes: ['iam', 'ard', 'ard', 'el', 'ert', 'rey', 'win', 'dric', 'mund', 'bert', 'old', 'ard', 'wine', 'frid', 'gar', 'helm', 'ric', 'ward', 'ulf', 'stan', 'red', 'ard', 'win', 'ard', 'ric', 'old', 'ard', 'win', 'ric', 'old', 'ard', 'win', 'ric', 'old', 'ard'],
  },
  modern: {
    label: 'Moderne',
    prefixes: ['Alex', 'Sam', 'Max', 'Leo', 'Tom', 'Ben', 'Dan', 'Eli', 'Finn', 'Guy', 'Hal', 'Ian', 'Jay', 'Kai', 'Lou', 'Mia', 'Ned', 'Oli', 'Pat', 'Ray', 'Sue', 'Ted', 'Uma', 'Val', 'Wes', 'Xia', 'Yus', 'Zac', 'Ava', 'Bob', 'Cam', 'Deb', 'Eva', 'Fay'],
    suffixes: ['ander', 'uel', 'im', 'n', 'as', 'y', 'an', 'is', 'en', 'on', 'ar', 'el', 'ia', 'na', 'ra', 'la', 'ma', 'sa', 'ta', 'va', 'wa', 'za', 'da', 'fa', 'ga', 'ha', 'ja', 'ka', 'pa', 'qa', 'xa', 'ya', 'ba', 'ca', 'ea'],
  },
  mythology: {
    label: 'Mythologique',
    prefixes: ['Apo', 'Ares', 'Ath', 'Chr', 'Dem', 'Ere', 'Gae', 'Had', 'Hep', 'Her', 'Hyp', 'Iris', 'Jan', 'Kro', 'Let', 'Mor', 'Nem', 'Oce', 'Pan', 'Rhe', 'Sel', 'Tart', 'Ura', 'Vul', 'Zeu', 'Anu', 'Bel', 'Enl', 'Gil', 'Ishtar', 'Loki', 'Odin', 'Fre', 'Thor', 'Bal'],
    suffixes: ['llo', 's', 'ena', 'on', 'eter', 'us', 'a', 'es', 'a', 'mes', 'era', 'nos', 'an', 'nus', 'o', 'r', 'e', 'os', 'ra', 'is', 'ix', 'or', 'us', 'a', 'is', 'os', 'us', 'a', 'is', 'os', 'us', 'a', 'is', 'os', 'us'],
  },
} as const;

export type NameTheme = keyof typeof NAME_THEMES;

export const THEMES = Object.entries(NAME_THEMES).map(([key, value]) => ({
  key: key as NameTheme,
  label: value.label,
}));

export function generateNames(count: number, theme: NameTheme): string[] {
  const data = NAME_THEMES[theme];
  if (!data) return Array.from({ length: count }, (_, i) => `Joueur ${i + 1}`);

  const used = new Set<string>();
  const names: string[] = [];

  let attempts = 0;
  while (names.length < count && attempts < count * 10) {
    const prefix = data.prefixes[Math.floor(Math.random() * data.prefixes.length)];
    const suffix = data.suffixes[Math.floor(Math.random() * data.suffixes.length)];
    const name = prefix + suffix;

    if (!used.has(name)) {
      used.add(name);
      names.push(name);
    }
    attempts++;
  }

  while (names.length < count) {
    names.push(`Joueur ${names.length + 1}`);
  }

  return names;
}
