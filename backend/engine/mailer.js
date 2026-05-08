// engine/mailer.js
const nodemailer = require('nodemailer');

const sendRunSummary = async ({ nouvelles, reouvertures, demenagements, fermetures = 0, duration }) => {
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;
  const EMAIL_TO   = process.env.EMAIL_TO || EMAIL_USER;

  if (!EMAIL_USER || !EMAIL_PASS) return;

  const total = nouvelles.length + reouvertures.length + demenagements.length + fermetures;
  if (total === 0) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  const topLeads = [...nouvelles, ...reouvertures, ...demenagements]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const rows = topLeads.map(l => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #2e3347">${l.nom || '—'}</td>
      <td style="padding:8px;border-bottom:1px solid #2e3347">${l.ville}</td>
      <td style="padding:8px;border-bottom:1px solid #2e3347">${l.secteurMatch}</td>
      <td style="padding:8px;border-bottom:1px solid #2e3347">${l.score}/6</td>
      <td style="padding:8px;border-bottom:1px solid #2e3347">${l.signal}</td>
      <td style="padding:8px;border-bottom:1px solid #2e3347">
        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.adresse + ' ' + l.ville + ' Québec')}" style="color:#6c63ff">Maps</a>
      </td>
    </tr>
  `).join('');

  const html = `
  <div style="font-family:sans-serif;background:#0f1117;color:#e8eaf0;padding:24px;border-radius:12px;max-width:700px">
    <h2 style="color:#6c63ff;margin-bottom:4px">◈ Jinbe — Nouveau rapport</h2>
    <p style="color:#8b90a7;margin-top:0">Durée : ${Math.round(duration/1000)}s</p>

    <div style="display:flex;gap:16px;margin:20px 0">
      <div style="background:#1a1d27;padding:16px 24px;border-radius:10px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#4ade80">${nouvelles.length}</div>
        <div style="font-size:12px;color:#8b90a7">Nouvelles</div>
      </div>
      <div style="background:#1a1d27;padding:16px 24px;border-radius:10px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#2dd4bf">${reouvertures.length}</div>
        <div style="font-size:12px;color:#8b90a7">Réouvertures</div>
      </div>
      <div style="background:#1a1d27;padding:16px 24px;border-radius:10px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#fb923c">${demenagements.length}</div>
        <div style="font-size:12px;color:#8b90a7">Déménagements</div>
      </div>
      <div style="background:#1a1d27;padding:16px 24px;border-radius:10px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#f87171">${fermetures}</div>
        <div style="font-size:12px;color:#8b90a7">Fermetures</div>
      </div>
    </div>

    <h3 style="color:#e8eaf0;margin-bottom:12px">Top 10 leads</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="color:#8b90a7">
          <th style="padding:8px;text-align:left">Nom</th>
          <th style="padding:8px;text-align:left">Ville</th>
          <th style="padding:8px;text-align:left">Secteur</th>
          <th style="padding:8px;text-align:left">Score</th>
          <th style="padding:8px;text-align:left">Signal</th>
          <th style="padding:8px;text-align:left">Maps</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;

  await transporter.sendMail({
    from:    `"Jinbe" <${EMAIL_USER}>`,
    to:      EMAIL_TO,
    subject: `Jinbe — ${total} leads trouvés`,
    html,
  });
};

module.exports = { sendRunSummary };
