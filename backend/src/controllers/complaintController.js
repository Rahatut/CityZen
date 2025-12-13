const { Complaint, Category, sequelize } = require('../models');

exports.createComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      title,
      description,
      latitude,
      longitude,
      citizenUid,
      categoryId,
    } = req.body;

    if (!title || !latitude || !longitude || !citizenUid || !categoryId) {
      return res.status(400).json({ message: 'Missing required complaint fields.' });
    }

    const complaint = await Complaint.create({
      title,
      description,
      latitude,
      longitude,
      citizenUid,
      categoryId: categoryId,
      currentStatus: 'pending' // Default status
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ message: 'Complaint created successfully', complaint });

  } catch (error) {
    await t.rollback();
    console.error('Complaint Creation Error:', error.message);
    res.status(500).json({ message: `Complaint creation failed: ${error.message}` });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'description']
    });
    res.json(categories);
  } catch (error) {
    console.error('Get Categories Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching categories.' });
  }
};
