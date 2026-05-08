// routes/auth.js
const express   = require('express')
const bcrypt    = require('bcryptjs')
const jwt       = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const router    = express.Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives — réessayez dans 15 minutes' },
})

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'Identifiants requis' })
    }
    if (username !== process.env.AUTH_USER) {
      return res.status(401).json({ error: 'Identifiants incorrects' })
    }
    const valid = await bcrypt.compare(password, process.env.AUTH_PASS_HASH)
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants incorrects' })
    }
    const token = jwt.sign(
      { username: process.env.AUTH_USER },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, username: process.env.AUTH_USER })
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/verify', require('../middleware/auth'), (req, res) => {
  res.json({ ok: true, username: req.user.username })
})

module.exports = router
