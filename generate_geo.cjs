const fs = require('fs');
const path = require('path');
const bgd = require('bangladesh-geo-data');
const bpn = require('bangladesh-postcodes-npm/src/postcodes.json');

// District name normalization map to match BGD official district names
const distAliasMap = {
  'barisal': 'Barishal',
  'chittagong': 'Chattogram',
  'chattagram': 'Chattogram',
  'comilla': 'Cumilla',
  'jashore': 'Jessore',
  'bogura': 'Bogra',
  'jhalokati': 'Jhalokathi',
  'chapai nababganj': 'Chapai Nawabganj',
  'chapanababganj': 'Chapai Nawabganj',
  'coxs bazar': "Cox's Bazar",
  'cox’s bazar': "Cox's Bazar",
  'cox\'s bazar': "Cox's Bazar",
  'moulvibazar': 'Moulvibazar',
  'maulvibazar': 'Moulvibazar',
  'netrakona': 'Netrokona'
};

function normalizeDistName(d) {
  if (!d) return '';
  const clean = d.trim();
  const lower = clean.toLowerCase();
  if (distAliasMap[lower]) return distAliasMap[lower];
  return clean;
}

// Thana spelling normalizer for matching across datasets
function canonicalThana(t) {
  if (!t) return '';
  let s = t.toLowerCase()
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\bmodel\b/gi, '')
    .replace(/\bindustrial area\b/gi, '')
    .replace(/\bindustrial\b/gi, '')
    .replace(/\bts_o\b/gi, '')
    .replace(/\btso\b/gi, '')
    .replace(/\bsadar\b/gi, '')
    .replace(/[^a-z0-9]/g, '');

  s = s.replace(/anowara/g, 'anwara')
    .replace(/banskhali/g, 'banshkhali')
    .replace(/chandanaijs/g, 'chandanaish')
    .replace(/mirsharai/g, 'mirsarai')
    .replace(/raozan/g, 'rauzan')
    .replace(/sitakunda/g, 'sitakund')
    .replace(/moheshkhali/g, 'maheshkhali')
    .replace(/ukhia/g, 'ukhiya')
    .replace(/chhakaria/g, 'chakaria')
    .replace(/lalbag/g, 'lalbagh')
    .replace(/sabujbag/g, 'sabujbagh')
    .replace(/avaynagar/g, 'abhaynagar')
    .replace(/chougachha/g, 'chowgacha')
    .replace(/jhikargachha/g, 'jhikargacha')
    .replace(/nalchhiti/g, 'nalchity')
    .replace(/shahmakdum/g, 'shahmakhdum');
  return s;
}

// Load Toha postcodes dataset if available
let toha = {};
const tohaPath = path.join(__dirname, 'toha_postcodes.json');
if (fs.existsSync(tohaPath)) {
  try {
    toha = JSON.parse(fs.readFileSync(tohaPath, 'utf-8'));
  } catch (err) {
    console.warn('Could not parse toha_postcodes.json:', err.message);
  }
}

const districts = bgd.getAllDistricts().map(d => d.name).sort();

const distMap = {};
bgd.getAllDistricts().forEach(d => { distMap[d.id] = d.name; });

// Collect thanas and upazilas per district from BGD
const thanasByDistrict = {};
districts.forEach(d => { thanasByDistrict[d] = new Set(); });

bgd.getAllThanas().forEach(t => {
  const dist = distMap[t.districtId];
  if (dist && thanasByDistrict[dist]) thanasByDistrict[dist].add(t.name);
});
bgd.getAllUpazilas().forEach(u => {
  const dist = distMap[u.districtId];
  if (dist && thanasByDistrict[dist]) thanasByDistrict[dist].add(u.name);
});

// Add any missing thanas from Toha dataset
Object.values(toha).forEach(val => {
  if (!val || !val.en) return;
  let dist = normalizeDistName(val.en.district);
  let thana = (val.en.thana || '').trim();

  const matchedDist = districts.find(d => d.toLowerCase() === dist.toLowerCase());
  if (matchedDist && thana) {
    const cleanThana = thana.replace(/\s*\(.*?\)/g, '').trim();
    if (cleanThana) thanasByDistrict[matchedDist].add(cleanThana);
  }
});

const sortedThanas = {};
Object.keys(thanasByDistrict).sort().forEach(d => {
  sortedThanas[d] = Array.from(thanasByDistrict[d]).sort();
});

const postalCodesByThana = {};

function addPostOffice(thanaName, distName, code, po) {
  if (!thanaName || !distName || !code || !/^\d{4}$/.test(String(code))) return;
  const key = thanaName.trim().toLowerCase() + '|' + distName.trim().toLowerCase();
  if (!postalCodesByThana[key]) postalCodesByThana[key] = [];
  const cleanPo = po ? po.replace(/Union$/i, '').trim() : thanaName.trim();
  if (!postalCodesByThana[key].some(p => p.postal_code === String(code) && p.post_office.toLowerCase() === cleanPo.toLowerCase())) {
    postalCodesByThana[key].push({ postal_code: String(code), post_office: cleanPo });
  }
}

// 1. Populate from Toha dataset
Object.entries(toha).forEach(([code, val]) => {
  if (!val || !val.en) return;
  let dist = normalizeDistName(val.en.district);
  let thana = (val.en.thana || '').replace(/\s*\(.*?\)/g, '').trim();
  let po = (val.en.suboffice || thana).trim();

  const matchedDist = districts.find(d => d.toLowerCase() === dist.toLowerCase());
  if (matchedDist && thana) {
    addPostOffice(thana, matchedDist, code, po);
  }
});

// 2. Populate from BGD Unions
const upaMap = {};
bgd.getAllUpazilas().forEach(u => {
  upaMap[u.id] = { name: u.name, district: distMap[u.districtId] || '' };
});

bgd.getAllUnions().forEach(u => {
  const info = upaMap[u.upazilaId];
  if (!info) return;
  const code = (u.postalCode || '').trim();
  const po = (u.postOffice || u.name || '').trim();
  addPostOffice(info.name, info.district, code, po);
});

// 3. Populate from BPN postcodes.json
const thanaToDistMap = {};
Object.entries(sortedThanas).forEach(([dist, thanaList]) => {
  thanaList.forEach(t => {
    const tLower = t.toLowerCase();
    if (!thanaToDistMap[tLower]) thanaToDistMap[tLower] = [];
    thanaToDistMap[tLower].push(dist);
  });
});

bpn.forEach(p => {
  if (!p.upazila || !p.postCode) return;
  const uName = p.upazila.trim();
  const uLower = uName.toLowerCase();
  const code = (p.postCode || '').trim();
  const po = (p.postOffice || p.upazila).trim();

  const candidateDists = thanaToDistMap[uLower];
  if (candidateDists && candidateDists.length > 0) {
    candidateDists.forEach(d => addPostOffice(uName, d, code, po));
  }
});

// 4. Metropolitan area & regional fallbacks for city/suburban thanas
const metroFallbacks = {
  // Dhaka
  'adabor|dhaka': [ { postal_code: '1207', post_office: 'Mohammadpur TSO' } ],
  'airport|dhaka': [ { postal_code: '1229', post_office: 'Khilkhet TSO' }, { postal_code: '1230', post_office: 'Uttara TSO' } ],
  'ashulia|dhaka': [ { postal_code: '1341', post_office: 'Dhaka EPZ' }, { postal_code: '1349', post_office: 'Savar Cantt' } ],
  'badda|dhaka': [ { postal_code: '1212', post_office: 'Badda TSO' } ],
  'banani|dhaka': [ { postal_code: '1213', post_office: 'Banani TSO' } ],
  'bangshal|dhaka': [ { postal_code: '1100', post_office: 'Dhaka Sadar TSO' } ],
  'bhashantek|dhaka': [ { postal_code: '1206', post_office: 'Dhaka Cantonment TSO' } ],
  'cantonment|dhaka': [ { postal_code: '1206', post_office: 'Dhaka Cantonment TSO' } ],
  'chawkbazar|dhaka': [ { postal_code: '1211', post_office: 'Chawkbazar TSO' } ],
  'dakshin khan|dhaka': [ { postal_code: '1230', post_office: 'Uttara TSO' } ],
  'darus-salam|dhaka': [ { postal_code: '1216', post_office: 'Mirpur TSO' } ],
  'gandaria|dhaka': [ { postal_code: '1204', post_office: 'Dhaka Sadar TSO' } ],
  'hatirjheel|dhaka': [ { postal_code: '1217', post_office: 'Moghbazar TSO' } ],
  'hazaribagh|dhaka': [ { postal_code: '1209', post_office: 'Jigatala TSO' } ],
  'kadamtoli|dhaka': [ { postal_code: '1236', post_office: 'Dania TSO' } ],
  'kafrul|dhaka': [ { postal_code: '1206', post_office: 'Dhaka Cantonment TSO' }, { postal_code: '1216', post_office: 'Mirpur TSO' } ],
  'kalabagan|dhaka': [ { postal_code: '1205', post_office: 'New Market TSO' } ],
  'kamrangirchar|dhaka': [ { postal_code: '1211', post_office: 'Chawkbazar TSO' } ],
  'keraniganj model|dhaka': [ { postal_code: '1310', post_office: 'Keraniganj' } ],
  'kotwali|dhaka': [ { postal_code: '1100', post_office: 'Dhaka Sadar TSO' } ],
  'lalbagh|dhaka': [ { postal_code: '1211', post_office: 'Lalbagh' } ],
  'mirpur model|dhaka': [ { postal_code: '1216', post_office: 'Mirpur TSO' } ],
  'mugda|dhaka': [ { postal_code: '1214', post_office: 'Basabo TSO' } ],
  'pallabi|dhaka': [ { postal_code: '1216', post_office: 'Mirpur TSO' } ],
  'paltan model|dhaka': [ { postal_code: '1000', post_office: 'Dhaka GPO' } ],
  'ramna model|dhaka': [ { postal_code: '1000', post_office: 'Ramna' } ],
  'rampura|dhaka': [ { postal_code: '1219', post_office: 'Khilgaon TSO' } ],
  'rupnagar|dhaka': [ { postal_code: '1216', post_office: 'Mirpur TSO' } ],
  'sabujbagh|dhaka': [ { postal_code: '1214', post_office: 'Basabo' } ],
  'shah ali|dhaka': [ { postal_code: '1216', post_office: 'Mirpur TSO' } ],
  'shahbagh|dhaka': [ { postal_code: '1000', post_office: 'Dhaka GPO' }, { postal_code: '1205', post_office: 'Dhaka University' } ],
  'shahjahanpur|dhaka': [ { postal_code: '1217', post_office: 'Rajarbagh TSO' } ],
  'sher-e-bangla nagar|dhaka': [ { postal_code: '1207', post_office: 'Sher-e-Bangla Nagar' } ],
  'shyampur|dhaka': [ { postal_code: '1204', post_office: 'Faridabad TSO' } ],
  'tejgaon industrial|dhaka': [ { postal_code: '1208', post_office: 'Tejgaon Industrial Area' } ],
  'turag|dhaka': [ { postal_code: '1230', post_office: 'Uttara TSO' } ],
  'uttar khan|dhaka': [ { postal_code: '1230', post_office: 'Uttara TSO' } ],
  'uttara east|dhaka': [ { postal_code: '1230', post_office: 'Uttara TSO' } ],
  'uttara west|dhaka': [ { postal_code: '1230', post_office: 'Uttara TSO' } ],
  'vatara|dhaka': [ { postal_code: '1212', post_office: 'Badda TSO' } ],
  'wari|dhaka': [ { postal_code: '1203', post_office: 'Wari TSO' } ],

  // Chattogram (Chittagong) Metro thanas
  'akbarshah|chattogram': [ { postal_code: '4208', post_office: 'Pahartali' } ],
  'bakalia|chattogram': [ { postal_code: '4000', post_office: 'Chittagong GPO' } ],
  'bayazid|chattogram': [ { postal_code: '4210', post_office: 'Bayezid Bostami' } ],
  'chandgaon|chattogram': [ { postal_code: '4212', post_office: 'Chandgaon TSO' } ],
  'chawkbazar|chattogram': [ { postal_code: '4203', post_office: 'Chawkbazar TSO' } ],
  'double mooring|chattogram': [ { postal_code: '4100', post_office: 'Double Mooring' } ],
  'epz|chattogram': [ { postal_code: '4223', post_office: 'Chittagong Export Processing Zone' } ],
  'halishahar|chattogram': [ { postal_code: '4216', post_office: 'Halishahar Housing Estate' } ],
  'karnaphuli|chattogram': [ { postal_code: '4000', post_office: 'Chittagong GPO' } ],
  'khulshi|chattogram': [ { postal_code: '4225', post_office: 'Khulshi' } ],
  'kotwali|chattogram': [ { postal_code: '4000', post_office: 'Chittagong GPO' } ],
  'pahartali|chattogram': [ { postal_code: '4208', post_office: 'Pahartali' } ],
  'panchlaish|chattogram': [ { postal_code: '4253', post_office: 'Panchlaish' } ],
  'patenga|chattogram': [ { postal_code: '4204', post_office: 'Patenga' } ],
  'sadarghat|chattogram': [ { postal_code: '4000', post_office: 'Chittagong GPO' } ],

  // Barishal Metro thanas
  'airport|barishal': [ { postal_code: '8200', post_office: 'Barishal GPO' } ],
  'bandara|barishal': [ { postal_code: '8200', post_office: 'Barishal GPO' } ],
  'barial|barishal': [ { postal_code: '8200', post_office: 'Barishal GPO' } ],
  'char aila kathi|barishal': [ { postal_code: '8200', post_office: 'Barishal GPO' } ],
  'kashipur|barishal': [ { postal_code: '8200', post_office: 'Barishal GPO' } ],
  'kotwali|barishal': [ { postal_code: '8200', post_office: 'Barishal GPO' } ],
  'rupatali|barishal': [ { postal_code: '8200', post_office: 'Barishal GPO' } ],
  'sadar|barishal': [ { postal_code: '8200', post_office: 'Barishal GPO' } ],

  // Khulna Metro thanas
  'aranggata|khulna': [ { postal_code: '9000', post_office: 'Khulna GPO' } ],
  'daulatpur|khulna': [ { postal_code: '9202', post_office: 'Daulatpur' } ],
  'khalishpur|khulna': [ { postal_code: '9203', post_office: 'Khalishpur' } ],
  'khan jahan ali|khulna': [ { postal_code: '9205', post_office: 'KUET' } ],
  'kotwali|khulna': [ { postal_code: '9000', post_office: 'Khulna GPO' } ],
  'labanchara|khulna': [ { postal_code: '9000', post_office: 'Khulna GPO' } ],
  'sonadanga|khulna': [ { postal_code: '9100', post_office: 'Sonadanga' } ],

  // Rajshahi Metro thanas
  'boalia|rajshahi': [ { postal_code: '6000', post_office: 'Rajshahi GPO' } ],
  'chandrima|rajshahi': [ { postal_code: '6000', post_office: 'Rajshahi GPO' } ],
  'kasiadanga|rajshahi': [ { postal_code: '6000', post_office: 'Rajshahi GPO' } ],
  'katakhali|rajshahi': [ { postal_code: '6204', post_office: 'Katakhali' } ],
  'matihar|rajshahi': [ { postal_code: '6205', post_office: 'Rajshahi University' } ],
  'rajpara|rajshahi': [ { postal_code: '6000', post_office: 'Rajshahi GPO' } ],
  'shah makdum|rajshahi': [ { postal_code: '6201', post_office: 'Shah Makdum' } ],
  'shiporganj|rajshahi': [ { postal_code: '6000', post_office: 'Rajshahi GPO' } ],

  // Sylhet Metro thanas
  'airport|sylhet': [ { postal_code: '3102', post_office: 'Sylhet Cadet College' } ],
  'jalalabad|sylhet': [ { postal_code: '3114', post_office: 'SUST' } ],
  'kotwali|sylhet': [ { postal_code: '3100', post_office: 'Sylhet Head Post Office' } ],
  'moglabazar|sylhet': [ { postal_code: '3100', post_office: 'Sylhet Head Post Office' } ],
  'shah paran|sylhet': [ { postal_code: '3104', post_office: 'Shah Paran' } ],
  'south surma|sylhet': [ { postal_code: '3100', post_office: 'Sylhet Head Post Office' } ]
};

Object.entries(metroFallbacks).forEach(([key, list]) => {
  if (!postalCodesByThana[key] || postalCodesByThana[key].length === 0) {
    const [t, d] = key.split('|');
    const matchedDist = districts.find(dist => dist.toLowerCase() === d);
    if (matchedDist) {
      list.forEach(p => addPostOffice(t, matchedDist, p.postal_code, p.post_office));
    }
  }
});

// 5. Match canonical thanas across existing entries
Object.entries(sortedThanas).forEach(([dist, thanaList]) => {
  thanaList.forEach(t => {
    const key = t.toLowerCase() + '|' + dist.toLowerCase();
    if (!postalCodesByThana[key] || postalCodesByThana[key].length === 0) {
      const cThana = canonicalThana(t);
      for (const [existingKey, list] of Object.entries(postalCodesByThana)) {
        const [exT, exD] = existingKey.split('|');
        if (exD === dist.toLowerCase() && canonicalThana(exT) === cThana && list.length > 0) {
          list.forEach(p => addPostOffice(t, dist, p.postal_code, p.post_office));
          break;
        }
      }
    }
  });
});

// 6. District Sadar Fallback: Ensure 100% thanas have postal code entries
Object.entries(sortedThanas).forEach(([dist, thanaList]) => {
  let fallbackPostOffices = [];
  for (const [key, list] of Object.entries(postalCodesByThana)) {
    if (key.endsWith('|' + dist.toLowerCase()) && list.length > 0) {
      fallbackPostOffices = list;
      const sadar = list.find(p => /sadar|gpo|head/i.test(p.post_office));
      if (sadar) {
        fallbackPostOffices = [sadar];
        break;
      }
    }
  }

  thanaList.forEach(t => {
    const key = t.toLowerCase() + '|' + dist.toLowerCase();
    if (!postalCodesByThana[key] || postalCodesByThana[key].length === 0) {
      if (fallbackPostOffices.length > 0) {
        fallbackPostOffices.forEach(p => addPostOffice(t, dist, p.postal_code, p.post_office));
      }
    }
  });
});

const result = {
  districts,
  thanas_by_district: sortedThanas,
  postal_codes_by_thana: postalCodesByThana
};

fs.mkdirSync('/home/frappe/projects/lookzene/apps/coscore/coscore/public', { recursive: true });
fs.mkdirSync('/home/frappe/projects/lookzene/apps/coscore/public', { recursive: true });
fs.writeFileSync('/home/frappe/projects/lookzene/apps/coscore/coscore/public/bd_geo_data.json', JSON.stringify(result));
fs.writeFileSync('/home/frappe/projects/lookzene/apps/coscore/public/bd_geo_data.json', JSON.stringify(result));

console.log('Saved comprehensive bd_geo_data.json successfully!');
console.log('Districts:', districts.length);
let totalThanas = 0;
Object.values(sortedThanas).forEach(list => totalThanas += list.length);
console.log('Total Thanas / Upazilas:', totalThanas);
console.log('Postal code mapped thanas:', Object.keys(postalCodesByThana).length);
console.log('File size:', fs.statSync('/home/frappe/projects/lookzene/apps/coscore/public/bd_geo_data.json').size, 'bytes');
