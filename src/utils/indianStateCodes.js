/** Indian GST state / UT codes (2-digit) */
export const INDIAN_GST_STATE_CODES = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

const STATE_ALIASES = {
  jk: '01',
  jammu: '01',
  'jammu and kashmir': '01',
  hp: '02',
  himachal: '02',
  'himachal pradesh': '02',
  pb: '03',
  punjab: '03',
  ch: '04',
  chandigarh: '04',
  uk: '05',
  uttarakhand: '05',
  uttaranchal: '05',
  hr: '06',
  haryana: '06',
  dl: '07',
  delhi: '07',
  'new delhi': '07',
  rj: '08',
  rajasthan: '08',
  up: '09',
  'uttar pradesh': '09',
  br: '10',
  bihar: '10',
  sk: '11',
  sikkim: '11',
  ar: '12',
  'arunachal pradesh': '12',
  nl: '13',
  nagaland: '13',
  mn: '14',
  manipur: '14',
  mz: '15',
  mizoram: '15',
  tr: '16',
  tripura: '16',
  ml: '17',
  meghalaya: '17',
  as: '18',
  assam: '18',
  wb: '19',
  'west bengal': '19',
  jh: '20',
  jharkhand: '20',
  or: '21',
  odisha: '21',
  orissa: '21',
  cg: '22',
  chhattisgarh: '22',
  mp: '23',
  'madhya pradesh': '23',
  gj: '24',
  gujarat: '24',
  dd: '26',
  dn: '26',
  'dadra and nagar haveli': '26',
  'daman and diu': '26',
  'dadra and nagar haveli and daman and diu': '26',
  mh: '27',
  maharashtra: '27',
  ka: '29',
  karnataka: '29',
  ga: '30',
  goa: '30',
  ld: '31',
  lakshadweep: '31',
  kl: '32',
  kerala: '32',
  tn: '33',
  'tamil nadu': '33',
  py: '34',
  puducherry: '34',
  pondicherry: '34',
  an: '35',
  'andaman and nicobar islands': '35',
  ts: '36',
  telangana: '36',
  ap: '37',
  'andhra pradesh': '37',
  la: '38',
  ladakh: '38',
};

const normalizeKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const normalizeStateCode = (code) => {
  const digits = String(code || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.padStart(2, '0').slice(-2);
};

export const getStateNameForCode = (code) => {
  const normalized = normalizeStateCode(code);
  return INDIAN_GST_STATE_CODES[normalized] || '';
};

export const getStateCodeForName = (stateName) => {
  const key = normalizeKey(stateName);
  if (!key) return '';

  if (STATE_ALIASES[key]) return STATE_ALIASES[key];

  const entry = Object.entries(INDIAN_GST_STATE_CODES).find(
    ([, name]) => normalizeKey(name) === key,
  );
  return entry ? entry[0] : '';
};

export const STATE_CODE_ERROR_MESSAGE = 'Please set correct State Code.';

export const validateStateAndCode = (state, stateCode) => {
  const stateName = String(state || '').trim();
  const code = normalizeStateCode(stateCode);

  if (!stateName) {
    return { valid: false, message: STATE_CODE_ERROR_MESSAGE };
  }

  if (!code || !/^\d{2}$/.test(code)) {
    return { valid: false, message: STATE_CODE_ERROR_MESSAGE };
  }

  const nameFromCode = getStateNameForCode(code);
  if (!nameFromCode) {
    return { valid: false, message: STATE_CODE_ERROR_MESSAGE };
  }

  const codeFromName = getStateCodeForName(stateName);
  if (!codeFromName) {
    return { valid: false, message: STATE_CODE_ERROR_MESSAGE };
  }

  if (codeFromName !== code) {
    const correctName = getStateNameForCode(codeFromName);
    return {
      valid: false,
      message: STATE_CODE_ERROR_MESSAGE,
      expectedCode: codeFromName,
      expectedState: correctName,
    };
  }

  return { valid: true, expectedCode: code, expectedState: nameFromCode };
};
