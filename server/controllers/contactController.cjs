const fetch = require('node-fetch');

// Validation d'email simple
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Envoi d'un email via l'API Brevo (Sendinblue)
// Requiert: process.env.BREVO_API_KEY et process.env.CONTACT_TO_EMAIL
exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Champs manquants (name, email, message)'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Limites de longueur pour éviter les abus
    if (name.length > 100 || email.length > 255 || message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Un ou plusieurs champs dépassent la longueur maximale autorisée'
      });
    }

    const apiKey = process.env.BREVO_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL;
    const fromEmail = process.env.CONTACT_FROM_EMAIL || toEmail;

    if (!apiKey || !toEmail) {
      return res.status(500).json({
        success: false,
        message: 'Configuration email manquante (BREVO_API_KEY, CONTACT_TO_EMAIL)'
      });
    }

    const payload = {
      sender: { email: fromEmail, name: 'SailingLoc' },
      to: [{ email: toEmail }],
      replyTo: { email, name },
      subject: `Nouveau message de contact - ${name}`,
      htmlContent: `
        <p><strong>Nom:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      `
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('❌ [BREVO] Erreur:', data);
      return res.status(502).json({ success: false, message: 'Échec d\'envoi via Brevo', details: data });
    }

    res.status(200).json({ success: true, message: 'Message envoyé', data });
  } catch (error) {
    console.error('❌ Erreur envoi contact:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur envoi contact' });
  }
};



