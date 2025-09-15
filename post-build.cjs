const fs = require('fs');
const path = require('path');

/**
 * Script post-build pour corriger les références aux ressources dans les fichiers HTML
 */

function updateResourceReferences() {
  console.log('🔄 Correction des références aux ressources...');
  
  // Trouver les fichiers dans dist/assets/
  const assetsDir = path.join(__dirname, 'dist', 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.error('❌ Dossier dist/assets/ non trouvé');
    return;
  }
  
  const files = fs.readdirSync(assetsDir);
  const mainFile = files.find(file => file.startsWith('main-') && file.endsWith('.js'));
  const styleFile = files.find(file => file.startsWith('style-') && file.endsWith('.css'));
  const logoFile = files.find(file => file.includes('sailingloc_logo_mark_no_text_512') && file.endsWith('.png'));
  
  if (!mainFile) {
    console.error('❌ Fichier main-*.js non trouvé dans dist/assets/');
    return;
  }
  
  console.log(`📦 Fichiers trouvés:`);
  console.log(`   - Main JS: ${mainFile}`);
  console.log(`   - Style CSS: ${styleFile || 'non trouvé'}`);
  console.log(`   - Logo PNG: ${logoFile || 'non trouvé'}`);
  
  // Copier le fichier main avec un nom simple
  const sourceFile = path.join(assetsDir, mainFile);
  const targetFile = path.join(assetsDir, 'main.js');
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`📋 Fichier main copié vers: main.js`);
  
  // Liste des fichiers HTML à mettre à jour
  const htmlFiles = [
    'index.html',
    'boats.html', 
    'services.html',
    'contact.html',
    'experience.html',
    'boat.html',
    'boat-management.html',
    'booking.html',
    'booking-confirmation.html',
    'payment-summary.html',
    'reserve.html',
    'conditions.html',
    'confidentialite.html',
    'mentions.html',
    'sailingclub.html',
    'debug-boats.html',
    'test-simple-boat.html',
    'test-api-direct.html',
    'test-boat-card.html',
    'test-delete-boat.html'
  ];
  
  htmlFiles.forEach(fileName => {
    const filePath = path.join(__dirname, 'dist', fileName);
    
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;
      
      // Remplacer les références aux scripts
      const oldScriptPatterns = [
        /<script type="module" src="\/src\/main\.js"><\/script>/g,
        /<script type="module" src="\/src\/init\.js"><\/script>/g,
        /<script type="module" src="\/src\/boat\.js"><\/script>/g,
        /<script type="module" src="\/src\/booking\.js"><\/script>/g,
        /<script type="module" src="\/src\/booking-confirmation\.js"><\/script>/g,
        /<script type="module" src="\/src\/payment-summary\.js"><\/script>/g,
        /<script type="module" src="\/src\/reserve\.js"><\/script>/g,
        /<script type="module" crossorigin src="\/assets\/main-[^"]+\.js"><\/script>/g
      ];
      
      const newScripts = [
        `<script type="module" src="/assets/main.js"></script>`,
        `<script type="module" src="/assets/main.js"></script>`,
        `<script type="module" src="/assets/main.js"></script>`,
        `<script type="module" src="/assets/main.js"></script>`,
        `<script type="module" src="/assets/main.js"></script>`,
        `<script type="module" src="/assets/main.js"></script>`,
        `<script type="module" src="/assets/main.js"></script>`,
        `<script type="module" src="/assets/main.js"></script>`
      ];
      
      oldScriptPatterns.forEach((pattern, index) => {
        if (pattern.test(content)) {
          content = content.replace(pattern, newScripts[index]);
          updated = true;
        }
      });
      
      // Remplacer les références aux styles
      if (styleFile) {
        const oldStylePattern = /<link rel="stylesheet" href="\/src\/style\.css">/g;
        if (oldStylePattern.test(content)) {
          content = content.replace(oldStylePattern, `<link rel="stylesheet" href="/assets/${styleFile}">`);
          updated = true;
        }
      }
      
      // Remplacer les références aux images
      if (logoFile) {
        const oldImagePatterns = [
          /src="dist\/assets\/sailingloc_logo_mark_no_text_512\.png"/g,
          /src="\/assets\/sailingloc_logo_mark_no_text_512-CzIWSV09\.png"/g
        ];
        
        oldImagePatterns.forEach(pattern => {
          if (pattern.test(content)) {
            content = content.replace(pattern, `src="/assets/${logoFile}"`);
            updated = true;
          }
        });
      }
      
      if (updated) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ ${fileName} mis à jour`);
      } else {
        console.log(`⚠️ ${fileName} - aucune référence à corriger`);
      }
    } else {
      console.log(`❌ ${fileName} non trouvé`);
    }
  });
  
  console.log('🎉 Correction des références terminée !');
}

// Exécuter le script
updateResourceReferences();
