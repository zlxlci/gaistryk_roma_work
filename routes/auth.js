const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const router = express.Router();

// Валидаторы
const loginRe = /^[A-Za-z0-9]{6,}$/;
const fioRe = /^[А-Яа-яЁё\s]+$/;
const phoneRe = /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Регистрация
router.post('/register', async (req, res) => {
  const { login, password, full_name, phone, email } = req.body;
  if (!login || !password || !full_name || !phone || !email)
    return res.status(400).json({ error: 'Все поля обязательны' });
  if (!loginRe.test(login))
    return res.status(400).json({ error: 'Логин: латиница и цифры, минимум 6 символов' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Пароль: минимум 8 символов' });
  if (!fioRe.test(full_name))
    return res.status(400).json({ error: 'ФИО: только кириллица и пробелы' });
  if (!phoneRe.test(phone))
    return res.status(400).json({ error: 'Телефон: формат 8(XXX)XXX-XX-XX' });
  if (!emailRe.test(email))
    return res.status(400).json({ error: 'Некорректный email' });

  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (login, password_hash, full_name, phone, email)
       VALUES (?, ?, ?, ?, ?)`,
      [login, hash, full_name, phone, email]
    );
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ error: 'Логин уже занят' });
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Авторизация
router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password)
    return res.status(400).json({ error: 'Введите логин и пароль' });

  const [rows] = await pool.query('SELECT * FROM users WHERE login = ?', [login]);
  if (!rows.length)
    return res.status(400).json({ error: 'Пользователь не найден' });

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(400).json({ error: 'Неверный пароль' });

  req.session.user = {
    id: user.id, login: user.login,
    full_name: user.full_name, role: user.role
  };
  res.json({ ok: true, role: user.role });
});

// Текущий пользователь
router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Не авторизован' });
  res.json(req.session.user);
});

// Выход
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

module.exports = router;
