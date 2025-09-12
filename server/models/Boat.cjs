const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Boat = require("../models/Boat.cjs");
const { isAuthenticated } = require("../middleware/auth.cjs"); // si tu as un middleware auth

// ✅ Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // assure-toi que le dossier existe sur Render
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) cb(null, true);
    else cb(new Error("Seuls JPG, PNG, WebP sont autorisés"));
  }
});

// POST /api/boats
router.post(
  "/boats",
  isAuthenticated,
  upload.array("images", 10), // "images" = nom du champ FormData
  async (req, res) => {
    try {
      console.log("BODY:", req.body);
      console.log("FILES:", req.files);

      // Créer le bateau avec conversion des champs numériques
      const boat = new Boat({
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        category: req.body.category,
        specifications: {
          length: Number(req.body["specifications[length]"]),
          width: Number(req.body["specifications[width]"])
        },
        capacity: {
          maxPeople: Number(req.body["capacity[maxPeople]"])
        },
        location: {
          city: req.body["location[city]"],
          marina: req.body["location[marina]"],
          country: "France"
        },
        pricing: {
          dailyRate: Number(req.body["pricing[dailyRate]"]),
          securityDeposit: Number(req.body["pricing[securityDeposit]"])
        },
        owner: req.user._id,
        status: "available",
        isActive: true,
        images: req.files.map(f => ({ url: f.path, isMain: false }))
      });

      await boat.save();

      res.json({
        success: true,
        message: "Bateau ajouté avec succès",
        boat
      });
    } catch (err) {
      console.error("Erreur lors de la création du bateau :", err);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création du bateau",
        error: err.message
      });
    }
  }
);

module.exports = router;
