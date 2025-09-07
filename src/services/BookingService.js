/**
 * Service de gestion des réservations
 * Gère toutes les opérations liées aux réservations de bateaux
 */
export class BookingService {
  constructor() {
    // URL de base de l'API (auto-détection env)
    const envBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';
    this.baseURL = envBase || 'https://sailingloc.onrender.com/api';
    this.bookingsEndpoint = `${this.baseURL}/bookings`;
  }

  /**
   * Création d'une nouvelle réservation
   * @param {Object} bookingData - Données de la réservation
   * @returns {Promise<Object>} Réservation créée
   */
  async createBooking(bookingData) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(this.bookingsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création de la réservation');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création de la réservation:', error);
      throw error;
    }
  }

  /**
   * Récupération des réservations de l'utilisateur
   * @param {Object} params - Paramètres de filtrage et pagination
   * @returns {Promise<Object>} Liste des réservations
   */
  async getUserBookings(params = {}) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const url = `${this.bookingsEndpoint}?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération des réservations');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations:', error);
      throw error;
    }
  }

  /**
   * Récupération d'une réservation par ID
   * @param {string} bookingId - ID de la réservation
   * @returns {Promise<Object>} Détails de la réservation
   */
  async getBookingById(bookingId) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(`${this.bookingsEndpoint}/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération de la réservation');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la réservation:', error);
      throw error;
    }
  }

  /**
   * Confirmation d'une réservation (propriétaire)
   * @param {string} bookingId - ID de la réservation
   * @returns {Promise<Object>} Réservation confirmée
   */
  async confirmBooking(bookingId) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(`${this.bookingsEndpoint}/${bookingId}/confirm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la confirmation de la réservation');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la confirmation de la réservation:', error);
      throw error;
    }
  }

  /**
   * Annulation d'une réservation
   * @param {string} bookingId - ID de la réservation
   * @param {string} reason - Raison de l'annulation
   * @returns {Promise<Object>} Réservation annulée avec info de remboursement
   */
  async cancelBooking(bookingId, reason = '') {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(`${this.bookingsEndpoint}/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'annulation de la réservation');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la réservation:', error);
      throw error;
    }
  }

  /**
   * Check-in d'une réservation (propriétaire)
   * @param {string} bookingId - ID de la réservation
   * @param {Object} checkInData - Données du check-in
   * @returns {Promise<Object>} Réservation avec check-in effectué
   */
  async checkIn(bookingId, checkInData) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(`${this.bookingsEndpoint}/${bookingId}/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkInData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du check-in');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors du check-in:', error);
      throw error;
    }
  }

  /**
   * Check-out d'une réservation (propriétaire)
   * @param {string} bookingId - ID de la réservation
   * @param {Object} checkOutData - Données du check-out
   * @returns {Promise<Object>} Réservation avec check-out effectué
   */
  async checkOut(bookingId, checkOutData) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(`${this.bookingsEndpoint}/${bookingId}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkOutData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du check-out');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors du check-out:', error);
      throw error;
    }
  }

  /**
   * Ajout d'un avis sur une réservation
   * @param {string} bookingId - ID de la réservation
   * @param {number} rating - Note (1-5)
   * @param {string} comment - Commentaire
   * @returns {Promise<Object>} Réservation avec avis ajouté
   */
  async addReview(bookingId, rating, comment) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(`${this.bookingsEndpoint}/${bookingId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating, comment })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'ajout de l\'avis');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'avis:', error);
      throw error;
    }
  }

  /**
   * Récupération des statistiques des réservations
   * @returns {Promise<Object>} Statistiques des réservations
   */
  async getBookingStats() {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(`${this.bookingsEndpoint}/stats/overview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération des statistiques');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Validation des données de réservation
   * @param {Object} bookingData - Données de la réservation
   * @returns {Object} Résultat de la validation
   */
  validateBookingData(bookingData) {
    const errors = [];

    // Validation des champs obligatoires
    if (!bookingData.boatId) {
      errors.push('L\'ID du bateau est obligatoire');
    }

    if (!bookingData.startDate) {
      errors.push('La date de début est obligatoire');
    }

    if (!bookingData.endDate) {
      errors.push('La date de fin est obligatoire');
    }

    // Validation des dates
    if (bookingData.startDate && bookingData.endDate) {
      const startDate = new Date(bookingData.startDate);
      const endDate = new Date(bookingData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        errors.push('La date de début ne peut pas être dans le passé');
      }

      if (endDate <= startDate) {
        errors.push('La date de fin doit être postérieure à la date de début');
      }

      // Vérifier que la réservation ne dépasse pas 1 an
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      if (startDate > oneYearFromNow) {
        errors.push('La réservation ne peut pas être faite plus d\'un an à l\'avance');
      }
    }

    // Validation des participants
    if (!bookingData.participants) {
      errors.push('Les informations sur les participants sont obligatoires');
    } else {
      if (!bookingData.participants.adults || bookingData.participants.adults < 1) {
        errors.push('Il doit y avoir au moins 1 adulte');
      }

      if (bookingData.participants.children && bookingData.participants.children < 0) {
        errors.push('Le nombre d\'enfants ne peut pas être négatif');
      }
    }

    // Validation du contact d'urgence
    if (!bookingData.emergencyContact) {
      errors.push('Le contact d\'urgence est obligatoire');
    } else {
      if (!bookingData.emergencyContact.name || bookingData.emergencyContact.name.trim().length === 0) {
        errors.push('Le nom du contact d\'urgence est obligatoire');
      }

      if (!bookingData.emergencyContact.phone || bookingData.emergencyContact.phone.trim().length === 0) {
        errors.push('Le téléphone du contact d\'urgence est obligatoire');
      }

      if (!bookingData.emergencyContact.relationship || bookingData.emergencyContact.relationship.trim().length === 0) {
        errors.push('La relation avec le contact d\'urgence est obligatoire');
      }
    }

    // Validation de l'expérience nautique
    if (!bookingData.renterExperience) {
      errors.push('Les informations sur l\'expérience nautique sont obligatoires');
    } else {
      if (bookingData.renterExperience.hasLicense === undefined) {
        errors.push('L\'information sur le permis nautique est obligatoire');
      }

      if (bookingData.renterExperience.yearsOfExperience !== undefined && bookingData.renterExperience.yearsOfExperience < 0) {
        errors.push('Les années d\'expérience ne peuvent pas être négatives');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calcul des frais d'annulation
   * @param {Object} booking - Données de la réservation
   * @returns {Object} Informations sur les frais d'annulation
   */
  calculateCancellationFees(booking) {
    const now = new Date();
    const startDate = new Date(booking.startDate);
    const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
    
    let feePercentage = 0;
    
    if (daysUntilStart < 1) {
      feePercentage = 100; // Pas de remboursement
    } else if (daysUntilStart < 7) {
      feePercentage = 50; // 50% de frais
    } else if (daysUntilStart < 14) {
      feePercentage = 25; // 25% de frais
    } else if (daysUntilStart < 30) {
      feePercentage = 10; // 10% de frais
    }
    // Sinon, annulation gratuite
    
    const cancellationFee = (booking.pricing.totalAmount * feePercentage) / 100;
    const refundAmount = booking.pricing.totalAmount - cancellationFee;
    
    return {
      daysUntilStart,
      feePercentage,
      cancellationFee,
      refundAmount,
      canCancel: daysUntilStart >= 0
    };
  }

  /**
   * Formatage des données de réservation pour l'affichage
   * @param {Object} booking - Données de la réservation
   * @returns {Object} Données formatées
   */
  formatBookingForDisplay(booking) {
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    return {
      ...booking,
      formattedStartDate: startDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      formattedEndDate: endDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      formattedDuration: `${duration} jour${duration > 1 ? 's' : ''}`,
      formattedTotalAmount: `${booking.pricing.totalAmount}€`,
      formattedStatus: this.getStatusLabel(booking.status),
      statusColor: this.getStatusColor(booking.status),
      canCancel: this.canCancelBooking(booking),
      canReview: this.canReviewBooking(booking)
    };
  }

  /**
   * Récupération du libellé du statut
   * @param {string} status - Statut de la réservation
   * @returns {string} Libellé du statut
   */
  getStatusLabel(status) {
    const statusLabels = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'paid': 'Payée',
      'active': 'En cours',
      'completed': 'Terminée',
      'cancelled': 'Annulée',
      'refunded': 'Remboursée'
    };
    
    return statusLabels[status] || status;
  }

  /**
   * Récupération de la couleur du statut
   * @param {string} status - Statut de la réservation
   * @returns {string} Classe CSS pour la couleur
   */
  getStatusColor(status) {
    const statusColors = {
      'pending': 'status-warning',
      'confirmed': 'status-info',
      'paid': 'status-success',
      'active': 'status-primary',
      'completed': 'status-success',
      'cancelled': 'status-danger',
      'refunded': 'status-secondary'
    };
    
    return statusColors[status] || 'status-default';
  }

  /**
   * Vérification si une réservation peut être annulée
   * @param {Object} booking - Données de la réservation
   * @returns {boolean} True si la réservation peut être annulée
   */
  canCancelBooking(booking) {
    const cancelableStatuses = ['pending', 'confirmed', 'paid'];
    const now = new Date();
    const startDate = new Date(booking.startDate);
    
    return cancelableStatuses.includes(booking.status) && startDate > now;
  }

  /**
   * Vérification si une réservation peut être évaluée
   * @param {Object} booking - Données de la réservation
   * @returns {boolean} True si la réservation peut être évaluée
   */
  canReviewBooking(booking) {
    return booking.status === 'completed' && !booking.review?.renterReview;
  }

  /**
   * Récupération du token d'authentification
   * @returns {string|null} Token d'authentification
   */
  getAuthToken() {
    try {
      return localStorage.getItem('sailingloc_token');
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  /**
   * Génération d'un objet de réservation par défaut
   * @param {string} boatId - ID du bateau
   * @returns {Object} Objet de réservation par défaut
   */
  createDefaultBookingData(boatId) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    return {
      boatId,
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: dayAfterTomorrow.toISOString().split('T')[0],
      participants: {
        adults: 2,
        children: 0
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      renterExperience: {
        hasLicense: false,
        licenseType: '',
        yearsOfExperience: 0,
        previousBoatTypes: [],
        additionalInfo: ''
      },
      specialRequests: '',
      skipperRequested: false,
      additionalServices: []
    };
  }

  /**
   * Conversion d'une réservation en événement de calendrier
   * @param {Object} booking - Données de la réservation
   * @returns {Object} Événement de calendrier
   */
  toCalendarEvent(booking) {
    return {
      id: booking._id,
      title: `${booking.boat.name} - ${booking.bookingNumber}`,
      start: booking.startDate,
      end: booking.endDate,
      color: this.getStatusColor(booking.status),
      extendedProps: {
        booking,
        status: booking.status,
        boatName: booking.boat.name,
        totalAmount: booking.pricing.totalAmount
      }
    };
  }
}