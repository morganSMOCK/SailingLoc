const mongoose = require('mongoose');
const Boat = require('./models/Boat.cjs');
const User = require('./models/User.cjs');
require('dotenv').config();

// ...

async function seedDatabase() {
  try {
    // ✅ Connexion à MongoDB (via .env uniquement)
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connexion à MongoDB réussie');

    // Créer un utilisateur propriétaire par défaut
    let defaultOwner = await User.findOne({ email: 'owner@sailingloc.com' });
    
    if (!defaultOwner) {
      defaultOwner = new User({
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'owner@sailingloc.com',
        password: 'password123', // ⚠️ à hasher en vrai
        role: 'owner',
        phone: '+33 6 12 34 56 78',
        isActive: true,
        isEmailVerified: true
      });
      
      await defaultOwner.save();
      console.log('✅ Utilisateur propriétaire créé');
    }

    // Vérifier s'il y a déjà des bateaux
    const existingBoats = await Boat.countDocuments();
    
    if (existingBoats === 0) {
      const boatsWithOwner = sampleBoats.map(boat => ({
        ...boat,
        owner: defaultOwner._id
      }));

      await Boat.insertMany(boatsWithOwner);
      console.log(`✅ ${sampleBoats.length} bateaux ajoutés à la base de données`);
    } else {
      console.log(`ℹ️ ${existingBoats} bateaux déjà présents dans la base de données`);
    }

    // Résumé
    const totalBoats = await Boat.countDocuments();
    const availableBoats = await Boat.countDocuments({ status: 'available', isActive: true });
    
    console.log('\n📊 Résumé de la base de données:');
    console.log(`   Total bateaux: ${totalBoats}`);
    console.log(`   Bateaux disponibles: ${availableBoats}`);
    
    const boatsByType = await Boat.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    console.log('\n🛥️ Bateaux par type:');
    boatsByType.forEach(type => {
      console.log(`   ${type._id}: ${type.count}`);
    });

    console.log('\n🎉 Base de données initialisée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Connexion fermée');
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleBoats };
