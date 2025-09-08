#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🔍 Vérification de la configuration SailingLoc...\n');

// Vérification du fichier .env
const envPath = join(__dirname, '.env');
let envExists = existsSync(envPath);
let envComplete = false;

if (envExists) {
  console.log('✅ Fichier .env trouvé');
  
  try {
    const envContent = readFileSync(envPath, 'utf8');
    const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'BREVO_API_KEY', 'CONTACT_TO_EMAIL'];
    const missingVars = [];
    
    requiredVars.forEach(varName => {
      if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=votre_`)) {
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length === 0) {
      console.log('✅ Toutes les variables d\'environnement sont configurées');
      envComplete = true;
    } else {
      console.log('⚠️  Variables d\'environnement manquantes ou non configurées:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
    }
  } catch (error) {
    console.log('❌ Erreur lors de la lecture du fichier .env');
  }
} else {
  console.log('❌ Fichier .env non trouvé');
  console.log('   Copiez .env.example vers .env et configurez vos variables');
}

// Vérification des node_modules
const nodeModulesPath = join(__dirname, 'node_modules');
if (existsSync(nodeModulesPath)) {
  console.log('✅ Dépendances installées');
} else {
  console.log('❌ Dépendances non installées');
  console.log('   Exécutez: npm install');
}

// Vérification de la configuration Vite
const viteConfigPath = join(__dirname, 'vite.config.js');
if (existsSync(viteConfigPath)) {
  console.log('✅ Configuration Vite présente');
} else {
  console.log('❌ Configuration Vite manquante');
}

// Vérification du serveur
const serverPath = join(__dirname, 'server', 'server.cjs');
if (existsSync(serverPath)) {
  console.log('✅ Serveur backend configuré');
} else {
  console.log('❌ Fichier serveur manquant');
}

console.log('\n📋 Résumé:');

if (envExists && envComplete && existsSync(nodeModulesPath)) {
  console.log('🎉 Configuration complète ! Vous pouvez lancer:');
  console.log('   npm run dev:full    # Frontend + Backend en parallèle');
  console.log('   ou séparément:');
  console.log('   npm run server      # Backend seul (port 3000)');
  console.log('   npm run dev         # Frontend seul (port 5173)');
} else {
  console.log('⚠️  Configuration incomplète. Consultez DEMARRAGE_LOCAL.md');
}

console.log('\n🌐 URLs une fois lancé:');
console.log('   Frontend: http://localhost:5173');
console.log('   Backend:  http://localhost:3000/api');
console.log('   Test API: http://localhost:3000/api/health');