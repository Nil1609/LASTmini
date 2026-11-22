// Standalone expansion seed script — runs with: node src/lib/matching/seed_more.js
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = 'https://juyqotmaxtyvqpltjzew.supabase.co';
const SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1eXFvdG1heHR5dnFwbHRqemV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTgyNjczNSwiZXhwIjoyMTA3NDAyNzM1fQ.R-1Z4QHBeZy1E1F3z8bjFKwQs6AmNxoOVnk__EvwGVI';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const LOCATIONS = [
  'Central Library', 'Bus Stop', 'Main Building', 'Hostel', 'Parking',
  'Classroom 101', 'Computer Lab', 'Canteen', 'Seminar Hall', 'Main Gate',
  'Gym', 'Physics Lab', 'Auditorium'
];

function loc(i) { return LOCATIONS[i % LOCATIONS.length]; }

// Additional FOUND items (under Test Finder Bot) to ensure 2-3 matches per lost item
const ADDITIONAL_FOUND_ITEMS = [
  // --- For HP Laptop (Lost: HP, Silver, Electronics) ---
  {
    item_name: 'Silver Laptop Computer',
    category: 'Electronics',
    color: 'Silver',
    brand: '',
    date: '2026-11-03',
    description: 'Found a silver portable laptop computer left in the central library reading hall.'
  },
  {
    item_name: 'HP Pavilion Laptop',
    category: 'Electronics',
    color: 'Grey',
    brand: 'HP',
    date: '2026-11-04',
    description: 'Found an HP brand grey laptop with charger in physics lab.'
  },

  // --- For Casio Watch (Lost: Casio, Silver, Accessories) ---
  {
    item_name: 'Analog wristwatch watch',
    category: 'Accessories',
    color: 'Silver',
    brand: '',
    date: '2026-11-04',
    description: 'Silver analog watch found near the corridor by the hostel.'
  },
  {
    item_name: 'Casio digital watch',
    category: 'Accessories',
    color: 'Black',
    brand: 'Casio',
    date: '2026-11-05',
    description: 'Black Casio watch found in gym locker area.'
  },

  // --- For Boat Airdopes 141 (Lost: boAt, Black, Electronics) ---
  {
    item_name: 'Wireless Bluetooth earbuds',
    category: 'Electronics',
    color: 'Black',
    brand: '',
    date: '2026-11-06',
    description: 'Black wireless earbuds with charging case found on a canteen table.'
  },
  {
    item_name: 'boAt wireless airpods',
    category: 'Electronics',
    color: 'White',
    brand: 'boAt',
    date: '2026-11-07',
    description: 'Found boAt wireless earphone pods in seminar hall.'
  },

  // --- For College ID Card (Lost: Green, Keys & Identity) ---
  {
    item_name: 'Adamas University ID card',
    category: 'Keys & Identity',
    color: 'Green',
    brand: 'Adamas',
    date: '2026-11-07',
    description: 'Green student ID card found near canteen entrance.'
  },
  {
    item_name: 'Student card identity',
    category: 'Keys & Identity',
    color: 'White',
    brand: '',
    date: '2026-11-08',
    description: 'Found identity card of student in central library.'
  },

  // --- For Black Leather Wallet (Lost: Baggit, Black, Bags & Wallets) ---
  {
    item_name: 'Baggit Black Wallet',
    category: 'Bags & Wallets',
    color: 'Black',
    brand: 'Baggit',
    date: '2026-11-07',
    description: 'Black Baggit brand leather wallet found near cafeteria.'
  },
  {
    item_name: 'Leather pocket wallet',
    category: 'Bags & Wallets',
    color: 'Brown',
    brand: '',
    date: '2026-11-08',
    description: 'Leather wallet with cards found at bus stop.'
  },

  // --- For Scientific Calculator (Lost: Casio, Black, Academic Tools) ---
  {
    item_name: 'Engineering calculator Casio',
    category: 'Academic Tools',
    color: 'Black',
    brand: 'Casio',
    date: '2026-11-09',
    description: 'Found an engineering calculator by Casio in computer lab.'
  },
  {
    item_name: 'Scientific study calculator',
    category: 'Academic Tools',
    color: 'Grey',
    brand: '',
    date: '2026-11-10',
    description: 'Scientific calculator found in classroom 101.'
  },

  // --- For iPhone 14 (Lost: Apple, Black, Electronics) ---
  {
    item_name: 'Black smartphone mobile phone',
    category: 'Electronics',
    color: 'Black',
    brand: '',
    date: '2026-11-10',
    description: 'Black smartphone phone found on bench near library.'
  },
  {
    item_name: 'Apple iPhone 13 phone',
    category: 'Electronics',
    color: 'Black',
    brand: 'Apple',
    date: '2026-11-11',
    description: 'Apple phone smartphone found in seminar hall.'
  },

  // --- For Red Running Shoes (Lost: Adidas, Red, Clothing & Apparel) ---
  {
    item_name: 'Red trainers running footwear',
    category: 'Clothing & Apparel',
    color: 'Red',
    brand: '',
    date: '2026-11-11',
    description: 'Red trainers shoes found near sports field.'
  },
  {
    item_name: 'Adidas sports footwear',
    category: 'Clothing & Apparel',
    color: 'White',
    brand: 'Adidas',
    date: '2026-11-12',
    description: 'Found Adidas footwear shoes in gym.'
  },

  // --- For Blue Water Bottle (Lost: Milton, Blue, Personal Belongings) ---
  {
    item_name: 'Blue water flask bottle',
    category: 'Personal Belongings',
    color: 'Blue',
    brand: '',
    date: '2026-11-12',
    description: 'Found a blue water flask hydration bottle near auditorium.'
  },
  {
    item_name: 'Milton steel flask',
    category: 'Personal Belongings',
    color: 'Silver',
    brand: 'Milton',
    date: '2026-11-13',
    description: 'Found Milton flask bottle in canteen.'
  },

  // --- For Samsung Galaxy S23 (Lost: Samsung, White, Electronics) ---
  {
    item_name: 'Samsung Galaxy smartphone',
    category: 'Electronics',
    color: 'Silver',
    brand: 'Samsung',
    date: '2026-11-13',
    description: 'Samsung Galaxy mobile phone found in physics lab.'
  },
  {
    item_name: 'White smartphone phone',
    category: 'Electronics',
    color: 'White',
    brand: '',
    date: '2026-11-14',
    description: 'White mobile smartphone found in classroom.'
  },

  // --- For Black Umbrella (Lost: Stag, Black, Personal Belongings) ---
  {
    item_name: 'Rain umbrella black',
    category: 'Personal Belongings',
    color: 'Black',
    brand: '',
    date: '2026-11-14',
    description: 'Black rain umbrella left at hostel gate.'
  },
  {
    item_name: 'Stag compact umbrella',
    category: 'Personal Belongings',
    color: 'Blue',
    brand: 'Stag',
    date: '2026-11-15',
    description: 'Stag brand folding umbrella found near main gate.'
  },

  // --- For Noise Smart Watch (Lost: Noise, Black, Electronics) ---
  {
    item_name: 'Noise colorfit watch',
    category: 'Electronics',
    color: 'Black',
    brand: 'Noise',
    date: '2026-11-07',
    description: 'Noise smartwatch found near basketball court.'
  },
  {
    item_name: 'Smart watch wearable fitness',
    category: 'Electronics',
    color: 'Black',
    brand: '',
    date: '2026-11-08',
    description: 'Black smart watch fitness tracker found in gym.'
  },

  // --- For Black Power Bank (Lost: Ambrane, Black, Electronics) ---
  {
    item_name: 'Portable battery power bank',
    category: 'Electronics',
    color: 'Black',
    brand: '',
    date: '2026-11-10',
    description: 'Black portable power bank battery pack found in computer lab.'
  },
  {
    item_name: 'Ambrane portable charger',
    category: 'Electronics',
    color: 'White',
    brand: 'Ambrane',
    date: '2026-11-11',
    description: 'Ambrane brand charger power bank found in library.'
  },

  // --- For Blue Backpack (Lost: Wildcraft, Blue, Bags & Wallets) ---
  {
    item_name: 'Wildcraft rucksack bag blue',
    category: 'Bags & Wallets',
    color: 'Blue',
    brand: 'Wildcraft',
    date: '2026-11-05',
    description: 'Blue Wildcraft rucksack bag found in computer lab corridor.'
  }
];

// Additional LOST items (under Niladri) so Found items also have 2-3 matches
const ADDITIONAL_LOST_ITEMS = [
  {
    item_name: 'HP Portable Laptop',
    category: 'Electronics',
    color: 'Silver',
    brand: 'HP',
    date: '2026-11-01',
    description: 'Lost my silver HP portable laptop in the academic block.'
  },
  {
    item_name: 'Wristwatch Casio',
    category: 'Accessories',
    color: 'Silver',
    brand: 'Casio',
    date: '2026-11-02',
    description: 'Lost my silver wristwatch by Casio around campus.'
  },
  {
    item_name: 'boAt Earbuds 141',
    category: 'Electronics',
    color: 'Black',
    brand: 'boAt',
    date: '2026-11-04',
    description: 'Lost black boAt wireless earbuds near the cafeteria.'
  },
  {
    item_name: 'Student ID Identity Card',
    category: 'Keys & Identity',
    color: 'Green',
    brand: '',
    date: '2026-11-05',
    description: 'Lost green student identity card on the bus route.'
  },
  {
    item_name: 'Leather Wallet',
    category: 'Bags & Wallets',
    color: 'Black',
    brand: '',
    date: '2026-11-06',
    description: 'Lost black leather wallet containing college receipts.'
  },
  {
    item_name: 'Casio FX Calculator',
    category: 'Academic Tools',
    color: 'Black',
    brand: 'Casio',
    date: '2026-11-07',
    description: 'Lost black Casio FX scientific calculator in maths lecture.'
  },
  {
    item_name: 'Apple Smartphone iPhone',
    category: 'Electronics',
    color: 'Black',
    brand: 'Apple',
    date: '2026-11-08',
    description: 'Lost black Apple iPhone smartphone near sports arena.'
  },
  {
    item_name: 'Adidas Running Shoes',
    category: 'Clothing & Apparel',
    color: 'Red',
    brand: 'Adidas',
    date: '2026-11-09',
    description: 'Lost red Adidas running footwear near campus gym.'
  },
  {
    item_name: 'Milton Water Bottle',
    category: 'Personal Belongings',
    color: 'Blue',
    brand: 'Milton',
    date: '2026-11-10',
    description: 'Lost blue Milton hydration bottle in study room.'
  },
  {
    item_name: 'Samsung Galaxy Phone',
    category: 'Electronics',
    color: 'White',
    brand: 'Samsung',
    date: '2026-11-11',
    description: 'Lost white Samsung Galaxy smartphone in auditorium.'
  }
];

async function main() {
  console.log('🌱 Starting AUlaf Multi-Match Expansion Seeding...');

  // 1. Get Niladri
  const { data: niladriRows } = await supabase
    .from('users')
    .select('*')
    .or('full_name.ilike.%Niladri%,email.ilike.%niladri%')
    .limit(1);

  const niladriUser = niladriRows[0];
  console.log(`Found Niladri: ${niladriUser.full_name} (${niladriUser.id})`);

  // 2. Get Test Finder Bot
  const { data: finderRows } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'finder@adamas.ac.in')
    .limit(1);

  const finderUser = finderRows[0];
  console.log(`Found Finder Bot: ${finderUser.full_name} (${finderUser.id})`);

  // 3. Insert Additional FOUND items (under finder bot)
  let foundInserted = 0;
  for (let i = 0; i < ADDITIONAL_FOUND_ITEMS.length; i++) {
    const item = ADDITIONAL_FOUND_ITEMS[i];

    // Check duplicate
    const { data: existing } = await supabase
      .from('found_reports')
      .select('id')
      .eq('item_name', item.item_name)
      .eq('user_id', finderUser.id);

    if (existing && existing.length > 0) {
      continue;
    }

    const record = {
      id: randomUUID(),
      user_id: finderUser.id,
      reporter_name: finderUser.full_name,
      reporter_email: finderUser.email,
      item_name: item.item_name,
      category: item.category,
      description: item.description,
      color: item.color,
      brand: item.brand,
      characteristics: '',
      location: loc(i + 15),
      date: item.date,
      time: '14:30',
      custody: 'With Security Desk',
      image: null,
      verification_question: 'What color is the item?',
      verification_answer: item.color,
      status: 'Active',
      moderation_status: 'approved',
      flag_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insErr } = await supabase.from('found_reports').insert(record);
    if (insErr) {
      console.error(`Failed to insert found item "${item.item_name}":`, insErr.message);
    } else {
      foundInserted++;
    }
  }

  // 4. Insert Additional LOST items (under Niladri)
  let lostInserted = 0;
  for (let i = 0; i < ADDITIONAL_LOST_ITEMS.length; i++) {
    const item = ADDITIONAL_LOST_ITEMS[i];

    // Check duplicate
    const { data: existing } = await supabase
      .from('lost_reports')
      .select('id')
      .eq('item_name', item.item_name)
      .eq('user_id', niladriUser.id);

    if (existing && existing.length > 0) {
      continue;
    }

    const record = {
      id: randomUUID(),
      user_id: niladriUser.id,
      reporter_name: niladriUser.full_name,
      reporter_email: niladriUser.email,
      item_name: item.item_name,
      category: item.category,
      description: item.description,
      color: item.color,
      brand: item.brand,
      characteristics: '',
      location: loc(i + 25),
      date: item.date,
      time: '11:15',
      image: null,
      verification_question: 'What color is the item?',
      verification_answer: item.color,
      status: 'Active',
      moderation_status: 'approved',
      flag_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insErr } = await supabase.from('lost_reports').insert(record);
    if (insErr) {
      console.error(`Failed to insert lost item "${item.item_name}":`, insErr.message);
    } else {
      lostInserted++;
    }
  }

  console.log(`\n🎉 Multi-Match Expansion Seeding Complete!`);
  console.log(`✅ Inserted ${foundInserted} new found items`);
  console.log(`✅ Inserted ${lostInserted} new lost items`);
}

main().catch(console.error);
