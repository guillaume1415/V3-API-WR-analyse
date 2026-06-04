export function boatClassSortKey(name) {
  const s = String(name || '').trim()
  let cat = 3
  let gender = 2
  if (/^PR\d?\s*M/i.test(s)) {
    cat = 2
    gender = 0
  } else if (/^PR\d?\s*W/i.test(s)) {
    cat = 2
    gender = 1
  } else if (/^PR/i.test(s)) {
    cat = 2
    gender = 2
  } else if (/^LM/i.test(s)) {
    cat = 1
    gender = 0
  } else if (/^LW/i.test(s)) {
    cat = 1
    gender = 1
  } else if (/^M(?!ix)/i.test(s)) {
    cat = 0
    gender = 0
  } else if (/^W/i.test(s)) {
    cat = 0
    gender = 1
  } else if (/^Mix/i.test(s)) {
    cat = 0
    gender = 2
  }
  return [cat, gender, s]
}

export function sortClasses(arr) {
  return [...arr].sort((a, b) => {
    const ka = boatClassSortKey(a)
    const kb = boatClassSortKey(b)
    return ka[0] - kb[0] || ka[1] - kb[1] || ka[2].localeCompare(kb[2])
  })
}
