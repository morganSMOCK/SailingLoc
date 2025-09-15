# Configuration des Variables d'Environnement

## Variables requises

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Base de données MongoDB
MONGO_URI=mongodb://localhost:27017/sailingloc

# URL de base de l'API
BASE_URL=https://sailingloc.onrender.com

# JWT Secret pour l'authentification
JWT_SECRET=your-jwt-secret-key-here

# Clé secrète Stripe (NE JAMAIS COMMITER)
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key-here

# Port du serveur
PORT=3000
```

## Configuration sur Render

1. Allez dans votre dashboard Render
2. Sélectionnez votre service
3. Allez dans "Environment"
4. Ajoutez la variable `STRIPE_SECRET_KEY` avec votre clé secrète Stripe

## Sécurité

⚠️ **IMPORTANT** : Ne jamais commiter de clés secrètes dans le code !
- Utilisez toujours des variables d'environnement
- Ajoutez `.env` à votre `.gitignore`
- Utilisez des clés de test en développement
