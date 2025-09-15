// Lightweight suggestions and autocorrect helpers (no external deps)

// Small common word list for corrections and next-word suggestions
const COMMON_WORDS = (
  "i,you,he,she,we,they,it,who,what,when,where,why,how,which,whom,whose,"
  + "is,are,was,were,be,been,being,do,does,did,have,has,had,will,would,can,could,"
  + "a,an,the,of,to,in,for,on,with,as,by,from,about,into,over,after,before,"
  + "make,made,build,built,create,created,develop,developed,design,designed,"
  + "write,give,show,generate,explain,summarize,translate,fix,improve,"
  + "code,script,function,component,prompt,grammar,plan,steps,example,"
  + "image,photo,picture,diagram,table,list,"
  + "javascript,typescript,python,java,sql,html,css,react,next,node"
).split(",")
  .map((w) => w.trim())
  .filter(Boolean)

const NEXT_MAP = {
  "how": ["to", "can", "do"],
  "what": ["is", "are"],
  "why": ["does", "is"],
  "who": ["made", "are", "is"],
  "generate": ["code", "image", "plan"],
  "write": ["a", "an", "the"],
  "make": ["a", "an"],
  "create": ["a", "an", "image"],
  "explain": ["like", "in"],
  "summarize": ["this", "the"],
  "translate": ["this", "to"],
  "fix": ["grammar", "this"],
}

const PROMPT_TEMPLATES = [
  "Explain like I'm 5: ",
  "Summarize this text: ",
  "Generate code in JavaScript to: ",
  "Create a study plan for: ",
  "Translate to English: ",
  "List the key steps to: ",
  "Write a regex for: ",
]

function editDistanceWithin(a, b, maxEdits = 1) {
  a = String(a || "").toLowerCase()
  b = String(b || "").toLowerCase()
  const la = a.length
  const lb = b.length
  if (Math.abs(la - lb) > maxEdits) return false
  let prev = new Array(lb + 1)
  let curr = new Array(lb + 1)
  for (let j = 0; j <= lb; j++) prev[j] = j
  for (let i = 1; i <= la; i++) {
    curr[0] = i
    let rowMin = curr[0]
    const ai = a.charCodeAt(i - 1)
    for (let j = 1; j <= lb; j++) {
      const cost = ai === b.charCodeAt(j - 1) ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
      rowMin = Math.min(rowMin, curr[j])
    }
    if (rowMin > maxEdits) return false
    const tmp = prev; prev = curr; curr = tmp
  }
  return prev[lb] <= maxEdits
}

export function getCorrections(lastToken, max = 3) {
  const t = String(lastToken || "").toLowerCase()
  if (!t || /[^a-z]/i.test(t) === false && t.length <= 2) return []
  const candidates = []
  for (const w of COMMON_WORDS) {
    if (w.length < 2) continue
    if (w === t) continue
    if (editDistanceWithin(t, w, t.length <= 4 ? 1 : 2)) candidates.push(w)
    if (candidates.length >= max) break
  }
  return candidates
}

export function getNextWordSuggestions(prevTokens = [], max = 3) {
  if (!Array.isArray(prevTokens) || prevTokens.length === 0) return []
  const last = String(prevTokens[prevTokens.length - 1] || "").toLowerCase()
  const list = NEXT_MAP[last] || []
  return list.slice(0, max)
}

export function getPromptCompletions(text, max = 4) {
  const t = String(text || "").trim().toLowerCase()
  if (t.length < 3) return PROMPT_TEMPLATES.slice(0, max)
  // Light heuristic: if starts with a question word, propose related templates
  if (/^(how|what|why|who|where|when)\b/.test(t)) {
    return [
      "Explain step by step: ",
      "Give 3 examples: ",
      "Summarize the key points: ",
      "Suggest next steps: ",
    ].slice(0, max)
  }
  return PROMPT_TEMPLATES.slice(0, max)
}

export function autoCorrectLastToken(text) {
  const s = String(text || "")
  const m = s.match(/^(.*?)([A-Za-z]+)$/)
  if (!m) return s
  const prefix = m[1]
  const token = m[2]
  const [best] = getCorrections(token, 1)
  if (!best) return s
  return prefix + best
}
