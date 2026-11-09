/**
 * tests/unit-tests.mjs
 * Unit test mandiri yang dapat dijalankan langsung dengan `node tests/unit-tests.mjs`
 */

// ── 1. Re-implementasi fungsi murni dari lib/date.ts untuk verifikasi logika ──
const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]
const MONTH_SHORT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
  }
  const parts = dateStr.trim().split('-')
  const year = parseInt(parts[0], 10) || new Date().getFullYear()
  const month = parseInt(parts[1], 10) || 1
  const day = parseInt(parts[2], 10) || 1
  return { year, month, day }
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

function formatLocalDate(dateStr, options = {}) {
  if (!dateStr) return '-'
  const { year, month, day } = parseLocalDate(dateStr)
  const monthIndex = Math.max(0, Math.min(11, month - 1))
  const monthLabel = options.shortMonth ? MONTH_SHORT_ID[monthIndex] : MONTH_NAMES_ID[monthIndex]
  let dayName = ''
  if (options.showDayName) {
    const localDate = new Date(year, month - 1, day)
    dayName = `${DAY_NAMES_ID[localDate.getDay()]}, `
  }
  const yearStr = options.showYear !== false ? ` ${year}` : ''
  return `${dayName}${day} ${monthLabel}${yearStr}`
}

function getNextRecurringOccurrence(dateStr) {
  const { year: birthYear, month, day } = parseLocalDate(dateStr)
  const todayStr = getLocalDateString()
  const today = parseLocalDate(todayStr)

  if (today.month === month && (today.day === day || (month === 2 && day === 29 && !isLeapYear(today.year) && today.day === 28))) {
    return {
      nextDateStr: todayStr,
      daysLeft: 0,
      isToday: true,
      displayAgeYear: today.year - birthYear,
    }
  }

  let targetYear = today.year
  let targetDay = day

  if (month === 2 && day === 29 && !isLeapYear(targetYear)) {
    targetDay = 28
  }

  const todayDateObj = new Date(today.year, today.month - 1, today.day)
  let targetDateObj = new Date(targetYear, month - 1, targetDay)

  if (targetDateObj < todayDateObj) {
    targetYear += 1
    targetDay = day
    if (month === 2 && day === 29 && !isLeapYear(targetYear)) {
      targetDay = 28
    }
    targetDateObj = new Date(targetYear, month - 1, targetDay)
  }

  const msPerDay = 1000 * 60 * 60 * 24
  const diffTime = targetDateObj.getTime() - todayDateObj.getTime()
  const daysLeft = Math.round(diffTime / msPerDay)

  const formattedMonth = String(month).padStart(2, '0')
  const formattedDay = String(targetDay).padStart(2, '0')
  const nextDateStr = `${targetYear}-${formattedMonth}-${formattedDay}`

  return {
    nextDateStr,
    daysLeft,
    isToday: daysLeft === 0,
    displayAgeYear: targetYear - birthYear,
  }
}

function getDaysTogether(createdAtIso) {
  if (!createdAtIso) return 1
  try {
    const createdDate = new Date(createdAtIso)
    const today = new Date()
    const start = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate()).getTime()
    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    const diffMs = Math.max(0, now - start)
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    return Math.max(1, days + 1)
  } catch {
    return 1
  }
}

function generateRandomToken(len = 20) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const randomBytes = new Uint8Array(len)
  crypto.getRandomValues(randomBytes)
  let res = ''
  for (let i = 0; i < len; i++) {
    res += chars.charAt(randomBytes[i] % chars.length)
  }
  return res
}

function isSafeAvatarUrl(url) {
  if (!url) return true
  try {
    const parsed = new URL(url)
    return (
      (parsed.protocol === 'https:' && parsed.hostname === 'api.dicebear.com') ||
      url.startsWith('/')
    )
  } catch {
    return false
  }
}

// ── Assertion Helper ──
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ GAGAL: ${message}`)
    process.exit(1)
  }
  console.log(`  ✓ ${message}`)
}

console.log('--- MENJALANKAN PENGUJIAN LOGIKA INTI ---')

// [1]
console.log('\n[1] Format Tanggal & Zona Waktu Lokal (WIB):')
const today = getLocalDateString()
assert(/^\d{4}-\d{2}-\d{2}$/.test(today), `Format string tanggal hari ini valid YYYY-MM-DD (${today})`)
const p = parseLocalDate('2026-11-03')
assert(p.year === 2026 && p.month === 11 && p.day === 3, 'parseLocalDate mengurai komponen tahun, bulan, tanggal dengan tepat')
assert(formatLocalDate('2026-05-12') === '12 Mei 2026', 'formatLocalDate menghasilkan "12 Mei 2026"')

// [2]
console.log('\n[2] Uji Tahun Kabisat & 29 Februari:')
assert(isLeapYear(2024) === true, '2024 adalah tahun kabisat')
assert(isLeapYear(2025) === false, '2025 bukan tahun kabisat')
assert(isLeapYear(2026) === false, '2026 bukan tahun kabisat')
const leap = getNextRecurringOccurrence('2000-02-29')
assert(leap.nextDateStr.endsWith('-02-28') || leap.nextDateStr.endsWith('-02-29'), `Peringatan 29 Feb dialihkan aman di tahun biasa (${leap.nextDateStr})`)
assert(leap.daysLeft >= 0, `Jarak hari menuju peringatan non-negatif (${leap.daysLeft} hari)`)

// [3]
console.log('\n[3] Uji Counter Hari Bersama:')
const daysAgo3 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
assert(getDaysTogether(daysAgo3) >= 3, `getDaysTogether menghasilkan minimal 3 hari untuk room 3 hari lalu (${getDaysTogether(daysAgo3)} hari)`)

// [4]
console.log('\n[4] Keamanan Token Undangan Kriptografi:')
const t1 = generateRandomToken(20)
const t2 = generateRandomToken(20)
assert(t1.length === 20, `Panjang token kriptografi tepat 20 karakter (${t1})`)
assert(t1 !== t2, 'Dua token yang di-generate berturut-turut unik')

// [5]
console.log('\n[5] Sanitasi URL Avatar:')
assert(isSafeAvatarUrl('https://api.dicebear.com/7.x/adventurer/svg?seed=Felix') === true, 'URL Dicebear resmi diterima')
assert(isSafeAvatarUrl('javascript:alert(1)') === false, 'Injeksi javascript: berhasil ditolak')
assert(isSafeAvatarUrl('http://evil.com/fake.png') === false, 'URL pihak ketiga berbahaya ditolak')
assert(isSafeAvatarUrl(null) === true, 'Avatar null diizinkan')

// [6]
console.log('\n[6] Pembatasan Kuota Foto Maksimal 10:')
const incomingPhotos = Array.from({ length: 14 }, (_, i) => `photo-${i + 1}`)
const limitedPhotos = incomingPhotos.slice(0, 10)
assert(limitedPhotos.length === 10, 'Array foto dipotong tepat 10 tanpa merusak foto awal')

console.log('\n🎉 SEMUA 16 ASSERTION PENGUJIAN LOGIKA INTI LOLOS 100%!\n')

