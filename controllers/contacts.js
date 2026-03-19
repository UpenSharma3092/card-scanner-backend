const Contact = require('../models/Contact');
const Notification = require('../models/Notification');

// @desc    Get all contacts
// @route   GET /api/contacts
// @access  Private
exports.getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find({ user: req.user.id }).sort('-addedAt');

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Get single contact
// @route   GET /api/contacts/:id
// @access  Private
exports.getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: `Contact not found with id of ${req.params.id}`,
      });
    }

    // Make sure user is contact owner
    if (contact.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to access this contact`,
      });
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Create new contact
// @route   POST /api/contacts
// @access  Private
exports.createContact = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;

    // Support both singular 'phone' and plural 'phones' from client
    if (req.body.phone && (!req.body.phones || req.body.phones.length === 0)) {
      req.body.phones = [req.body.phone];
    }

    const contact = await Contact.create(req.body);

    // Create notification (if enabled)
    if (req.user.settings.realTimeScanAlerts && !req.user.settings.incognitoScanning) {
      await Notification.create({
        user: req.user.id,
        title: 'New Card Scanned',
        body: `Contact "${contact.name}" from ${contact.company} was added.`,
        category: 'scanAlert',
      });
    }

    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private
exports.updateContact = async (req, res, next) => {
  try {
    let contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: `Contact not found with id of ${req.params.id}`,
      });
    }

    // Make sure user is contact owner
    if (contact.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this contact`,
      });
    }

    // Support both singular 'phone' and plural 'phones' from client
    if (req.body.phone && (!req.body.phones || req.body.phones.length === 0)) {
      req.body.phones = [req.body.phone];
    }

    contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private
exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: `Contact not found with id of ${req.params.id}`,
      });
    }

    // Make sure user is contact owner
    if (contact.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this contact`,
      });
    }

    await contact.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
