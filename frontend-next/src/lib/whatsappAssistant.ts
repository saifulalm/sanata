/**
 * Asisten widget WhatsApp: menjawab pertanyaan umum sebelum percakapan
 * dilempar ke manusia.
 *
 * Sengaja **tanpa model bahasa eksternal**. Basis pengetahuannya adalah koleksi
 * FAQ yang sudah dikelola admin, jadi jawabannya selalu kalimat yang memang
 * ditulis dan disetujui tim — bukan karangan yang bisa menjanjikan hal yang
 * tidak benar soal harga, garansi, atau jadwal. Menambah jawaban baru berarti
 * menambah satu entri FAQ di admin, bukan menyentuh kode.
 *
 * Pencocokan memakai irisan kata: cukup untuk pertanyaan yang berulang setiap
 * hari, dan gagalnya bisa diprediksi — kalau tidak ada kata yang beririsan,
 * asisten mengaku tidak tahu lalu menyerahkan ke WhatsApp. Itu jauh lebih aman
 * daripada jawaban yang terdengar yakin tapi salah.
 */

export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
}

export interface AssistantMatch {
  entry: KnowledgeEntry;
  /** 0–1. Semakin tinggi semakin banyak kata pertanyaan yang cocok. */
  score: number;
}

/**
 * Kata yang terlalu umum untuk membedakan pertanyaan satu dengan lainnya.
 * Dibiarkan pendek: daftar yang terlalu agresif justru membuang kata kunci.
 */
const STOPWORDS = new Set([
  "yang", "untuk", "dengan", "dari", "pada", "ini", "itu", "dan", "atau", "di",
  "ke", "apa", "apakah", "bagaimana", "berapa", "kah", "saya", "kami", "kita",
  "anda", "bisa", "boleh", "ada", "adakah", "mau", "ingin", "tolong", "mohon",
  "sudah", "belum", "juga", "saja", "akan", "kalau", "jika", "tentang", "soal",
  "min", "gan", "pak", "bu", "halo", "hai", "selamat", "siang", "pagi", "malam",
]);

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    // Tanda baca dibuang; angka dipertahankan karena "2 lantai" atau "100 m2"
    // sering jadi pembeda pertanyaan.
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

/**
 * Kata dasar yang sangat kasar untuk bahasa Indonesia.
 *
 * Bukan stemmer sungguhan — hanya membuang imbuhan yang paling sering muncul
 * supaya "pembayaran" dan "bayar", atau "membangun" dan "bangun", tetap
 * bertemu. Sengaja dijaga sederhana: stemmer penuh akan menyeret dependensi
 * baru demi keuntungan yang kecil untuk daftar FAQ sepanjang ini.
 */
function stem(token: string): string {
  let word = token;
  for (const prefix of ["meng", "meny", "mem", "men", "peng", "peny", "pem", "pen", "ber", "ter", "per", "di", "ke", "se"]) {
    if (word.length > prefix.length + 3 && word.startsWith(prefix)) {
      word = word.slice(prefix.length);
      break;
    }
  }
  for (const suffix of ["kannya", "annya", "nya", "kan", "an", "i"]) {
    if (word.length > suffix.length + 3 && word.endsWith(suffix)) {
      word = word.slice(0, -suffix.length);
      break;
    }
  }
  return word;
}

function stemSet(value: string): Set<string> {
  return new Set(tokenize(value).map(stem));
}

function overlap(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const token of a) if (b.has(token)) count += 1;
  return count;
}

/** Di bawah ambang ini asisten memilih mengaku tidak tahu. */
export const ANSWER_THRESHOLD = 0.34;

/**
 * Jawaban terbaik untuk sebuah pertanyaan, atau `null` bila tidak cukup yakin.
 *
 * Kecocokan pada teks pertanyaan dihargai dua kali lipat dibanding kecocokan
 * pada isi jawaban: kata yang muncul di pertanyaan jauh lebih menentukan topik
 * daripada kata yang kebetulan lewat di paragraf jawaban.
 */
export function findAnswer(question: string, entries: KnowledgeEntry[]): AssistantMatch | null {
  const asked = stemSet(question);
  if (asked.size === 0 || entries.length === 0) return null;

  let best: AssistantMatch | null = null;

  for (const entry of entries) {
    const questionTokens = stemSet(entry.question);
    const answerTokens = stemSet(entry.answer);

    const hits = overlap(asked, questionTokens) * 2 + overlap(asked, answerTokens);
    if (hits === 0) continue;

    const score = Math.min(1, hits / (asked.size * 2));
    if (!best || score > best.score) best = { entry, score };
  }

  return best && best.score >= ANSWER_THRESHOLD ? best : null;
}

/**
 * Tim yang paling relevan untuk sebuah pertanyaan.
 *
 * Dicocokkan dengan peran, keterangan, dan kata kunci tiap agen. Bila tidak ada
 * yang menonjol, `null` dikembalikan dan widget membiarkan pengunjung memilih
 * sendiri daripada mengarahkan ke tim yang salah.
 */
export function suggestAgent<T extends { id: string; role: string | null; note: string | null; keywords: string | null }>(
  question: string,
  agents: T[]
): T | null {
  const asked = stemSet(question);
  if (asked.size === 0 || agents.length < 2) return null;

  let best: { agent: T; hits: number } | null = null;

  for (const agent of agents) {
    const haystack = stemSet([agent.role, agent.note, agent.keywords].filter(Boolean).join(" "));
    const hits = overlap(asked, haystack);
    if (hits === 0) continue;
    if (!best || hits > best.hits) best = { agent, hits };
  }

  return best ? best.agent : null;
}
