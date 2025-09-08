# 🚀 Setup SailingLoc - Guide de Configuration

## ✅ État Actuel
- ✅ Dépendances npm installées
- ✅ Frontend fonctionnel (Vite sur port 5173)
- ✅ Configuration de base créée
- ✅ Fichier .env configuré

## 🎯 Pour Démarrer le Projet

### 1. Frontend (Interface utilisateur)
```bash
npm run dev
```
➡️ Ouverture sur http://localhost:5173

### 2. Backend (API - optionnel)
```bash
npm run server
```
➡️ API sur http://localhost:3000/api

## ⚠️ Configuration Requis pour Production

### Base de données MongoDB
Le fichier `.env` contient une configuration locale. Pour la production :
1. Créer un cluster MongoDB Atlas
2. Remplacer `MONGODB_URI` dans `.env`
3. Configurer les autres variables (Stripe, Brevo, JWT)

### Variables d'environnement importantes
- `MONGODB_URI` : Base de données
- `JWT_SECRET` : Clé secrète pour l'authentification  
- `STRIPE_*` : Clés pour les paiements
- `BREVO_API_KEY` : Service email [[memory:7591580]]

## 🔧 Commandes Utiles
- `npm run dev` : Développement frontend
- `npm run server` : Serveur backend
- `npm run build` : Build production
- `npm audit fix` : Corriger les vulnérabilités

## 🌐 URLs de l'Application
- Frontend : http://localhost:5173
- Backend API : http://localhost:3000/api
- Health Check : http://localhost:3000/api/health