const fs = require('fs');
const path = require('path');

/**
 * Script post-build pour mettre à jour les références JavaScript dans les fichiers de test
 */

function updateTestScripts() {
  console.log('🔄 Mise à jour des scripts de test...');
  
  // Trouver le fichier main-*.js dans dist/assets/
  const assetsDir = path.join(__dirname, 'dist', 'assets');
  const files = fs.readdirSync(assetsDir);
  const mainFile = files.find(file => file.startsWith('main-') && file.endsWith('.js'));
  
  if (!mainFile) {
    console.error('❌ Fichier main-*.js non trouvé dans dist/assets/');
    return;
  }
  
  console.log(`📦 Fichier principal trouvé: ${mainFile}`);
  
  // Copier le fichier avec un nom simple
  const sourceFile = path.join(assetsDir, mainFile);
  const targetFile = path.join(assetsDir, 'main.js');
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`📋 Fichier copié vers: main.js`);
  
  // Liste des fichiers de test à mettre à jour
  const testFiles = [
    'debug-boats.html',
    'test-simple-boat.html',
    'test-api-direct.html',
    'test-boat-card.html'
  ];
  
  testFiles.forEach(fileName => {
    const filePath = path.join(__dirname, 'dist', fileName);
    
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Remplacer toutes les références au script
      const oldScript1 = '<script type="module" src="/src/main.js"></script>';
      const oldScript2 = /<script type="module" crossorigin src="\/assets\/main-[^"]+\.js"><\/script>/;
      const newScript = `<script type="module" src="/assets/main.js"></script>`;
      
      let updated = false;
      
      if (content.includes(oldScript1)) {
        content = content.replace(oldScript1, newScript);
        updated = true;
      }
      
      if (oldScript2.test(content)) {
        content = content.replace(oldScript2, newScript);
        updated = true;
      }
      
      if (updated) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ ${fileName} mis à jour`);
      } else {
        console.log(`⚠️ ${fileName} - référence non trouvée`);
      }
    } else {
      console.log(`❌ ${fileName} non trouvé`);
    }
  });
  
  console.log('🎉 Mise à jour terminée !');
}

// Exécuter le script
updateTestScripts();
