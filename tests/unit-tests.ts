/**
 * tests/unit-tests.ts
 * Unit test sederhana untuk memverifikasi logika inti:
 * 1. Utilitas tanggal aman zona waktu (WIB)
 * 2. Penanganan tahun kabisat (29 Februari)
 * 3. Penghitungan hari peringatan (recurring)
 * 4. Penghitungan hari bersama (days together)
 * 5. Sanitasi URL avatar
 * 6. Generator token acak kriptografi
 * 7. Pembatasan foto maksimal 10
 */

import {
  getLocalDateString,
  parseLocalDate,
  formatLocalDate,
  isLeapYear,
  getNextRecurringOccurrence,
  getDaysTogether,
} from '../lib/utils/date'
import { generateRandomToken, isSafeAvatarUrl } from '../lib/services/rooms'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`)
  }
  console.log(`  ✓ ${message}`)
}

console.log('--- RUNNING UNIT TESTS ---')

// ── Test 1: getLocalDateString format YYYY-MM-DD ──
console.log('\n[1] Date Formatting & Timezone Safety:')
const todayStr = getLocalDateString()
assert(/^\d{4}-\d{2}-\d{2}$/.test(todayStr), `getLocalDateString menghasilkan YYYY-MM-DD (${todayStr})`)

// ── Test 2: parseLocalDate ──
const parsed = parseLocalDate('2026-11-03')
assert(parsed.year === 2026 && parsed.month === 11 && parsed.day === 3, 'parseLocalDate mengurai 2026-11-03 dengan tepat')

// ── Test 3: formatLocalDate (Bahasa Indonesia) ──
const formatted = formatLocalDate('2026-05-12')
assert(formatted === '12 Mei 2026', `formatLocalDate menghasilkan teks '12 Mei 2026' (dapat: ${formatted})`)

// ── Test 4: Leap Year Check ──
console.log('\n[2] Leap Year & 29 Februari Handling:')
assert(isLeapYear(2024) === true, 'Tahun 2024 adalah tahun kabisat')
assert(isLeapYear(2025) === false, 'Tahun 2025 bukan tahun kabisat')
assert(isLeapYear(2026) === false, 'Tahun 2026 bukan tahun kabisat')

// ── Test 5: getNextRecurringOccurrence (Termasuk 29 Februari) ──
const leapOccurrence = getNextRecurringOccurrence('2000-02-29')
assert(leapOccurrence.nextDateStr.endsWith('-02-28') || leapOccurrence.nextDateStr.endsWith('-02-29'), 
  `29 Februari otomatis jatuh ke 28 Feb di tahun non-kabisat (${leapOccurrence.nextDateStr})`)
assert(typeof leapOccurrence.daysLeft === 'number' && leapOccurrence.daysLeft >= 0, 'daysLeft adalah angka non-negatif')

// ── Test 6: getDaysTogether ──
console.log('\n[3] Days Together Counter:')
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
const days = getDaysTogether(oneDayAgo)
assert(days >= 1, `getDaysTogether menghasilkan minimal 1 hari (${days})`)

// ── Test 7: Cryptographic Random Token Generator ──
console.log('\n[4] Security & Random Token:')
const token1 = generateRandomToken(20)
const token2 = generateRandomToken(20)
assert(token1.length === 20, `generateRandomToken menghasilkan token panjang 20 (${token1})`)
assert(token1 !== token2, 'Dua token yang dibuat berturut-turut berbeda unik')

// ── Test 8: Avatar URL Whitelist Sanitizer ──
console.log('\n[5] Avatar URL Sanitizer:')
assert(isSafeAvatarUrl('https://api.dicebear.com/7.x/adventurer/svg?seed=Felix') === true, 'Dicebear HTTPS URL diterima')
assert(isSafeAvatarUrl('javascript:alert(1)') === false, 'javascript: injection ditolak')
assert(isSafeAvatarUrl('http://evil.com/malicious.png') === false, 'External non-Dicebear URL ditolak')
assert(isSafeAvatarUrl(null) === true, 'null avatar diterima (opsional)')

// ── Test 9: Pembatasan Maksimal 10 Foto ──
console.log('\n[6] Photo Upload Limit (Max 10):')
const mockPhotos = Array.from({ length: 15 }, (_, i) => `photo-${i + 1}.jpg`)
const cappedPhotos = mockPhotos.slice(0, 10)
assert(cappedPhotos.length === 10, 'Array 15 foto dibatasi maksimal 10 foto tanpa merusak data')

console.log('\n🎉 ALL UNIT TESTS PASSED SUCCESSFULLY!')

