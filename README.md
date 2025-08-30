# SailingLoc
Dernière version

## Configuration email (Brevo)

Définir ces variables d'environnement (par ex. dans `.env` ou sur l'hébergeur):

- `BREVO_API_KEY`: clé API Brevo
- `CONTACT_TO_EMAIL`: adresse de destination (réception des messages)
- `CONTACT_FROM_EMAIL` (optionnel): adresse d'expéditeur (par défaut même que `CONTACT_TO_EMAIL`)

L'endpoint disponible est `POST /api/contact` avec le JSON:

```json
{ "name": "Votre nom", "email": "vous@example.com", "message": "Contenu" }
```