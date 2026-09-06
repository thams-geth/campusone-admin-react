import type { Student, StudentStatus } from '@/types/student'
import { TENANT_ID } from '@/services/mock/db/tenant'

const FIRST_NAMES_MALE = [
  'Aarav', 'Vihaan', 'Aditya', 'Krishna', 'Ishaan', 'Rohan', 'Arjun', 'Kabir',
  'Dev', 'Karthik', 'Nikhil', 'Rajat', 'Siddharth', 'Yash', 'Aryan',
]
const FIRST_NAMES_FEMALE = [
  'Aanya', 'Diya', 'Ira', 'Kavya', 'Myra', 'Riya', 'Saanvi', 'Tara',
  'Ananya', 'Ishita', 'Meera', 'Neha', 'Pooja', 'Sanya', 'Trisha',
]
const LAST_NAMES = [
  'Sharma', 'Verma', 'Iyer', 'Nair', 'Reddy', 'Gupta', 'Menon', 'Rao',
  'Kapoor', 'Joshi', 'Kulkarni', 'Chatterjee', 'Bose', 'Pillai', 'Desai',
]

const DEPARTMENTS = [
  { id: 'dept-cse', code: 'CSE', count: 18 },
  { id: 'dept-ece', code: 'ECE', count: 12 },
  { id: 'dept-mech', code: 'MECH', count: 10 },
  { id: 'dept-civil', code: 'CIVIL', count: 8 },
  { id: 'dept-mba', code: 'MBA', count: 9 },
]

const STATUS_CYCLE: StudentStatus[] = ['active', 'active', 'active', 'active', 'inactive', 'alumni']

/** Deterministic PRNG (mulberry32) so seed data is stable across reloads. */
function createRng(seed: number) {
  let a = seed
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)]
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0')
}

function isoDate(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString()
}

function generateStudents(): Student[] {
  const rng = createRng(20240115)
  const students: Student[] = []
  const usedEmails = new Set<string>()
  let sequence = 1

  for (const dept of DEPARTMENTS) {
    for (let i = 0; i < dept.count; i++) {
      const isFemale = rng() > 0.5
      const gender = isFemale ? 'female' : 'male'
      const firstName = pick(rng, isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE)
      const lastName = pick(rng, LAST_NAMES)

      let email = `${firstName}.${lastName}@aurora.edu`.toLowerCase()
      let suffix = 1
      while (usedEmails.has(email)) {
        suffix += 1
        email = `${firstName}.${lastName}${suffix}@aurora.edu`.toLowerCase()
      }
      usedEmails.add(email)

      const admissionYear = 2021 + Math.floor(rng() * 4)
      const birthYear = admissionYear - (18 + Math.floor(rng() * 4))
      const status = pick(rng, STATUS_CYCLE)
      const id = `student-${pad(sequence, 4)}`

      students.push({
        id,
        tenantId: TENANT_ID,
        firstName,
        lastName,
        email,
        phone: `+91 9${pad(Math.floor(rng() * 900000000) + 100000000, 9)}`,
        rollNumber: `${dept.code}${admissionYear}${pad(sequence, 3)}`,
        departmentId: dept.id,
        gender,
        dateOfBirth: isoDate(birthYear, 1 + Math.floor(rng() * 12), 1 + Math.floor(rng() * 28)),
        admissionDate: isoDate(admissionYear, 6, 1 + Math.floor(rng() * 28)),
        status,
        guardianName: `Mr. ${pick(rng, LAST_NAMES)}`,
        guardianPhone: `+91 8${pad(Math.floor(rng() * 900000000) + 100000000, 9)}`,
        address: `${1 + Math.floor(rng() * 200)}, MG Road, Bengaluru, Karnataka`,
        createdAt: isoDate(admissionYear, 6, 1 + Math.floor(rng() * 28)),
        updatedAt: isoDate(admissionYear, 6, 1 + Math.floor(rng() * 28)),
      })

      sequence += 1
    }
  }

  return students
}

export const mockStudents: Student[] = generateStudents()
