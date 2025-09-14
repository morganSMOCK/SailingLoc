export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, phone, subject, message, newsletter } = req.body;

  const body = {
    sender: { name, email },
    to: [{ email: "sailingloc98@gmail.com", name: "SailingLoc" }],
    subject: "Contact SailingLoc : " + subject,
    htmlContent: `
      <p><strong>Nom :</strong> ${name}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p><strong>Téléphone :</strong> ${phone}</p>
      <p><strong>Sujet :</strong> ${subject}</p>
      <p><strong>Message :</strong><br>${message}</p>
      <p><strong>Newsletter :</strong> ${newsletter}</p>
    `
  };

  const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify(body)
  });

  if (resp.ok) {
    res.status(200).json({ ok: true });
  } else {
    res.status(500).json({ error: 'Erreur Brevo' });
  }
}