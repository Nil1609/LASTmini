// Standalone seed script — runs with: node src/lib/matching/seed.js
// Uses Supabase service-role key directly (no Next.js runtime needed)

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

// ─── 25 LOST items ────────────────────────────────────────────────────────────
const LOST_ITEMS = [
  { item_name: 'HP Laptop', category: 'Electronics', color: 'Silver', brand: 'HP', date: '2026-11-01', description: 'A silver HP laptop lost on campus, likely left in a classroom or lab.' },
  { item_name: 'Casio Watch', category: 'Accessories', color: 'Silver', brand: 'Casio', date: '2026-11-02', description: 'Silver Casio wristwatch misplaced somewhere around campus.' },
  { item_name: 'Blue Backpack', category: 'Bags & Wallets', color: 'Blue', brand: 'Wildcraft', date: '2026-11-03', description: 'Blue Wildcraft backpack with college books inside, lost near the main building.' },
  { item_name: 'Boat Airdopes 141', category: 'Electronics', color: 'Black', brand: 'boAt', date: '2026-11-04', description: 'Black boAt Airdopes 141 earbuds in their charging case, lost in the canteen.' },
  { item_name: 'College ID Card', category: 'Keys & Identity', color: 'Green', brand: 'College', date: '2026-11-05', description: 'Green college student ID card lost somewhere on campus.' },
  { item_name: 'Black Leather Wallet', category: 'Bags & Wallets', color: 'Black', brand: 'Baggit', date: '2026-11-06', description: 'Black Baggit leather wallet with cards and some cash inside.' },
  { item_name: 'Scientific Calculator', category: 'Academic Tools', color: 'Black', brand: 'Casio', date: '2026-11-07', description: 'Black Casio scientific calculator lost during lab session.' },
  { item_name: 'iPhone 14', category: 'Electronics', color: 'Black', brand: 'Apple', date: '2026-11-08', description: 'Black Apple iPhone 14 smartphone lost on campus, has a cracked screen protector.' },
  { item_name: 'Red Running Shoes', category: 'Clothing & Apparel', color: 'Red', brand: 'Adidas', date: '2026-11-09', description: 'Red Adidas running shoes left in the gym changing area.' },
  { item_name: 'Blue Water Bottle', category: 'Personal Belongings', color: 'Blue', brand: 'Milton', date: '2026-11-10', description: 'Blue Milton water bottle lost near the canteen or classroom.' },
  { item_name: 'Samsung Galaxy S23', category: 'Electronics', color: 'White', brand: 'Samsung', date: '2026-11-11', description: 'White Samsung Galaxy S23 phone lost in the seminar hall.' },
  { item_name: 'Black Umbrella', category: 'Personal Belongings', color: 'Black', brand: 'Stag', date: '2026-11-12', description: 'Black Stag folding umbrella left behind after rain, possibly in the bus stop area.' },
  { item_name: 'Gold Ring', category: 'Personal Belongings', color: 'Gold', brand: 'Generic', date: '2026-11-13', description: 'Gold ring of sentimental value lost somewhere on campus.' },
  { item_name: 'Sony Earphones', category: 'Electronics', color: 'White', brand: 'Sony', date: '2026-11-14', description: 'White Sony wired earphones lost in the computer lab.' },
  { item_name: 'Green Lab Coat', category: 'Clothing & Apparel', color: 'Green', brand: 'Generic', date: '2026-11-15', description: 'Green lab coat lost after a science practical session in the physics lab.' },
  { item_name: 'Physics Textbook', category: 'Academic Tools', color: 'Blue', brand: 'HC Verma', date: '2026-11-16', description: 'Blue HC Verma physics textbook left in the classroom or library.' },
  { item_name: 'Yoga Mat', category: 'Sports & Fitness', color: 'Purple', brand: 'Strauss', date: '2026-11-17', description: 'Purple Strauss yoga mat lost after a gym session.' },
  { item_name: 'Brown Leather Belt', category: 'Clothing & Apparel', color: 'Brown', brand: 'Woodland', date: '2026-11-18', description: 'Brown Woodland leather belt lost in the hostel or changing room.' },
  { item_name: 'JBL Bluetooth Speaker', category: 'Electronics', color: 'Black', brand: 'JBL', date: '2026-11-19', description: 'Black JBL portable bluetooth speaker lost in the auditorium or seminar hall.' },
  { item_name: 'Blue Denim Jacket', category: 'Clothing & Apparel', color: 'Blue', brand: 'Levi', date: '2026-11-20', description: 'Blue Levi denim jacket left behind in the canteen or classroom.' },
  { item_name: 'Geometry Box', category: 'Academic Tools', color: 'Silver', brand: 'Camlin', date: '2026-11-21', description: 'Silver Camlin geometry box with compass and other instruments, lost in class.' },
  { item_name: 'Red Duffel Bag', category: 'Bags & Wallets', color: 'Red', brand: 'Wildcraft', date: '2026-11-22', description: 'Red Wildcraft duffel bag left at the gym or sports ground.' },
  { item_name: 'Noise Smart Watch', category: 'Electronics', color: 'Black', brand: 'Noise', date: '2026-11-05', description: 'Black Noise smartwatch lost during campus activities.' },
  { item_name: 'Black Power Bank', category: 'Electronics', color: 'Black', brand: 'Ambrane', date: '2026-11-08', description: 'Black Ambrane power bank lost in the computer lab or seminar hall.' },
  { item_name: 'College Library Card', category: 'Keys & Identity', color: 'White', brand: 'Library', date: '2026-11-10', description: 'White college library card lost, needed to borrow books.' },
];

// ─── 25 FOUND items ───────────────────────────────────────────────────────────
const FOUND_ITEMS = [
  { item_name: 'HP notebook computer', category: 'Electronics', color: 'Silver', brand: 'HP', date: '2026-11-02', description: 'Found a silver HP notebook computer near the classroom block, appears to belong to a student.' },
  { item_name: 'Silver Casio wristwatch', category: 'Accessories', color: 'Silver', brand: 'Casio', date: '2026-11-03', description: 'Found a silver Casio wristwatch lying in the corridor near the main gate.' },
  { item_name: 'Blue college bag', category: 'Bags & Wallets', color: 'Blue', brand: 'Wildcraft', date: '2026-11-04', description: 'Found a blue Wildcraft college bag with some books inside at the bus stop.' },
  { item_name: 'Black boAt earbuds', category: 'Electronics', color: 'Black', brand: 'boAt', date: '2026-11-05', description: 'Found black boAt earbuds in a charging case on the canteen table.' },
  { item_name: 'Student identity card green', category: 'Keys & Identity', color: 'Green', brand: 'Adamas', date: '2026-11-06', description: 'Found a green Adamas University student identity card near the main building entrance.' },
  { item_name: 'Leather wallet black', category: 'Bags & Wallets', color: 'Black', brand: '', date: '2026-11-07', description: 'Found a black leather wallet with some cards inside near the parking area.' },
  { item_name: 'Casio scientific calculator', category: 'Academic Tools', color: 'Black', brand: 'Casio', date: '2026-11-08', description: 'Found a black Casio scientific calculator in the physics lab after class.' },
  { item_name: 'Apple iPhone smartphone black', category: 'Electronics', color: 'Black', brand: 'Apple', date: '2026-11-09', description: 'Found a black Apple iPhone smartphone in the seminar hall, screen protector is cracked.' },
  { item_name: 'Red running shoes Adidas', category: 'Clothing & Apparel', color: 'Red', brand: 'Adidas', date: '2026-11-10', description: 'Found red Adidas running shoes left in the gym area.' },
  { item_name: 'Blue Milton water flask', category: 'Personal Belongings', color: 'Blue', brand: 'Milton', date: '2026-11-11', description: 'Found a blue Milton water flask near the canteen seating.' },
  { item_name: 'Samsung phone white S23', category: 'Electronics', color: 'White', brand: 'Samsung', date: '2026-11-12', description: 'Found a white Samsung Galaxy S23 phone left on a chair in the auditorium.' },
  { item_name: 'Black folding umbrella', category: 'Personal Belongings', color: 'Black', brand: '', date: '2026-11-13', description: 'Found a black folding umbrella left near the bus stop after rain.' },
  { item_name: 'Gold ring jewellery', category: 'Personal Belongings', color: 'Gold', brand: '', date: '2026-11-14', description: 'Found a gold ring near the central library entrance, appears to be valuable.' },
  { item_name: 'White Sony earbuds', category: 'Electronics', color: 'White', brand: 'Sony', date: '2026-11-15', description: 'Found white Sony earbuds on a desk in the computer lab.' },
  { item_name: 'Green lab coat science', category: 'Clothing & Apparel', color: 'Green', brand: '', date: '2026-11-16', description: 'Found a green science lab coat hanging in the physics lab after practical.' },
  { item_name: 'Blue physics book HC Verma', category: 'Academic Tools', color: 'Blue', brand: 'HC Verma', date: '2026-11-17', description: 'Found a blue HC Verma physics textbook left in the central library.' },
  { item_name: 'Purple yoga mat exercise', category: 'Sports & Fitness', color: 'Purple', brand: 'Strauss', date: '2026-11-18', description: 'Found a purple Strauss yoga mat rolled up and left in the gym.' },
  { item_name: 'Brown belt leather Woodland', category: 'Clothing & Apparel', color: 'Brown', brand: 'Woodland', date: '2026-11-19', description: 'Found a brown Woodland leather belt in the hostel washroom area.' },
  { item_name: 'Portable JBL bluetooth speaker', category: 'Electronics', color: 'Black', brand: 'JBL', date: '2026-11-20', description: 'Found a black portable JBL bluetooth speaker left in the auditorium after an event.' },
  { item_name: 'Blue denim jacket Levi', category: 'Clothing & Apparel', color: 'Blue', brand: 'Levi', date: '2026-11-21', description: 'Found a blue Levi denim jacket left on a chair in the canteen.' },
  { item_name: 'Silver geometry box Camlin', category: 'Academic Tools', color: 'Silver', brand: 'Camlin', date: '2026-11-22', description: 'Found a silver Camlin geometry box with instruments in Classroom 101.' },
  { item_name: 'Red rucksack duffel', category: 'Bags & Wallets', color: 'Red', brand: 'Wildcraft', date: '2026-11-05', description: 'Found a red Wildcraft rucksack/duffel bag left near the gym entrance.' },
  { item_name: 'Noise smartwatch black wearable', category: 'Electronics', color: 'Black', brand: 'Noise', date: '2026-11-06', description: 'Found a black Noise smartwatch wearable device on a bench near the main gate.' },
  { item_name: 'Black power bank Ambrane charger', category: 'Electronics', color: 'Black', brand: 'Ambrane', date: '2026-11-09', description: 'Found a black Ambrane power bank charger left in the computer lab.' },
  { item_name: 'White library card student', category: 'Keys & Identity', color: 'White', brand: '', date: '2026-11-11', description: 'Found a white student library card on the floor near the central library entrance.' },
];

async function main() {
  console.log('🌱 Starting AUlaf seed script...');

  // ── 1. Find Niladri's user ──────────────────────────────────────────────────
  const { data: niladriRows, error: niladriErr } = await supabase
    .from('users')
    .select('*')
    .or('full_name.ilike.%Niladri%,email.ilike.%niladri%')
    .limit(5);

  if (niladriErr) {
    console.error('Error querying users:', niladriErr.message);
    process.exit(1);
  }

  let niladriUser = niladriRows && niladriRows.length > 0 ? niladriRows[0] : null;
  if (!niladriUser) {
    console.error('❌ Could not find user Niladri in the database. Please ensure they are registered.');
    process.exit(1);
  }
  console.log(`✅ Found Niladri: id=${niladriUser.id}, name="${niladriUser.full_name}", email=${niladriUser.email}`);

  // ── 2. Find or create Test Finder Bot ──────────────────────────────────────
  const finderEmail = 'finder@adamas.ac.in';
  let { data: finderRows, error: finderErr } = await supabase
    .from('users')
    .select('*')
    .ilike('email', finderEmail)
    .limit(1);

  if (finderErr) {
    console.error('Error querying finder user:', finderErr.message);
    process.exit(1);
  }

  let finderUser = finderRows && finderRows.length > 0 ? finderRows[0] : null;
  if (!finderUser) {
    const newFinder = {
      id: randomUUID(),
      full_name: 'Test Finder Bot',
      email: finderEmail,
      student_id: 'AU2024999',
      school: 'SOE',
      role: 'Student',
      password: 'hashed_placeholder',
      created_at: new Date().toISOString(),
    };
    const { data: inserted, error: insertErr } = await supabase
      .from('users')
      .insert(newFinder)
      .select()
      .single();
    if (insertErr) {
      console.error('Error creating finder user:', insertErr.message);
      process.exit(1);
    }
    finderUser = inserted;
    console.log(`✅ Created Test Finder Bot: id=${finderUser.id}`);
  } else {
    console.log(`✅ Found Test Finder Bot: id=${finderUser.id}`);
  }

  const niladriId = niladriUser.id;
  const finderId = finderUser.id;

  // ── 3. Check existing reports to avoid duplicates ──────────────────────────
  const { data: existingLost } = await supabase
    .from('lost_reports')
    .select('item_name')
    .eq('user_id', niladriId);

  const { data: existingFound } = await supabase
    .from('found_reports')
    .select('item_name')
    .eq('user_id', finderId);

  const existingLostNames = new Set((existingLost || []).map(r => r.item_name.toLowerCase()));
  const existingFoundNames = new Set((existingFound || []).map(r => r.item_name.toLowerCase()));

  // ── 4. Build and insert LOST reports ──────────────────────────────────────
  const now = new Date().toISOString();
  const insertedLostIds = [];
  let skippedLost = 0;

  for (let i = 0; i < LOST_ITEMS.length; i++) {
    const item = LOST_ITEMS[i];
    if (existingLostNames.has(item.item_name.toLowerCase())) {
      console.log(`  ⏭  Skipping duplicate lost: "${item.item_name}"`);
      skippedLost++;
      continue;
    }
    const report = {
      id: randomUUID(),
      user_id: niladriId,
      reporter_name: niladriUser.full_name,
      reporter_email: niladriUser.email,
      item_name: item.item_name,
      category: item.category,
      description: item.description,
      color: item.color,
      brand: item.brand,
      characteristics: '',
      location: loc(i),
      date: item.date,
      time: '10:00',
      image: null,
      verification_question: 'What color is the item?',
      verification_answer: item.color,
      status: 'Active',
      moderation_status: 'approved',
      flag_count: 0,
      created_at: now,
      updated_at: now,
    };
    const { data: ins, error: insErr } = await supabase
      .from('lost_reports')
      .insert(report)
      .select('id')
      .single();
    if (insErr) {
      console.error(`  ❌ Failed to insert lost "${item.item_name}":`, insErr.message);
    } else {
      insertedLostIds.push(ins.id);
      console.log(`  ✓  Lost [${i + 1}/25]: ${item.item_name}`);
    }
  }

  // ── 5. Build and insert FOUND reports ─────────────────────────────────────
  const insertedFoundIds = [];
  let skippedFound = 0;

  for (let i = 0; i < FOUND_ITEMS.length; i++) {
    const item = FOUND_ITEMS[i];
    if (existingFoundNames.has(item.item_name.toLowerCase())) {
      console.log(`  ⏭  Skipping duplicate found: "${item.item_name}"`);
      skippedFound++;
      continue;
    }
    const report = {
      id: randomUUID(),
      user_id: finderId,
      reporter_name: finderUser.full_name,
      reporter_email: finderUser.email,
      item_name: item.item_name,
      category: item.category,
      description: item.description,
      color: item.color,
      brand: item.brand,
      characteristics: '',
      location: loc(i + 7),
      date: item.date,
      time: '11:00',
      image: null,
      verification_question: 'What color is the item?',
      verification_answer: item.color,
      status: 'Active',
      moderation_status: 'approved',
      flag_count: 0,
      created_at: now,
      updated_at: now,
    };
    const { data: ins, error: insErr } = await supabase
      .from('found_reports')
      .insert(report)
      .select('id')
      .single();
    if (insErr) {
      console.error(`  ❌ Failed to insert found "${item.item_name}":`, insErr.message);
    } else {
      insertedFoundIds.push(ins.id);
      console.log(`  ✓  Found [${i + 1}/25]: ${item.item_name}`);
    }
  }

  // ── 6. Summary ─────────────────────────────────────────────────────────────
  const lostInserted = insertedLostIds.length;
  const foundInserted = insertedFoundIds.length;

  console.log('\n──────────────────────────────────────────────');
  console.log(`✅ Seeded ${lostInserted} lost + ${foundInserted} found reports.`);
  console.log(`   Skipped: ${skippedLost} lost, ${skippedFound} found (already exist).`);
  console.log(`   User IDs: [niladri=${niladriId}, finder=${finderId}]`);
  if (insertedLostIds.length >= 3) {
    console.log(`   First 3 lost IDs: ${insertedLostIds.slice(0, 3).join(', ')}`);
  }
  if (insertedFoundIds.length >= 3) {
    console.log(`   First 3 found IDs: ${insertedFoundIds.slice(0, 3).join(', ')}`);
  }
  console.log('──────────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
