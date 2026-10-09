/**
 * Bangladesh Districts (64) mapped to their divisions and areas/thanas.
 * Data is used by the checkout form for dependent District → Area selects.
 */

export type Division =
  | "Dhaka"
  | "Chattogram"
  | "Rajshahi"
  | "Khulna"
  | "Barishal"
  | "Sylhet"
  | "Rangpur"
  | "Mymensingh";

export type DistrictInfo = {
  name: string;
  division: Division;
  areas: string[];
};

export const BD_DISTRICTS: DistrictInfo[] = [
  // ── Dhaka Division ───────────────────────────────────────────
  { name: "Dhaka", division: "Dhaka", areas: ["Gulshan", "Banani", "Dhanmondi", "Uttara", "Mirpur", "Mohakhali", "Bashundhara", "Motijheel", "Tejgaon", "Badda", "Khilgaon", "Wari", "Old Dhaka", "Ramna", "Pallabi", "Kafrul", "Cantonment", "Sutrapur", "Kotwali", "Lalbagh", "Hazaribagh", "Shahbagh", "New Market", "Kamrangirchar", "Demra", "Jatrabari"] },
  { name: "Faridpur", division: "Dhaka", areas: ["Faridpur Sadar", "Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan", "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha"] },
  { name: "Gazipur", division: "Dhaka", areas: ["Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur", "Tongi"] },
  { name: "Gopalganj", division: "Dhaka", areas: ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"] },
  { name: "Kishoreganj", division: "Dhaka", areas: ["Kishoreganj Sadar", "Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj", "Katiadi", "Kuliarchar", "Mithamain", "Nikli", "Pakundia", "Tarail"] },
  { name: "Madaripur", division: "Dhaka", areas: ["Madaripur Sadar", "Kalkini", "Rajoir", "Shibchar"] },
  { name: "Manikganj", division: "Dhaka", areas: ["Manikganj Sadar", "Daulatpur", "Ghior", "Harirampur", "Saturia", "Shibalaya", "Singair"] },
  { name: "Munshiganj", division: "Dhaka", areas: ["Munshiganj Sadar", "Gazaria", "Lohajang", "Sirajdikhan", "Sreenagar", "Tongibari"] },
  { name: "Narayanganj", division: "Dhaka", areas: ["Narayanganj Sadar", "Araihazar", "Bandar", "Rupganj", "Sonargaon"] },
  { name: "Narsingdi", division: "Dhaka", areas: ["Narsingdi Sadar", "Belabo", "Monohardi", "Palash", "Raipura", "Shibpur"] },
  { name: "Rajbari", division: "Dhaka", areas: ["Rajbari Sadar", "Baliakandi", "Goalanda", "Kalukhali", "Pangsha"] },
  { name: "Shariatpur", division: "Dhaka", areas: ["Shariatpur Sadar", "Bhedarganj", "Damudya", "Gosairhat", "Naria", "Zajira"] },
  { name: "Tangail", division: "Dhaka", areas: ["Tangail Sadar", "Basail", "Bhuapur", "Delduar", "Dhanbari", "Ghatail", "Gopalpur", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur"] },

  // ── Rajshahi Division ────────────────────────────────────────
  { name: "Bogra", division: "Rajshahi", areas: ["Bogra Sadar", "Adamdighi", "Dhunat", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur", "Sherpur", "Shibganj", "Sonatala"] },
  { name: "Joypurhat", division: "Rajshahi", areas: ["Joypurhat Sadar", "Akkelpur", "Kalai", "Khetlal", "Panchbibi"] },
  { name: "Naogaon", division: "Rajshahi", areas: ["Naogaon Sadar", "Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Mahadebpur", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar"] },
  { name: "Natore", division: "Rajshahi", areas: ["Natore Sadar", "Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Naldanga", "Singra"] },
  { name: "Chapainawabganj", division: "Rajshahi", areas: ["Chapainawabganj Sadar", "Bholahat", "Gomastapur", "Nachole", "Shibganj"] },
  { name: "Pabna", division: "Rajshahi", areas: ["Pabna Sadar", "Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Ishwardi", "Santhia", "Sujanagar"] },
  { name: "Rajshahi", division: "Rajshahi", areas: ["Rajshahi Sadar", "Bagha", "Bagmara", "Charghat", "Durgapur", "Godagari", "Mohanpur", "Paba", "Puthia", "Tanore", "Boalia", "Motihar", "Rajpara", "Shah Makhdum"] },
  { name: "Sirajganj", division: "Rajshahi", areas: ["Sirajganj Sadar", "Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Raiganj", "Shahjadpur", "Tarash", "Ullapara"] },

  // ── Rangpur Division ─────────────────────────────────────────
  { name: "Dinajpur", division: "Rangpur", areas: ["Dinajpur Sadar", "Birampur", "Birganj", "Biral", "Bochaganj", "Chirirbandar", "Fulbari", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Nawabganj", "Parbatipur"] },
  { name: "Gaibandha", division: "Rangpur", areas: ["Gaibandha Sadar", "Fulchhari", "Gobindaganj", "Palashbari", "Sadullapur", "Saghata", "Sundarganj"] },
  { name: "Kurigram", division: "Rangpur", areas: ["Kurigram Sadar", "Bhurungamari", "Char Rajibpur", "Chilmari", "Nageshwari", "Phulbari", "Rajarhat", "Raomari", "Ulipur"] },
  { name: "Lalmonirhat", division: "Rangpur", areas: ["Lalmonirhat Sadar", "Aditmari", "Hatibandha", "Kaliganj", "Patgram"] },
  { name: "Nilphamari", division: "Rangpur", areas: ["Nilphamari Sadar", "Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Saidpur"] },
  { name: "Panchagarh", division: "Rangpur", areas: ["Panchagarh Sadar", "Atwari", "Boda", "Debiganj", "Tetulia"] },
  { name: "Rangpur", division: "Rangpur", areas: ["Rangpur Sadar", "Badarganj", "Gangachara", "Kaunia", "Mithapukur", "Pirgachha", "Pirganj", "Taraganj"] },
  { name: "Thakurgaon", division: "Rangpur", areas: ["Thakurgaon Sadar", "Baliadangi", "Haripur", "Pirganj", "Ranisankail"] },

  // ── Barishal Division ────────────────────────────────────────
  { name: "Barguna", division: "Barishal", areas: ["Barguna Sadar", "Amtali", "Bamna", "Betagi", "Patharghata", "Taltali"] },
  { name: "Barisal", division: "Barishal", areas: ["Barisal Sadar", "Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Gaurnadi", "Hizla", "Mehendiganj", "Muladi", "Wazirpur"] },
  { name: "Bhola", division: "Barishal", areas: ["Bhola Sadar", "Borhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"] },
  { name: "Jhalokati", division: "Barishal", areas: ["Jhalokati Sadar", "Kathalia", "Nalchity", "Rajapur"] },
  { name: "Patuakhali", division: "Barishal", areas: ["Patuakhali Sadar", "Bauphal", "Dashmina", "Dumki", "Galachipa", "Kalapara", "Mirzaganj", "Rangabali"] },
  { name: "Pirojpur", division: "Barishal", areas: ["Pirojpur Sadar", "Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad", "Zianagar"] },

  // ── Chattogram Division ──────────────────────────────────────
  { name: "Bandarban", division: "Chattogram", areas: ["Bandarban Sadar", "Alikadam", "Lama", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi"] },
  { name: "Brahmanbaria", division: "Chattogram", areas: ["Brahmanbaria Sadar", "Akhaura", "Ashuganj", "Bancharampur", "Bijoynagar", "Kasba", "Nabinagar", "Nasirnagar", "Sarail"] },
  { name: "Chandpur", division: "Chattogram", areas: ["Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti"] },
  { name: "Chattogram", division: "Chattogram", areas: ["Kotwali", "Panchlaish", "Pahartali", "Halishahar", "Chandgaon", "Bakalia", "Bandar", "Double Mooring", "Patenga", "Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Fatikchhari", "Hathazari", "Lohagara", "Mirsharai", "Patiya", "Rangunia", "Raozan", "Sandwip", "Satkania", "Sitakunda"] },
  { name: "Cumilla", division: "Chattogram", areas: ["Cumilla Sadar", "Barura", "Brahmanpara", "Burichong", "Chandina", "Chauddagram", "Daudkandi", "Debidwar", "Homna", "Laksam", "Lalmai", "Manoharganj", "Meghna", "Monohorgonj", "Muradnagar", "Nangalkot", "Titas"] },
  { name: "Cox's Bazar", division: "Chattogram", areas: ["Cox's Bazar Sadar", "Chakaria", "Kutubdia", "Maheshkhali", "Pekua", "Ramu", "Teknaf", "Ukhia"] },
  { name: "Feni", division: "Chattogram", areas: ["Feni Sadar", "Chhagalnaiya", "Daganbhuiyan", "Fulgazi", "Parshuram", "Sonagazi"] },
  { name: "Khagrachhari", division: "Chattogram", areas: ["Khagrachhari Sadar", "Dighinala", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh"] },
  { name: "Lakshmipur", division: "Chattogram", areas: ["Lakshmipur Sadar", "Kamalnagar", "Raipur", "Ramganj", "Ramgati"] },
  { name: "Noakhali", division: "Chattogram", areas: ["Noakhali Sadar", "Begumganj", "Chatkhil", "Companiganj", "Hatiya", "Kabirhat", "Senbagh", "Sonaimuri", "Subarnachar"] },
  { name: "Rangamati", division: "Chattogram", areas: ["Rangamati Sadar", "Baghaichhari", "Barkal", "Belaichhari", "Juraichhari", "Kaptai", "Kawkhali", "Langadu", "Naniarchar", "Rajasthali"] },

  // ── Sylhet Division ──────────────────────────────────────────
  { name: "Habiganj", division: "Sylhet", areas: ["Habiganj Sadar", "Ajmiriganj", "Bahubal", "Baniachong", "Chunarughat", "Lakhai", "Madhabpur", "Nabiganj", "Shayestaganj"] },
  { name: "Moulvibazar", division: "Sylhet", areas: ["Moulvibazar Sadar", "Barlekha", "Juri", "Kamalganj", "Kulaura", "Rajnagar", "Sreemangal"] },
  { name: "Sunamganj", division: "Sylhet", areas: ["Sunamganj Sadar", "Bishwamvarpur", "Chhatak", "Derai", "Dharampasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Sulla", "Tahirpur"] },
  { name: "Sylhet", division: "Sylhet", areas: ["Sylhet Sadar", "Balaganj", "Beanibazar", "Bishwanath", "Companiganj", "Dakshin Surma", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Osmani Nagar", "Zakiganj"] },

  // ── Khulna Division ──────────────────────────────────────────
  { name: "Bagerhat", division: "Khulna", areas: ["Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola"] },
  { name: "Chuadanga", division: "Khulna", areas: ["Chuadanga Sadar", "Alamdanga", "Damurhuda", "Jibannagar"] },
  { name: "Jashore", division: "Khulna", areas: ["Jashore Sadar", "Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Keshabpur", "Manirampur", "Sharsha"] },
  { name: "Jhenaidah", division: "Khulna", areas: ["Jhenaidah Sadar", "Harinakunda", "Kaliganj", "Kotchandpur", "Maheshpur", "Shailkupa"] },
  { name: "Khulna", division: "Khulna", areas: ["Khulna Sadar", "Batiaghata", "Dacope", "Daulatpur", "Dighalia", "Dumuria", "Koyra", "Paikgachha", "Phultala", "Rupsa", "Terokhada", "Khan Jahan Ali", "Khalishpur", "Sonadanga"] },
  { name: "Kushtia", division: "Khulna", areas: ["Kushtia Sadar", "Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Mirpur"] },
  { name: "Magura", division: "Khulna", areas: ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"] },
  { name: "Meherpur", division: "Khulna", areas: ["Meherpur Sadar", "Gangni", "Mujibnagar"] },
  { name: "Narail", division: "Khulna", areas: ["Narail Sadar", "Kalia", "Lohagara"] },
  { name: "Satkhira", division: "Khulna", areas: ["Satkhira Sadar", "Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Shyamnagar", "Tala"] },

  // ── Mymensingh Division ──────────────────────────────────────
  { name: "Jamalpur", division: "Mymensingh", areas: ["Jamalpur Sadar", "Bakshiganj", "Dewanganj", "Islampur", "Madarganj", "Melandaha", "Sarishabari"] },
  { name: "Mymensingh", division: "Mymensingh", areas: ["Mymensingh Sadar", "Bhaluka", "Dhobaura", "Fulbaria", "Gaffargaon", "Gauripur", "Haluaghat", "Ishwarganj", "Muktagachha", "Nandail", "Phulpur", "Tarakanda", "Trishal"] },
  { name: "Netrokona", division: "Mymensingh", areas: ["Netrokona Sadar", "Atpara", "Barhatta", "Durgapur", "Kalmakanda", "Kendua", "Khaliajuri", "Madan", "Mohanganj", "Purbadhala"] },
  { name: "Sherpur", division: "Mymensingh", areas: ["Sherpur Sadar", "Jhenaigati", "Nakla", "Nalitabari", "Sreebardi"] },
];

/** Sorted list of district names for select options. */
export const DISTRICT_NAMES: string[] = BD_DISTRICTS.map((d) => d.name).sort((a, b) =>
  a.localeCompare(b),
);

/** O(1) lookup by district name. */
export const DISTRICT_MAP: Record<string, DistrictInfo> = BD_DISTRICTS.reduce(
  (acc, d) => {
    acc[d.name] = d;
    return acc;
  },
  {} as Record<string, DistrictInfo>,
);

/** Areas for a given district (sorted). Empty array if district not found. */
export function areasFor(district: string): string[] {
  const info = DISTRICT_MAP[district];
  return info ? [...info.areas].sort((a, b) => a.localeCompare(b)) : [];
}

/** Division for a district, or empty string if not found. */
export function divisionFor(district: string): Division | "" {
  return DISTRICT_MAP[district]?.division ?? "";
}
