const express = require('express');
const pool = require('../db');
const router = express.Router();

const adminOnly = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin')
    return res.status(403).json({ error: 'Доступ только для администратора' });
  next();
};

// Все заявки
router.get('/applications', adminOnly, async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT a.id, u.full_name, u.login, u.phone, u.email,
            r.name AS room_name, r.type AS room_type,
            a.start_date, a.payment_method, a.status, a.created_at
     FROM applications a
     JOIN users u ON u.id = a.user_id
     JOIN rooms r ON r.id = a.room_id
     ORDER BY a.created_at DESC`
  );
  res.json(rows);
});

// Смена статуса
router.put('/applications/:id/status', adminOnly, async (req, res) => {
  const { status } = req.body;
  const allowed = ['Новая', 'Мероприятие назначено', 'Завершено'];
  if (!allowed.includes(status))
    return res.status(400).json({ error: 'Недопустимый статус' });

  await pool.query('UPDATE applications SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
