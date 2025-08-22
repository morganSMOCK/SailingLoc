import React, { useState } from 'react';
import { BoatService } from '../services/BoatService.js'; // Import du BoatService

const AddBoatForm = () => {
  const [boatData, setBoatData] = useState({
    name: '',
    description: '',
    type: '',
    category: '', // Ajout de la catégorie
    length: '',
    width: '',
    year: '',
    capacity: '',
    pricePerDay: '',
    images: [],
    amenities: [],
    location: {
      address: '',
      city: '',
      postalCode: '',
      country: '',
    },
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setBoatData((prevData) => ({
        ...prevData,
        [parent]: {
          ...prevData[parent],
          [child]: value,
        },
      }));
    } else {
      setBoatData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e) => {
    setBoatData((prevData) => ({
      ...prevData,
      images: [...prevData.images, ...Array.from(e.target.files)],
    }));
  };

  const handleAmenityChange = (e) => {
    const { value, checked } = e.target;
    setBoatData((prevData) => ({
      ...prevData,
      amenities: checked
        ? [...prevData.amenities, value]
        : prevData.amenities.filter((amenity) => amenity !== value),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!boatData.name) newErrors.name = 'Le nom du bateau est obligatoire';
    if (!boatData.description) newErrors.description = 'La description est obligatoire';
    if (!boatData.type) newErrors.type = 'Le type de bateau est obligatoire';
    if (!boatData.length) newErrors.length = 'La longueur est obligatoire';
    if (!boatData.width) newErrors.width = 'La largeur est obligatoire';
    if (!boatData.year) newErrors.year = 'L\'année de fabrication est obligatoire';
    if (!boatData.capacity) newErrors.capacity = 'La capacité est obligatoire';
    if (!boatData.pricePerDay) newErrors.pricePerDay = 'Le prix par jour est obligatoire';
    if (!boatData.location.city) newErrors['location.city'] = 'La ville est obligatoire';
    if (!boatData.location.country) newErrors['location.country'] = 'Le pays est obligatoire';
    if (!boatData.category) newErrors.category = 'La catégorie est obligatoire'; // Validation pour la catégorie

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    if (!validateForm()) {
      setMessage('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }

    const formData = new FormData();
    for (const key in boatData) {
      if (key === 'images') {
        boatData.images.forEach((image) => {
          formData.append('images', image);
        });
      } else if (key === 'location') {
        for (const locKey in boatData.location) {
          formData.append(`location.${locKey}`, boatData.location[locKey]);
        }
      } else if (key === 'amenities') {
        boatData.amenities.forEach((amenity) => {
          formData.append('amenities', amenity);
        });
      } else {
        formData.append(key, boatData[key]);
      }
    }

    try {
      const boatService = new BoatService(); // Instanciation du service
      const response = await boatService.createBoat(formData);

      if (response.success) {
        setMessage('Bateau ajouté avec succès!');
        setBoatData({
          name: '',
          description: '',
          type: '',
          length: '',
          width: '',
          year: '',
          capacity: '',
          pricePerDay: '',
          images: [],
          amenities: [],
          location: {
            address: '',
            city: '',
            postalCode: '',
            country: '',
          },
        });
      } else {
        setMessage(response.message || 'Erreur lors de l\'ajout du bateau.');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du bateau:', error);
      setMessage('Erreur réseau ou du serveur.');
    }
  };

  return (
    <div className="container">
      <h2>Ajouter un nouveau bateau</h2>
      {message && <p className={message.includes('succès') ? 'success' : 'error'}>{message}</p>}
      <form onSubmit={handleSubmit} className="add-boat-form">
        <div className="form-group">
          <label htmlFor="name">Nom du bateau:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={boatData.name}
            onChange={handleChange}
            className={errors.name ? 'input-error' : ''}
          />
          {errors.name && <p className="error-message">{errors.name}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={boatData.description}
            onChange={handleChange}
            className={errors.description ? 'input-error' : ''}
          ></textarea>
          {errors.description && <p className="error-message">{errors.description}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="type">Type de bateau:</label>
          <input
            type="text"
            id="type"
            name="type"
            value={boatData.type}
            onChange={handleChange}
            className={errors.type ? 'input-error' : ''}
          />
          {errors.type && <p className="error-message">{errors.type}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="category">Catégorie:</label>
          <select
            id="category"
            name="category"
            value={boatData.category}
            onChange={handleChange}
            className={errors.category ? 'input-error' : ''}
          >
            <option value="">Sélectionner une catégorie</option>
            {new BoatService().getBoatCategories().map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          {errors.category && <p className="error-message">{errors.category}</p>}
        </div>

        <div className="form-group-inline">
          <div className="form-group">
            <label htmlFor="length">Longueur (m):</label>
            <input
              type="number"
              id="length"
              name="length"
              value={boatData.length}
              onChange={handleChange}
              className={errors.length ? 'input-error' : ''}
            />
            {errors.length && <p className="error-message">{errors.length}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="width">Largeur (m):</label>
            <input
              type="number"
              id="width"
              name="width"
              value={boatData.width}
              onChange={handleChange}
              className={errors.width ? 'input-error' : ''}
            />
            {errors.width && <p className="error-message">{errors.width}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="year">Année de fabrication:</label>
            <input
              type="number"
              id="year"
              name="year"
              value={boatData.year}
              onChange={handleChange}
              className={errors.year ? 'input-error' : ''}
            />
            {errors.year && <p className="error-message">{errors.year}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="capacity">Capacité (personnes):</label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={boatData.capacity}
              onChange={handleChange}
              className={errors.capacity ? 'input-error' : ''}
            />
            {errors.capacity && <p className="error-message">{errors.capacity}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="pricePerDay">Prix par jour (€):</label>
            <input
              type="number"
              id="pricePerDay"
              name="pricePerDay"
              value={boatData.pricePerDay}
              onChange={handleChange}
              className={errors.pricePerDay ? 'input-error' : ''}
            />
            {errors.pricePerDay && <p className="error-message">{errors.pricePerDay}</p>}
          </div>
        </div>

        <h3>Localisation</h3>
        <div className="form-group">
          <label htmlFor="location.address">Adresse:</label>
          <input
            type="text"
            id="location.address"
            name="location.address"
            value={boatData.location.address}
            onChange={handleChange}
          />
        </div>
        <div className="form-group-inline">
          <div className="form-group">
            <label htmlFor="location.city">Ville:</label>
            <input
              type="text"
              id="location.city"
              name="location.city"
              value={boatData.location.city}
              onChange={handleChange}
              className={errors['location.city'] ? 'input-error' : ''}
            />
            {errors['location.city'] && <p className="error-message">{errors['location.city']}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="location.postalCode">Code Postal:</label>
            <input
              type="text"
              id="location.postalCode"
              name="location.postalCode"
              value={boatData.location.postalCode}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="location.country">Pays:</label>
            <input
              type="text"
              id="location.country"
              name="location.country"
              value={boatData.location.country}
              onChange={handleChange}
              className={errors['location.country'] ? 'input-error' : ''}
            />
            {errors['location.country'] && <p className="error-message">{errors['location.country']}</p>}
          </div>
        </div>

        <h3>Équipements (sélectionnez tout ce qui s'applique)</h3>
        <div className="form-group-checkboxes">
          <label>
            <input
              type="checkbox"
              name="amenities"
              value="GPS"
              checked={boatData.amenities.includes('GPS')}
              onChange={handleAmenityChange}
            /> GPS
          </label>
          <label>
            <input
              type="checkbox"
              name="amenities"
              value="Sondeur"
              checked={boatData.amenities.includes('Sondeur')}
              onChange={handleAmenityChange}
            /> Sondeur
          </label>
          <label>
            <input
              type="checkbox"
              name="amenities"
              value="VHF"
              checked={boatData.amenities.includes('VHF')}
              onChange={handleAmenityChange}
            /> VHF
          </label>
          <label>
            <input
              type="checkbox"
              name="amenities"
              value="Cuisine"
              checked={boatData.amenities.includes('Cuisine')}
              onChange={handleAmenityChange}
            /> Cuisine
          </label>
          <label>
            <input
              type="checkbox"
              name="amenities"
              value="Salle de bain"
              checked={boatData.amenities.includes('Salle de bain')}
              onChange={handleAmenityChange}
            /> Salle de bain
          </label>
          <label>
            <input
              type="checkbox"
              name="amenities"
              value="Cabines"
              checked={boatData.amenities.includes('Cabines')}
              onChange={handleAmenityChange}
            /> Cabines
          </label>
          <label>
            <input
              type="checkbox"
              name="amenities"
              value="Climatisation"
              checked={boatData.amenities.includes('Climatisation')}
              onChange={handleAmenityChange}
            /> Climatisation
          </label>
          <label>
            <input
              type="checkbox"
              name="amenities"
              value="Chauffage"
              checked={boatData.amenities.includes('Chauffage')}
              onChange={handleAmenityChange}
            /> Chauffage
          </label>
          <label>
            <input
              type="checkbox"
              name="amenities"
              value="Musique"
              checked={boatData.amenities.includes('Musique')}
              onChange={handleAmenityChange}
            /> Système Audio
          </label>
          <label>
            <input
              type="checkbox"
              name="amenities"
              value="Wi-Fi"
              checked={boatData.amenities.includes('Wi-Fi')}
              onChange={handleAmenityChange}
            /> Wi-Fi
          </label>
          <label>
            <input
              type="checkbox"
              name="amenities"
              value="Équipement de sécurité"
              checked={boatData.amenities.includes('Équipement de sécurité')}
              onChange={handleAmenityChange}
            /> Équipement de sécurité
          </label>
          <label>
            <input
              type="checkbox"
              name="amenities"
              value="Table de cockpit"
              checked={boatData.amenities.includes('Table de cockpit')}
              onChange={handleAmenityChange}
            /> Table de cockpit
          </label>
          <label>
            <input
              type="checkbox"
              name="amenities"
              value="Douche de pont"
              checked={boatData.amenities.includes('Douche de pont')}
              onChange={handleAmenityChange}
            /> Douche de pont
          </label>
          <label>
            <input
              type="checkbox"
              name="amenities"
              value="Annexe"
              checked={boatData.amenities.includes('Annexe')}
              onChange={handleAmenityChange}
            /> Annexe
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="images">Images du bateau:</label>
          <input
            type="file"
            id="images"
            name="images"
            multiple
            accept="image/*"
            onChange={handleImageChange}
          />
          {boatData.images.length > 0 && (
            <div className="image-preview">
              {boatData.images.map((image, index) => (
                <span key={index} className="image-tag">{image.name}</span>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="submit-button">Ajouter le bateau</button>
      </form>
    </div>
  );
};

export default AddBoatForm;
