const { Complaint, Category, ComplaintImages, AuthorityCompany, ComplaintAssignment, Upvote, ComplaintReport, sequelize } = require('../models');
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
   CREATE CATEGORY (Admin)
========================= */
exports.createCategory = async (req, res) => {
  try {
    const { name, description = '' } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const trimmedName = name.trim();
    const existing = await Category.findOne({ where: { name: trimmedName } });
    if (existing) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    const category = await Category.create({ name: trimmedName, description });
    return res.status(201).json({ category });
  } catch (error) {
    console.error('Create Category Error:', error.message);
    return res.status(500).json({ message: 'Failed to create category', error: error.message });
  }
};

/* =========================
   DELETE CATEGORY (Admin)
========================= */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category is in use by complaints
    const complaintCount = await Complaint.count({ where: { categoryId: id } });
    if (complaintCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category - ${complaintCount} complaint(s) are using it` 
      });
    }

    // Check if category is linked to authority companies
    const linkCount = await sequelize.models.AuthorityCompanyCategory.count({ 
      where: { categoryId: id } 
    });
    if (linkCount > 0) {
      // Auto-remove the links
      await sequelize.models.AuthorityCompanyCategory.destroy({ 
        where: { categoryId: id } 
      });
    }

    const deleted = await Category.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Delete Category Error:', error.message);
    return res.status(500).json({ message: 'Failed to delete category', error: error.message });
  }
};

/* =========================
   GET AUTHORITY COMPANIES
========================= */
exports.getAuthorityCompanies = async (req, res) => {
  try {
    const companies = await AuthorityCompany.findAll({
      attributes: ['id', 'name', 'description'],
    });
    res.json(companies);
  } catch (error) {
    console.error('Get Authority Companies Error:', error.message);
    res.status(500).json({
      message: 'Failed to get authority companies',
      error: error.message,
    });
  }
};

/* =========================
   CREATE AUTHORITY COMPANY (Admin)
========================= */
exports.createAuthorityCompany = async (req, res) => {
  try {
    const { name, description = '' } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    const trimmedName = name.trim();
    const existing = await AuthorityCompany.findOne({ where: { name: trimmedName } });
    if (existing) {
      return res.status(409).json({ message: 'Department already exists' });
    }

    const company = await AuthorityCompany.create({ name: trimmedName, description });
    return res.status(201).json({ company });
  } catch (error) {
    console.error('Create Authority Company Error:', error.message);
    return res.status(500).json({ message: 'Failed to create department', error: error.message });
  }
};

/* =========================
   DELETE AUTHORITY COMPANY (Admin)
========================= */
exports.deleteAuthorityCompany = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if department is assigned to any complaints
    const assignmentCount = await sequelize.models.ComplaintAssignment.count({ 
      where: { authorityCompanyId: id } 
    });
    if (assignmentCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete department - ${assignmentCount} complaint(s) are assigned to it` 
      });
    }

    // Auto-remove category links
    await sequelize.models.AuthorityCompanyCategory.destroy({ 
      where: { authorityCompanyId: id } 
    });

    const deleted = await AuthorityCompany.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ message: 'Department not found' });
    }

    return res.json({ message: 'Department deleted' });
  } catch (error) {
    console.error('Delete Authority Company Error:', error.message);
    return res.status(500).json({ message: 'Failed to delete department', error: error.message });
  }
};

/* =========================
   GET ALL COMPLAINTS
========================= */
exports.getAllComplaints = async (req, res) => {
  try {
    const { status, categoryId, page = 1, limit = 10, citizenUid } = req.query;

    const where = {};
    if (status) where.currentStatus = status;
    if (categoryId) where.categoryId = categoryId;

    const offset = (page - 1) * limit;

    const include = [
      { model: Category, attributes: ['id', 'name'] },
      {
        model: ComplaintImages,
        as: 'images',
        attributes: ['id', 'imageURL'],
      }
    ];

    if (citizenUid) {
      include.push({
        model: Upvote,
        where: { citizenUid },
        required: false,
        attributes: ['citizenUid']
      });
    }

    const { count, rows } = await Complaint.findAndCountAll({
      where,
      distinct: true,
      include,
      order: [
        ['upvotes', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Ensure image URLs are accessible: generate signed URLs where possible
    const bucketName = 'cityzen-media';
    const complaintsWithSignedImages = await Promise.all(
      rows.map(async (complaint) => {
        const plainComplaint = complaint.get({ plain: true });

        // Add hasUpvoted flag
        if (citizenUid) {
          plainComplaint.hasUpvoted = plainComplaint.Upvotes && plainComplaint.Upvotes.length > 0;
          delete plainComplaint.Upvotes;
        } else {
          plainComplaint.hasUpvoted = false;
        }

        if (plainComplaint.images && plainComplaint.images.length > 0) {
          plainComplaint.images = await Promise.all(
            plainComplaint.images.map(async (img) => {
              try {
                const url = img.imageURL;
                const parsed = new URL(url);
                const path = parsed.pathname || '';
                // Extract object path after bucket name
                const marker = `/${bucketName}/`;
                const idx = path.indexOf(marker);
                const objectPath = idx >= 0 ? path.slice(idx + marker.length) : null;

                if (objectPath) {
                  const { data, error } = await supabase.storage
                    .from(bucketName)
                    .createSignedUrl(objectPath, 60 * 60); // 1 hour
                  if (!error && data?.signedUrl) {
                    img.imageURL = data.signedUrl;
                  }
                }
              } catch (e) {
                // Leave original URL if signing fails
              }
              return img;
            })
          );
        }
        return plainComplaint;
      })
    );

    res.json({
      complaints: complaintsWithSignedImages,
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
    const { citizenUid } = req.query;

    const include = [
      { model: Category, attributes: ['id', 'name', 'description'] },
      {
        model: ComplaintImages,
        as: 'images',
        attributes: ['id', 'imageURL'],
      },
    ];

    if (citizenUid) {
      include.push({
        model: Upvote,
        where: { citizenUid },
        required: false,
        attributes: ['citizenUid']
      });
    }

    const complaint = await Complaint.findByPk(id, { include });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    const plainComplaint = complaint.get({ plain: true });

    // Add hasUpvoted flag
    if (citizenUid) {
      plainComplaint.hasUpvoted = plainComplaint.Upvotes && plainComplaint.Upvotes.length > 0;
      delete plainComplaint.Upvotes;
    } else {
      plainComplaint.hasUpvoted = false;
    }

    // Sign image URLs to ensure accessibility
    const bucketName = 'cityzen-media';
    if (plainComplaint.images && plainComplaint.images.length > 0) {
      plainComplaint.images = await Promise.all(
        plainComplaint.images.map(async (img) => {
          try {
            const url = img.imageURL;
            const parsed = new URL(url);
            const path = parsed.pathname || '';
            const marker = `/${bucketName}/`;
            const idx = path.indexOf(marker);
            const objectPath = idx >= 0 ? path.slice(idx + marker.length) : null;
            if (objectPath) {
              const { data, error } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(objectPath, 60 * 60);
              if (!error && data?.signedUrl) {
                img.imageURL = data.signedUrl;
              }
            }
          } catch (e) {
            // keep original URL on failure
          }
          return img;
        })
      );
    }

    res.json(plainComplaint);
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

    console.log(`[DEBUG] updateComplaintStatus called for ID: ${id}, Status: ${currentStatus}, Notes: ${statusNotes}`);

    const validStatuses = [
      'pending',
      'accepted',
      'in_progress',
      'resolved',
      'closed',
      'rejected',
      'appealed',
      'completed'
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

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
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

/* =========================
   UPVOTE COMPLAINT
========================= */
exports.upvoteComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params; // Complaint ID
    // Insecure integration: Get citizenUid from body (since we reverted auth)
    const { citizenUid } = req.body;

    if (!citizenUid) {
      await t.rollback();
      return res.status(400).json({ message: 'Missing citizenUid in request body.' });
    }

    // Check if complaint exists
    const complaint = await Complaint.findByPk(id, { transaction: t });
    if (!complaint) {
      await t.rollback();
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // Check if upvote already exists
    const existingUpvote = await Upvote.findOne({
      where: {
        citizenUid: citizenUid,
        complaintId: id,
      },
      transaction: t,
    });

    if (existingUpvote) {
      await t.rollback();
      return res.status(400).json({ message: 'You have already upvoted this complaint.' });
    }

    // Create upvote
    try {
      await Upvote.create({
        citizenUid: citizenUid,
        complaintId: id,
      }, { transaction: t });
    } catch (createError) {
      if (createError.name === 'SequelizeUniqueConstraintError') {
        await t.rollback();
        return res.status(400).json({ message: 'You have already upvoted this complaint.' });
      }
      throw createError;
    }

    // Increment complaint upvote count
    await complaint.increment('upvotes', { transaction: t });
    // Reload to get the new count
    await complaint.reload({ transaction: t });

    await t.commit();
    res.json({
      message: 'Upvote successful',
      upvotes: complaint.upvotes,
    });

  } catch (error) {
    await t.rollback();
    console.error('Upvote Error:', error.message);
    res.status(500).json({
      message: 'Server error while upvoting.',
    });
  }
};

  /* =========================
     REPORT COMPLAINT
  ========================= */
  exports.reportComplaint = async (req, res) => {
    const t = await sequelize.transaction();
    try {
      let { complaintId, reportedBy, reason, description } = req.body;
      if (!complaintId && req.params && req.params.id) {
        complaintId = req.params.id;
      }

      if (!complaintId || !reportedBy || !reason) {
        return res.status(400).json({
          message: 'Missing required fields: complaintId, reportedBy, reason'
        });
      }

      // Validate reason enum
      const validReasons = [
        'harassment_threats',
        'hate_speech_discrimination',
        'nudity_sexual_content',
        'spam_scams',
        'fake_information_misinformation',
        'self_harm_suicide',
        'violence_graphic_content',
        'intellectual_property',
        'impersonation_fake_accounts',
        'child_safety',
        'other_violations'
      ];

      if (!validReasons.includes(reason)) {
        return res.status(400).json({
          message: `Invalid reason. Must be one of: ${validReasons.join(', ')}`
        });
      }

      // Check if complaint exists
      const complaint = await Complaint.findByPk(complaintId);
      if (!complaint) {
        return res.status(404).json({ message: 'Complaint not found' });
      }

      // Check if user already reported this complaint
      const existingReport = await ComplaintReport.findOne({
        where: {
          complaintId,
          reportedBy
        }
      });

      if (existingReport) {
        await t.rollback();
        return res.status(400).json({ message: 'You have already reported this complaint' });
      }

      // Create the report
      const report = await ComplaintReport.create(
        {
          complaintId,
          reportedBy,
          reason,
          description,
          status: 'pending'
        },
        { transaction: t }
      );

      await t.commit();
      res.status(201).json({
        message: 'Complaint reported successfully',
        report
      });
    } catch (error) {
      await t.rollback();
      console.error('Report Error:', error.message);
      res.status(500).json({
        message: 'Server error while reporting complaint.'
      });
    }
  };
/* =========================
   GET REPORTED COMPLAINTS (ADMIN)
========================= */
exports.getReportedComplaints = async (req, res) => {
  try {
    const { status } = req.query; // Optional filter by status (pending, reviewed, etc.)

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    console.log('[getReportedComplaints] Fetching reports with filter:', whereClause);

    const reports = await ComplaintReport.findAll({
      where: whereClause,
      include: [
        {
          model: Complaint,
          attributes: ['id', 'title', 'description', 'currentStatus', 'createdAt'],
          required: false,
          include: [
            {
              model: Category,
              attributes: ['name'],
              required: false
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log('[getReportedComplaints] Found', reports.length, 'reports');

    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Get Reports Error:', error);
    res.status(500).json({
      message: 'Server error while fetching reports.',
      error: error.message
    });
  }
};

/* =========================
   UPDATE REPORT STATUS (ADMIN)
========================= */
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const report = await ComplaintReport.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await report.update({ status });

    res.json({
      success: true,
      message: 'Report status updated successfully',
      report
    });
  } catch (error) {
    console.error('Update Report Status Error:', error.message);
    res.status(500).json({
      message: 'Server error while updating report status.'
    });
  }
};
