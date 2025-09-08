# 🚀 Guide de démarrage local pour SailingLoc

## Prérequis
- Node.js (version 16 ou plus récente)
- MongoDB Atlas (base de données cloud) ou MongoDB local
- Compte Brevo (pour l'envoi d'emails)

## Étapes de configuration

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration des variables d'environnement
Créez un fichier `.env` à la racine du projet en copiant `.env.example` :

```bash
cp .env.example .env
```

Puis modifiez le fichier `.env` avec vos vraies valeurs :

```env
# Configuration MongoDB
MONGODB_URI=mongodb+srv://votre_username:votre_password@votre_cluster.mongodb.net/sailingloc

# Configuration JWT pour l'authentification
JWT_SECRET=un_secret_tres_securise_de_32_caracteres_minimum

# Configuration Brevo (pour l'envoi d'emails)
BREVO_API_KEY=votre_cle_api_brevo
CONTACT_TO_EMAIL=votre@email.com
CONTACT_FROM_EMAIL=noreply@votre_domaine.com

# Configuration serveur (optionnel)
PORT=3000
```

### 3. Configuration MongoDB
- Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/atlas)
- Créez un nouveau cluster
- Configurez les accès réseau (autorisez votre IP)
- Récupérez votre URI de connexion

### 4. Configuration Brevo
- Créez un compte sur [Brevo](https://www.brevo.com)
- Générez une clé API dans les paramètres
- Ajoutez la clé dans votre fichier `.env`

## Démarrage du projet

### Méthode 1 : Avec deux terminaux séparés

**Terminal 1 - Backend :**
```bash
npm run server
```

**Terminal 2 - Frontend :**
```bash
npm run dev
```

### Méthode 2 : Avec un seul terminal (recommandé pour le développement)

Ajoutez cette dépendance pour exécuter les deux en parallèle :
```bash
npm install --save-dev concurrently
```

Puis modifiez le script dans `package.json` :
```json
"scripts": {
  "dev:full": "concurrently \"npm run server\" \"npm run dev\"",
  // ... autres scripts existants
}
```

Et lancez tout avec :
```bash
npm run dev:full
```

## Accès à l'application

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000/api
- **Test API** : http://localhost:3000/api/health

## Données de test

Le projet inclut des données de démonstration. Utilisez ces identifiants pour tester :

**Compte propriétaire :**
- Email: `owner@sailingloc.com`
- Mot de passe: `password123`

## Troubleshooting

### Erreur de connexion MongoDB
- Vérifiez que votre URI MongoDB est correcte
- Vérifiez que votre IP est autorisée dans MongoDB Atlas
- Vérifiez que le nom d'utilisateur/mot de passe sont corrects

### Erreur JWT
- Vérifiez que `JWT_SECRET` est défini et fait au moins 32 caractères

### Erreur CORS
- Le frontend (port 5173) et le backend (port 3000) sont configurés pour fonctionner ensemble
- Si vous changez les ports, mettez à jour la configuration CORS dans `server/server.cjs`

### Erreur d'envoi d'email
- Vérifiez votre clé API Brevo
- Vérifiez que l'email d'expéditeur est configuré dans Brevo