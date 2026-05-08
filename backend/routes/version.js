const express = require('express')
const router  = express.Router()
const fs      = require('fs')
const path    = require('path')

const FILE = path.join(__dirname, '..', 'version.json')

const read = () => {
  if (!fs.existsSync(FILE)) {
    const init = { version: '1.0.0', history: [{ version: '1.0.0', type: 'major', note: 'Version initiale', date: new Date().toISOString() }] }
    fs.writeFileSync(FILE, JSON.stringify(init, null, 2))
    return init
  }
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
  } catch {
    const init = { version: '1.0.0', history: [{ version: '1.0.0', type: 'major', note: 'Version initiale', date: new Date().toISOString() }] }
    fs.writeFileSync(FILE, JSON.stringify(init, null, 2))
    return init
  }
}

const bump = (v, type) => {
  const [major, minor, patch] = v.split('.').map(Number)
  if (type === 'major') return `${major + 1}.0.0`
  if (type === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

router.get('/', (req, res) => {
  try { res.json(read()) } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/bump', (req, res) => {
  try {
    const { type, note, manual } = req.body
    const data = read()
    let next

    if (manual) {
      if (!/^\d+\.\d+\.\d+$/.test(manual.trim())) return res.status(400).json({ error: 'Format invalide — utiliser x.y.z (ex: 1.4.2)' })
      next = manual.trim()
    } else {
      if (!['patch', 'minor', 'major'].includes(type)) return res.status(400).json({ error: 'type invalide' })
      next = bump(data.version, type)
    }

    const entryType = manual ? 'manuel' : type
    data.history.unshift({ version: next, type: entryType, note: (note || '').trim(), date: new Date().toISOString() })
    data.version = next
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
    res.json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
