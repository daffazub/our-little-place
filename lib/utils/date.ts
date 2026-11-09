/**
 * lib/date.ts — Utilitas Waktu & Tanggal Aman Zona Waktu (WIB / UTC+7)
 * 
 * Menghindari bug pergeseran tanggal akibat `new Date("YYYY-MM-DD")` yang diurai sebagai UTC Midnight,
 * dan `new Date().toISOString()` yang menghasilkan tanggal kemarin saat diakses dini hari di Indonesia.
 */

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const MONTH_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
]

const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']


/**
 * Mengembalikan string tanggal hari ini dalam format "YYYY-MM-DD"
 * berdasarkan jam lokal perangkat (misal: WIB), BUKAN UTC.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parsing string "YYYY-MM-DD" secara aman tanpa terpengaruh pergeseran timezone UTC.
 */
export function parseLocalDate(dateStr: string): { year: number; month: number; day: number } {
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

/**
 * Memeriksa apakah suatu tahun adalah tahun kabisat (leap year)
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

/**
 * Format string "YYYY-MM-DD" menjadi teks bahasa Indonesia yang ramah.
 * Contoh: "2026-05-12" -> "12 Mei 2026"
 */
export function formatLocalDate(
  dateStr: string,
  options: { showDayName?: boolean; showYear?: boolean; shortMonth?: boolean } = {}
): string {
  if (!dateStr) return '-'
  const { year, month, day } = parseLocalDate(dateStr)
  const monthIndex = Math.max(0, Math.min(11, month - 1))
  const monthLabel = options.shortMonth ? MONTH_SHORT_ID[monthIndex] : MONTH_NAMES_ID[monthIndex]

  // Buat objek tanggal lokal untuk nama hari (opsional)
  let dayName = ''
  if (options.showDayName) {
    const localDate = new Date(year, month - 1, day)
    dayName = `${DAY_NAMES_ID[localDate.getDay()]}, `
  }

  const yearStr = options.showYear !== false ? ` ${year}` : ''
  return `${dayName}${day} ${monthLabel}${yearStr}`
}

/**
 * Menghitung hari peringatan berikutnya untuk tanggal berulang tahunan (Ulang Tahun / Anniversary).
 * Menangani kasus 29 Februari (kabisat) agar otomatis jatuh ke 28 Februari pada tahun biasa.
 */
export function getNextRecurringOccurrence(dateStr: string): {
  nextDateStr: string
  daysLeft: number
  isToday: boolean
  displayAgeYear?: number
} {
  const { year: birthYear, month, day } = parseLocalDate(dateStr)
  const todayStr = getLocalDateString()
  const today = parseLocalDate(todayStr)

  // Cek apakah hari ini
  if (today.month === month && (today.day === day || (month === 2 && day === 29 && !isLeapYear(today.year) && today.day === 28))) {
    return {
      nextDateStr: todayStr,
      daysLeft: 0,
      isToday: true,
      displayAgeYear: today.year - birthYear,
    }
  }

  // Tentukan tahun target (tahun ini atau tahun depan)
  let targetYear = today.year
  let targetDay = day

  // Tangani 29 Februari
  if (month === 2 && day === 29 && !isLeapYear(targetYear)) {
    targetDay = 28
  }

  const todayDateObj = new Date(today.year, today.month - 1, today.day)
  let targetDateObj = new Date(targetYear, month - 1, targetDay)

  // Jika sudah lewat tahun ini, jadwalkan ke tahun berikutnya
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

/**
 * Menghitung jumlah hari sejak ruang kenangan dibuat (Hari ke-N bersama).
 */
export function getDaysTogether(createdAtIso?: string | null): number {
  if (!createdAtIso) return 1
  try {
    const createdDate = new Date(createdAtIso)
    const today = new Date()

    // Normalisasi jam ke 00:00:00 untuk perbandingan murni hari
    const start = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate()).getTime()
    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()

    const diffMs = Math.max(0, now - start)
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    return Math.max(1, days + 1) // Hari pertama = Hari ke-1
  } catch {
    return 1
  }
}

