const { Complaint, Category, ComplaintImages, AuthorityCompany, ComplaintAssignment, sequelize } = require('../models');
const supabase = require('../config/supabase'); // Import Supabase client
const axios = require('axios');

/* =========================
   CREATE COMPLAINT
========================= */
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

    const imageFiles = req.files;

    if (
      !title ||
      !latitude ||
      !longitude ||
      !citizenUid ||
      !categoryId ||
      !imageFiles ||
      imageFiles.length === 0
    ) {
      return res
        .status(400)
        .json({ message: 'Missing required complaint fields or image data.' });
    }

    const complaint = await Complaint.create(
      {
        title,
        description,
        latitude,
        longitude,
        citizenUid,
        categoryId,
        currentStatus: 'pending',
      },
      { transaction: t }
    );

    const bucketName = 'cityzen-media';

    for (const imageFile of imageFiles) {
      const filePath = `complaint_images/${complaint.id}_${Date.now()}_${imageFile.originalname}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, imageFile.buffer, {
          contentType: imageFile.mimetype,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Supabase upload failed: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to retrieve public URL.');
      }

      await ComplaintImages.create(
        {
          complaintId: complaint.id,
          imageURL: publicUrlData.publicUrl,
        },
        { transaction: t }
      );
    }

    const { chosenAuthorities } = req.body;
    if (chosenAuthorities) {
      const authorityIds = JSON.parse(chosenAuthorities);
      if (Array.isArray(authorityIds) && authorityIds.length > 0) {
        for (const authorityId of authorityIds) {
          await ComplaintAssignment.create({
            complaintId: complaint.id,
            authorityCompanyId: authorityId,
          }, { transaction: t });
        }
      }
    }

    await t.commit();
    res.status(201).json({
      message: 'Complaint created successfully',
      complaint,
    });
  } catch (error) {
    await t.rollback();
    console.error('Complaint Creation Error:', error.message);
    res.status(500).json({
      message: `Complaint creation failed: ${error.message}`,
    });
  }
};

/* =========================
   GET CATEGORIES
========================= */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'description'],
    });
    res.json(categories);
  } catch (error) {
    console.error('Get Categories Error:', error.message);
    res.status(500).json({
      message: 'Server error while fetching categories.',
    });
  }
};

/* =========================
   GET ALL COMPLAINTS
========================= */
exports.getAllComplaints = async (req, res) => {
  try {
    const { status, categoryId, page = 1, limit = 10 } = req.query;

    const where = {};
    if (status) where.currentStatus = status;
    if (categoryId) where.categoryId = categoryId;

    const offset = (page - 1) * limit;

    const { count, rows } = await Complaint.findAndCountAll({
      where,
      include: [
        { model: Category, attributes: ['id', 'name'] },
        {
          model: ComplaintImages,
          as: 'images',
          attributes: ['id', 'imageURL'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      complaints: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Get All Complaints Error:', error.message);
    res.status(500).json({
      message: 'Server error while fetching complaints.',
    });
  }
};

/* =========================
   GET COMPLAINTS BY CITIZEN
========================= */
exports.getComplaintsByCitizen = async (req, res) => {
  try {
    const { citizenUid } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const where = { citizenUid };
    if (status) where.currentStatus = status;

    const offset = (page - 1) * limit;

    const { count, rows } = await Complaint.findAndCountAll({
      where,
      include: [
        { model: Category, attributes: ['id', 'name'] },
        {
          model: ComplaintImages,
          as: 'images',
          attributes: ['id', 'imageURL'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      complaints: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Get Complaints by Citizen Error:', error.message);
    res.status(500).json({
      message: 'Server error while fetching citizen complaints.',
    });
  }
};

/* =========================
   GET COMPLAINT BY ID
========================= */
exports.getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findByPk(id, {
      include: [
        { model: Category, attributes: ['id', 'name', 'description'] },
        {
          model: ComplaintImages,
          as: 'images',
          attributes: ['id', 'imageURL'],
        },
      ],
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    res.json(complaint);
  } catch (error) {
    console.error('Get Complaint by ID Error:', error.message);
    res.status(500).json({
      message: 'Server error while fetching complaint.',
    });
  }
};

/* =========================
   UPDATE COMPLAINT STATUS
========================= */
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentStatus, statusNotes } = req.body;

    const validStatuses = [
      'pending',
      'in_progress',
      'resolved',
      'closed',
      'rejected',
    ];

    if (!validStatuses.includes(currentStatus)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    await complaint.update({
      currentStatus,
      statusNotes: statusNotes || complaint.statusNotes,
    });

    res.json({
      message: 'Complaint status updated successfully',
      complaint,
    });
  } catch (error) {
    console.error('Update Complaint Status Error:', error.message);
    res.status(500).json({
      message: 'Server error while updating complaint status.',
    });
  }
};

/* =========================
   DELETE COMPLAINT
========================= */
exports.deleteComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { citizenUid } = req.body;

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    if (complaint.citizenUid !== citizenUid) {
      return res.status(403).json({
        message: 'Not authorized to delete this complaint.',
      });
    }

    await Complaint.destroy({
      where: { id },
      transaction: t,
    });

    await t.commit();
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Delete Complaint Error:', error.message);
    res.status(500).json({
      message: 'Server error while deleting complaint.',
    });
  }
};

/* =========================
   RECOMMEND AUTHORITIES
========================= */
exports.getRecommendedAuthorities = async (req, res) => {
  try {
    const {
      category,
      description,
      latitude,
      longitude,
      location_string,
    } = req.query;

    // Validate that we have at least the basic info
    if (!category || !latitude || !longitude) {
      return res.status(400).json({ message: 'Missing required query parameters: category, latitude, longitude' });
    }

    // Load authority list from DB to send to the AI recommendation service
    const authorities = await AuthorityCompany.findAll({ attributes: ['id', 'name'] });
    const authoritiesPayload = authorities.map((a) => ({ id: a.id, name: a.name }));

    if (!process.env.OPENROUTER_API_URL) {
      console.warn('OPENROUTER_API_URL not set; defaulting to http://localhost:8001');
    }
    const openRouterUrl = process.env.OPENROUTER_API_URL || 'http://localhost:8001';

    // Call the OpenRouter / recommendation service
    const openRouterResponse = await axios.post(`${openRouterUrl}/recommend-authority`, {
      category,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      location_string,
      authorities: authoritiesPayload,
    }, { timeout: 15000 });

    const recommendations = openRouterResponse.data;
    if (!Array.isArray(recommendations)) {
      throw new Error('Invalid response from recommendation service');
    }

    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        const authority = rec.authorityCompanyId
          ? await AuthorityCompany.findByPk(rec.authorityCompanyId, { attributes: ['name'] })
          : null;

        return {
          ...rec,
          authorityName: authority ? authority.name : 'Unknown Authority'
        };
      })
    );

    res.status(200).json(enrichedRecommendations);

  } catch (error) {
    console.error('Get Recommended Authorities Error:', error.message);
    res.status(500).json({
      message: 'Error getting recommended authorities',
      error: error.message,
    });
  }
};
