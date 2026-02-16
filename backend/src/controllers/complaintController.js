const { Complaint, Category, ComplaintImages, AuthorityCompany, ComplaintAssignment, Upvote, ComplaintReport, sequelize, User, Citizen } = require('../models');
const { Op } = require('sequelize');
const supabase = require('../config/supabase'); // Import Supabase client
const axios = require('axios');

// CREATE COMPLAINT
// CREATE COMPLAINT
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
      await t.rollback();
      return res
        .status(400)
        .json({ message: 'Missing required complaint fields or image data.' });
    }

    // 1. Spam/Abuse Detection
    // Check user account age and submission frequency
    const user = await User.findByPk(citizenUid, {
      include: [{ model: Citizen }]
    });

    if (user && user.Citizen && user.Citizen.isBanned) {
      await t.rollback();
      return res.status(403).json({
        message: 'Your account has been banned. You cannot submit complaints.',
        banned: true,
        banReason: user.Citizen.banReason,
        strikes: user.Citizen.strikes
      });
    }

    // Check account creation time (if available, assume created recently if field missing for now or check DB default)
    // For this requirements, let's check generic spam: 5+ complaints in last 30 mins
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentComplaintsCount = await Complaint.count({
      where: {
        citizenUid,
        createdAt: {
          [Op.gte]: thirtyMinsAgo
        }
      }
    });

    if (recentComplaintsCount >= 5) {
      await t.rollback();
      return res.status(429).json({
        message: 'You are submitting too many complaints. Please try again later.',
        requireCaptcha: true
      });
    }

    // 2. Exact Duplicate Block
    // Check active complaints (pending, accepted, in_progress)
    // Same category, same location (within 20 meters)
    // 20 meters ~ 0.00018 degrees (rough approximation)
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const duplicateCheck = await Complaint.findAll({
      where: {
        citizenUid,
        categoryId,
        currentStatus: {
          [Op.or]: ['pending', 'accepted', 'in_progress']
        },
        latitude: {
          [Op.between]: [lat - 0.0002, lat + 0.0002]
        },
        longitude: {
          [Op.between]: [lng - 0.0002, lng + 0.0002]
        }
      },
      order: [['createdAt', 'DESC']]
    });

    // Refined distance check (haversine formula or simple Euclidean for small distances)
    const exactMatch = duplicateCheck.find(c => {
      const dist = Math.sqrt(Math.pow(c.latitude - lat, 2) + Math.pow(c.longitude - lng, 2));
      // 0.00018 degrees is approx 20 meters
      return dist < 0.00018;
    });

    if (exactMatch) {
      // 3. The "Bump" Intercept
      // Check if duplicate has had NO authority activity for 3+ days
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const lastActivity = exactMatch.lastAuthorityActivityAt || exactMatch.updatedAt; // Fallback to updated if null

      const isInactive = new Date(lastActivity) < threeDaysAgo;

      await t.rollback();

      if (isInactive) {
        // Check if user has already bumped recently (e.g. within 3 days)
        const lastBump = exactMatch.lastBumpedAt;
        const canBump = !lastBump || new Date(lastBump) < threeDaysAgo;

        if (canBump) {
          return res.status(409).json({
            message: "You’ve already reported this! Since the authority hasn't responded yet, would you like to Bump this issue to the top of their queue instead?",
            isDuplicate: true,
            canBump: true,
            existingComplaintId: exactMatch.id
          });
        }
      }

      return res.status(409).json({
        message: 'This issue has already been reported by you. Check your dashboard for further information.',
        isDuplicate: true,
        existingComplaint: exactMatch
      });
    }

    // 4. Image Reuse Detection
    const sharp = require('sharp');
    const { blockhash } = require('blockhash-core');

    const bucketName = 'cityzen-media';
    const newComplaintImages = [];

    // Helper functions for pHash
    const generateImageHash = async (imageBuffer) => {
      try {
        const data = await sharp(imageBuffer)
          .resize(8, 8, { fit: 'fill' })
          .grayscale()
          .raw()
          .toBuffer();
        // 8x8 = 64 pixels. Hex string = 128 chars. Fits in varchar(255).
        return data.toString('hex');
      } catch (e) {
        console.error("Hash generation error", e);
        return null;
      }
    };

    const getHammingDistance = (str1, str2) => {
      if (!str1 || !str2 || str1.length !== str2.length) return 1000;
      let dist = 0;
      for (let i = 0; i < str1.length; i++) {
        if (str1[i] !== str2[i]) dist++;
      }
      return dist;
    };

    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles) {
        // Generate hash for current image
        const currentHash = await generateImageHash(file.buffer);
        console.log(`[ImageReuse] Current Hash for ${file.originalname}:`, currentHash ? currentHash.substring(0, 20) + '...' : 'null');

        let isReused = false;
        if (currentHash) {
          // Check against last 30 days of this user's images
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

          const previousImages = await ComplaintImages.findAll({
            where: {
              imageHash: {
                [Op.ne]: null
              },
              createdAt: {
                [Op.gte]: thirtyDaysAgo
              }
            },
            include: [{
              model: Complaint,
              where: { citizenUid },
              attributes: []
            }]
          });

          for (const prevImg of previousImages) {
            const dist = getHammingDistance(currentHash, prevImg.imageHash);
            console.log(`[ImageReuse] Distance to img ${prevImg.id}: ${dist}`);

            // 8x8 grayscale raw buffer is 64 bytes. Hex string is 128 chars.
            // 10% difference = 12.8.
            if (dist <= 12) {
              isReused = true;
              break;
            }
          }

          if (isReused) {
            await t.rollback();
            return res.status(400).json({
              message: 'Please provide a real-time photo of the issue to ensure our teams have the most current evidence.',
              isImageReused: true
            });
          }

          // Prep for upload
          newComplaintImages.push({
            file: file,
            hash: currentHash
          });
        } else {
          // Fallback if hash fails
          newComplaintImages.push({
            file: file,
            hash: null
          });
        }
      }
    }


    // Proceed to Create
    const complaint = await Complaint.create(
      {
        title,
        description,
        latitude,
        longitude,
        citizenUid,
        categoryId,
        currentStatus: 'pending',
        priorityScore: 0
      },
      { transaction: t }
    );

    for (const imgData of newComplaintImages) {
      const filePath = `complaint_images/${complaint.id}_${Date.now()}_${imgData.file.originalname}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, imgData.file.buffer, {
          contentType: imgData.file.mimetype,
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
          imageHash: imgData.hash
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

// GET CATEGORIES
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

// ADMIN KPI METRICS
exports.getAdminKpis = async (_req, res) => {
  try {
    // Basic counts
    const totalComplaints = await Complaint.count();
    const pending = await Complaint.count({ where: { currentStatus: 'pending' } });
    const resolved = await Complaint.findAll({
      where: { currentStatus: 'resolved' },
      attributes: ['createdAt', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
      limit: 200
    });

    // Avg resolve time (simple)
    let avgSolveHours = null;
    if (resolved.length > 0) {
      const durations = resolved
        .map(r => {
          const c = r.createdAt ? new Date(r.createdAt).getTime() : null;
          const u = r.updatedAt ? new Date(r.updatedAt).getTime() : null;
          if (!Number.isFinite(c) || !Number.isFinite(u)) return null;
          return Math.max(0, u - c);
        })
        .filter(x => Number.isFinite(x));
      if (durations.length > 0) {
        const totalMs = durations.reduce((a, b) => a + b, 0);
        avgSolveHours = totalMs / durations.length / 1000 / 60 / 60;
      }
    }

    // Service health: % resolved of total
    const serviceHealth = totalComplaints > 0
      ? Number(((resolved.length / totalComplaints) * 100).toFixed(1))
      : 100;

    res.json({
      serviceHealth,
      avgSolveHours,
      pending,
    });
  } catch (error) {
    console.error('Get Admin KPIs Error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Server error while fetching admin KPIs.' });
  }
};

// ADMIN KPI DETAILS (simple)
exports.getAdminKpiDetails = async (_req, res) => {
  try {
    const total = await Complaint.count();
    const pendingCount = await Complaint.count({ where: { currentStatus: 'pending' } });
    const resolvedRows = await Complaint.findAll({
      where: { currentStatus: 'resolved' },
      attributes: ['id', 'title', 'createdAt', 'updatedAt', 'categoryId'],
      include: [{ model: Category, attributes: ['name'], required: false }],
      order: [['updatedAt', 'DESC']],
      limit: 50,
    });

    const pendingRows = await Complaint.findAll({
      where: { currentStatus: 'pending' },
      attributes: ['id', 'title', 'createdAt', 'categoryId'],
      include: [{ model: Category, attributes: ['name'], required: false }],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    let avgSolveHours = null;
    if (resolvedRows.length > 0) {
      const durations = resolvedRows
        .map(r => {
          const c = r.createdAt ? new Date(r.createdAt).getTime() : null;
          const u = r.updatedAt ? new Date(r.updatedAt).getTime() : null;
          if (!Number.isFinite(c) || !Number.isFinite(u)) return null;
          return Math.max(0, u - c);
        })
        .filter(x => Number.isFinite(x));
      if (durations.length > 0) {
        const totalMs = durations.reduce((a, b) => a + b, 0);
        avgSolveHours = totalMs / durations.length / 1000 / 60 / 60;
      }
    }

    const serviceHealth = total > 0
      ? Number(((resolvedRows.length / total) * 100).toFixed(1))
      : 100;

    res.json({
      total,
      pending: pendingCount,
      resolved: resolvedRows.length,
      serviceHealth,
      avgSolveHours,
      resolvedList: resolvedRows.map(r => ({
        id: r.id,
        title: r.title,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        category: r.Category?.name || 'Uncategorized'
      })),
      pendingList: pendingRows.map(p => ({
        id: p.id,
        title: p.title,
        createdAt: p.createdAt,
        category: p.Category?.name || 'Uncategorized'
      })),
    });
  } catch (error) {
    console.error('Get Admin KPI Details Error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Server error while fetching admin KPI details.' });
  }
};

// ADMIN MODERATION OVERVIEW
exports.getModerationOverview = async (_req, res) => {
  try {
    const [reportedTotal, reportedPending, appealsPending, appealsTotal] = await Promise.all([
      ComplaintReport.count(),
      ComplaintReport.count({ where: { status: 'pending' } }),
      Complaint.count({ where: { appealStatus: 'pending' } }),
      Complaint.count({ where: { appealStatus: { [Op.ne]: 'none' } } })
    ]);

    res.json({
      reportedTotal,
      reportedPending,
      appealsPending,
      appealsTotal
    });
  } catch (error) {
    console.error('Get Moderation Overview Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching moderation overview.' });
  }
};

// CREATE CATEGORY
exports.createCategory = async (req, res) => {
  try {
    const name = req.body?.name?.trim();
    const description = req.body?.description?.trim();

    if (!name) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    const [category, created] = await Category.findOrCreate({
      where: { name },
      defaults: { description },
    });

    return res.status(created ? 201 : 200).json({
      message: created ? 'Category created successfully.' : 'Category already exists.',
      category,
    });
  } catch (error) {
    console.error('Create Category Error:', error.message);
    res.status(500).json({
      message: 'Server error while creating category.',
    });
  }
};

// DELETE CATEGORY (SAFE)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Category id is required.' });
    }

    const complaintCount = await Complaint.count({ where: { categoryId: id } });
    if (complaintCount > 0) {
      return res.status(400).json({ message: 'Category cannot be deleted because complaints reference it.' });
    }

    const deleted = await Category.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    return res.json({ message: 'Category deleted.' });
  } catch (error) {
    console.error('Delete Category Error:', error.message);
    res.status(500).json({ message: 'Server error while deleting category.' });
  }
};

// GET DEPARTMENTS
exports.getDepartments = async (_req, res) => {
  try {
    const departments = await AuthorityCompany.findAll({
      attributes: ['id', 'name', 'description'],
    });
    res.json(departments);
  } catch (error) {
    console.error('Get Departments Error:', error.message);
    res.status(500).json({
      message: 'Server error while fetching departments.',
    });
  }
};

// CREATE DEPARTMENT
exports.createDepartment = async (req, res) => {
  try {
    const name = req.body?.name?.trim();
    const description = req.body?.description?.trim();

    if (!name) {
      return res.status(400).json({ message: 'Department name is required.' });
    }

    const [department, created] = await AuthorityCompany.findOrCreate({
      where: { name },
      defaults: { description },
    });

    return res.status(created ? 201 : 200).json({
      message: created ? 'Department created successfully.' : 'Department already exists.',
      department,
    });
  } catch (error) {
    console.error('Create Department Error:', error.message);
    res.status(500).json({
      message: 'Server error while creating department.',
    });
  }
};

// DELETE DEPARTMENT (SAFE)
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Department id is required.' });
    }

    const assignments = await ComplaintAssignment.count({ where: { authorityCompanyId: id } });
    if (assignments > 0) {
      return res.status(400).json({ message: 'Department cannot be deleted because complaints are assigned to it.' });
    }

    const deleted = await AuthorityCompany.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    return res.json({ message: 'Department deleted.' });
  } catch (error) {
    console.error('Delete Department Error:', error.message);
    res.status(500).json({ message: 'Server error while deleting department.' });
  }
};

// GET ALL COMPLAINTS
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
        attributes: ['id', 'imageURL', 'type'],
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

// GET COMPLAINTS BY CITIZEN
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
          attributes: ['id', 'imageURL', 'type'],
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

// GET COMPLAINTS ASSIGNED TO AUTHORITY
exports.getComplaintsByAuthority = async (req, res) => {
  try {
    const { authorityCompanyId } = req.params;
    const { status, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    // Check if authorityCompanyId exists
    const company = await sequelize.models.AuthorityCompany.findByPk(parseInt(authorityCompanyId));
    if (!company) {
      return res.json({
        complaints: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: 0,
        },
        message: 'Authority company not found.'
      });
    }

    // Find all complaints assigned to this authority company
    const assignments = await ComplaintAssignment.findAll({
      where: { authorityCompanyId: parseInt(authorityCompanyId) },
      attributes: ['complaintId'],
    });

    if (!assignments || assignments.length === 0) {
      return res.json({
        complaints: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: 0,
        },
        message: 'No complaints assigned to this authority company.'
      });
    }

    const complaintIds = assignments.map(a => a.complaintId);
    const where = { id: complaintIds };
    if (status) where.currentStatus = status;

    const { count, rows } = await Complaint.findAndCountAll({
      where,
      include: [
        { model: Category, attributes: ['id', 'name'] },
        {
          model: ComplaintImages,
          as: 'images',
          attributes: ['id', 'imageURL', 'type'],
        },
      ],
      order: [
        ['createdAt', 'DESC']
      ],
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
    console.error('Get Complaints by Authority Error:', error.message, error);
    res.status(500).json({
      message: 'Server error while fetching authority complaints.',
    });
  }
};

// GET COMPLAINT BY ID
exports.getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const { citizenUid } = req.query;

    const include = [
      { model: Category, attributes: ['id', 'name', 'description'] },
      {
        model: ComplaintImages,
        as: 'images',
        attributes: ['id', 'imageURL', 'type'],
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

// UPDATE COMPLAINT STATUS
exports.updateComplaintStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { currentStatus, statusNotes } = req.body;
    const imageFiles = req.files;

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
      await t.rollback();
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      await t.rollback();
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // Proof Validation
    if ((currentStatus === 'in_progress' || currentStatus === 'resolved') && (!imageFiles || imageFiles.length === 0)) {
      await t.rollback();
      return res.status(400).json({ message: `Image proof is required for status: ${currentStatus.replace('_', ' ')}` });
    }

    await complaint.update({
      currentStatus,
      statusNotes: statusNotes || complaint.statusNotes,
    }, { transaction: t });

    // Upload images if provided
    if (imageFiles && imageFiles.length > 0) {
      const bucketName = 'cityzen-media';
      const imageType = currentStatus === 'resolved' ? 'resolution' : 'progress';

      for (const imageFile of imageFiles) {
        const filePath = `complaint_images/${id}_${Date.now()}_${imageFile.originalname}`;
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, imageFile.buffer, {
            contentType: imageFile.mimetype,
            upsert: false,
          });

        if (uploadError) throw new Error(`Supabase upload failed: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        if (!publicUrlData?.publicUrl) throw new Error('Failed to retrieve public URL.');

        await ComplaintImages.create({
          complaintId: id,
          imageURL: publicUrlData.publicUrl,
          type: imageType
        }, { transaction: t });
      }
    }

    await t.commit();
    res.json({
      message: 'Complaint status updated successfully',
      complaint,
    });
  } catch (error) {
    await t.rollback();
    console.error('Update Complaint Status Error:', error.message);
    res.status(500).json({
      message: 'Server error while updating complaint status.',
    });
  }
};

// BUMP COMPLAINT
exports.bumpComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      await t.rollback();
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // Check bump eligibility (3+ days since last bump)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    if (complaint.lastBumpedAt && new Date(complaint.lastBumpedAt) > threeDaysAgo) {
      await t.rollback();
      return res.status(400).json({ message: 'You can only bump this complaint once every 3 days.' });
    }

    // Calculate New Priority
    const daysSinceSubmission = (Date.now() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    // (Upvotes + Bumps) * Days
    // We don't have a direct 'bumps' count column, but we can infer or use a simple increment strategy.
    // Let's just boost priority score directly or assume each bump adds weight.
    // For now, let's use: (Upvotes + 1) * Days (since we are bumping now)

    // To track total bumps, we might need a count. For now let's use the formula:
    // Priority += DaysSinceSubmission * 10 (arbitrary weight for a bump)

    const boost = Math.ceil(daysSinceSubmission * 10);
    const newPriority = (complaint.priorityScore || 0) + boost;

    await complaint.update({
      priorityScore: newPriority,
      lastBumpedAt: new Date()
    }, { transaction: t });

    await t.commit();
    res.json({
      message: 'Complaint priority bumped successfully!',
      priorityScore: newPriority
    });

  } catch (error) {
    await t.rollback();
    console.error('Bump Complaint Error:', error.message);
    res.status(500).json({
      message: 'Server error while bumping complaint.'
    });
  }
};

// RATE COMPLAINT
exports.rateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, citizenUid } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Valid rating (1-5) is required.' });
    }

    const complaint = await Complaint.findByPk(id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    // Basic permission check: only the reporter can rate
    // if (complaint.citizenUid !== citizenUid) {
    //   return res.status(403).json({ message: 'Only the reporter can rate this complaint.' });
    // }

    if (complaint.currentStatus !== 'resolved' && complaint.currentStatus !== 'completed') {
      return res.status(400).json({ message: 'Complaint must be resolved before rating.' });
    }

    await complaint.update({ rating });
    res.json({ message: 'Rating submitted successfully', rating });
  } catch (error) {
    console.error('Rate Complaint Error:', error.message);
    res.status(500).json({ message: 'Server error while rating complaint.' });
  }
};

// APPEAL COMPLAINT
exports.appealComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { appealReason, citizenUid } = req.body;
    const imageFiles = req.files;

    if (!appealReason) {
      await t.rollback();
      return res.status(400).json({ message: 'Appeal reason is required.' });
    }

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      await t.rollback();
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // Permission check
    if (complaint.citizenUid !== citizenUid) {
      await t.rollback();
      return res.status(403).json({ message: 'Only the reporter can appeal this complaint.' });
    }

    const eligibleStatuses = ['resolved', 'rejected'];
    if (!eligibleStatuses.includes(complaint.currentStatus)) {
      await t.rollback();
      return res.status(400).json({ message: 'Complaint can only be appealed if resolved or rejected.' });
    }

    await complaint.update({
      currentStatus: 'appealed',
      appealReason,
      appealStatus: 'pending'
    }, { transaction: t });

    // Upload appeal images
    if (imageFiles && imageFiles.length > 0) {
      const bucketName = 'cityzen-media';
      for (const imageFile of imageFiles) {
        const filePath = `appeal_images/${id}_${Date.now()}_${imageFile.originalname}`;
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, imageFile.buffer, {
            contentType: imageFile.mimetype,
            upsert: false,
          });

        if (uploadError) throw new Error(`Supabase upload failed: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        await ComplaintImages.create({
          complaintId: id,
          imageURL: publicUrlData.publicUrl,
          type: 'appeal'
        }, { transaction: t });
      }
    }

    await t.commit();
    res.json({ message: 'Appeal submitted successfully', currentStatus: 'appealed' });
  } catch (error) {
    await t.rollback();
    console.error('Appeal Error:', error.message);
    res.status(500).json({ message: 'Server error while submitting appeal.' });
  }
};

// DELETE COMPLAINT
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

// RECOMMEND AUTHORITIES
exports.getRecommendedAuthorities = async (req, res) => {
  try {
    const { categoryId, latitude, longitude } = req.query;

    if (!categoryId || !latitude || !longitude) {
      return res.status(400).json({ message: 'Missing required query parameters: categoryId, latitude, longitude' });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    const haversineDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of the Earth in kilometers
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in kilometers
    };

    const companiesForCategory = await sequelize.models.AuthorityCompanyCategory.findAll({
      where: { categoryId: categoryId },
      attributes: ['authorityCompanyId'],
    });

    if (companiesForCategory.length === 0) {
      return res.json([]);
    }

    const companyIds = companiesForCategory.map(c => c.authorityCompanyId);

    const companyAreas = await sequelize.models.AuthorityCompanyAreas.findAll({
      where: {
        authorityCompanyId: companyIds,
      },
    });

    const relevantCompanies = new Set();
    companyAreas.forEach(area => {
      const distance = haversineDistance(userLat, userLon, area.latitude, area.longitude);
      if (distance <= area.radius) {
        relevantCompanies.add(area.authorityCompanyId);
      }
    });

    if (relevantCompanies.size === 0) {
      return res.json([]);
    }

    const recommendedAuthorities = await AuthorityCompany.findAll({
      where: {
        id: Array.from(relevantCompanies),
      },
      attributes: ['id', 'name', 'description'],
    });

    res.json(recommendedAuthorities);

  } catch (error) {
    console.error('Get Recommended Authorities Error:', error.message);
    res.status(500).json({
      message: 'Error getting recommended authorities',
      error: error.message,
    });
  }
};

// UPVOTE COMPLAINT
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

// REPORT COMPLAINT
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

// CHECK DUPLICATE COMPLAINTS
exports.checkDuplicateComplaints = async (req, res) => {
  try {
    const { latitude, longitude, categoryId } = req.body;

    if (!latitude || !longitude || !categoryId) {
      return res.status(400).json({
        message: 'Missing required fields: latitude, longitude, categoryId',
      });
    }

    // Configurable search radius (in meters)
    const searchRadius = process.env.DUPLICATE_CHECK_RADIUS_METERS ? parseInt(process.env.DUPLICATE_CHECK_RADIUS_METERS) : 100;
    const searchIntervalDays = 30; // days

    const query = `
      SELECT
        c.id,
        c.title,
        c.description,
        c.latitude,
        c.longitude,
        c."citizenUid",
        c."categoryId",
        c."currentStatus",
        c.upvotes,
        c."createdAt",
        (
          6371000 * acos(
            cos(radians(:latitude)) * cos(radians(c.latitude))
            * cos(radians(c.longitude) - radians(:longitude))
            + sin(radians(:latitude)) * sin(radians(c.latitude))
          )
        ) AS distance,
        (
          SELECT "imageURL"
          FROM "ComplaintImages"
          WHERE "complaintId" = c.id
          ORDER BY id
          LIMIT 1
        ) AS "imageUrl"
      FROM "Complaints" AS c
      WHERE c."categoryId" = :categoryId
        AND c."createdAt" >= NOW() - INTERVAL '${searchIntervalDays} days'
        AND (
          6371000 * acos(
            cos(radians(:latitude)) * cos(radians(c.latitude))
            * cos(radians(c.longitude) - radians(:longitude))
            + sin(radians(:latitude)) * sin(radians(c.latitude))
          )
        ) < :searchRadius
      ORDER BY distance;
    `;

    let nearbyComplaints = await sequelize.query(query, {
      replacements: {
        latitude: Number(latitude),
        longitude: Number(longitude),
        categoryId: Number(categoryId),
        searchRadius,
        searchIntervalDays,
      },
      type: sequelize.QueryTypes.SELECT,
    });

    const bucketName = 'cityzen-media';

    // Sign image URLs for accessibility
    nearbyComplaints = await Promise.all(
      nearbyComplaints.map(async (complaint) => {
        if (complaint.imageUrl) {
          try {
            const url = complaint.imageUrl;
            const parsed = new URL(url);
            const path = parsed.pathname || '';
            const marker = `/${bucketName}/`;
            const idx = path.indexOf(marker);
            const objectPath = idx >= 0 ? path.slice(idx + marker.length) : null;

            if (objectPath) {
              const { data, error } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(objectPath, 60 * 60); // 1 hour
              if (!error && data?.signedUrl) {
                complaint.imageUrl = data.signedUrl;
              }
            }
          } catch (e) {
            console.error('Error signing image URL:', e);
            // Keep original URL on failure
          }
        }
        return complaint;
      })
    );


    return res.status(200).json({
      isDuplicate: nearbyComplaints.length > 0,
      complaints: nearbyComplaints,
      searchRadius,
      searchIntervalDays,
    });

  } catch (error) {
    console.error('Check Duplicate Complaints Error:', error);
    res.status(500).json({
      message: 'Server error while checking for duplicate complaints.',
    });
  }
};

// GET REPORTED COMPLAINTS (ADMIN)
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

// UPDATE REPORT STATUS (ADMIN)
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

/* =========================
   GET ALL APPEALS (ADMIN)
========================= */
exports.getAppeals = async (req, res) => {
  try {
    const { status } = req.query;

    const whereClause = {
      appealStatus: status === 'all' ? { [Op.ne]: 'none' } : (status || 'pending')
    };

    const appeals = await Complaint.findAll({
      where: whereClause,
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'description']
        },
        {
          model: ComplaintImages,
          as: 'images',
          attributes: ['id', 'imageURL', 'type']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    res.json({
      success: true,
      count: appeals.length,
      appeals
    });
  } catch (error) {
    console.error('Get Appeals Error:', error);
    res.status(500).json({
      message: 'Server error while fetching appeals.',
      error: error.message
    });
  }
};

/* =========================
   ADD EVIDENCE TO COMPLAINT
========================= */
exports.addEvidenceToComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id: complaintId } = req.params;
    const imageFiles = req.files;

    if (!complaintId) {
      return res.status(400).json({ message: 'Complaint ID is required.' });
    }
    if (!imageFiles || imageFiles.length === 0) {
      return res.status(400).json({ message: 'Image files are required.' });
    }

    const complaint = await Complaint.findByPk(complaintId, { transaction: t });
    if (!complaint) {
      await t.rollback();
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    const bucketName = 'cityzen-media';
    const uploadedImages = [];

    for (const imageFile of imageFiles) {
      const filePath = `complaint_evidence/${complaintId}_${Date.now()}_${imageFile.originalname}`;

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

      const newImage = await ComplaintImages.create(
        {
          complaintId: complaintId,
          imageURL: publicUrlData.publicUrl,
          type: 'evidence', // Mark as evidence
        },
        { transaction: t }
      );
      uploadedImages.push(newImage);
    }

    await t.commit();
    res.status(201).json({
      message: 'Evidence added successfully',
      images: uploadedImages,
    });
  } catch (error) {
    await t.rollback();
    console.error('Add Evidence to Complaint Error:', error.message);
    res.status(500).json({
      message: `Failed to add evidence: ${error.message}`,
    });
  }
};

/* =========================
   UPDATE APPEAL STATUS (ADMIN)
========================= */
exports.updateAppealStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { action, adminRemarks } = req.body;

    const validActions = ['approve', 'reject'];
    if (!validActions.includes(action)) {
      await t.rollback();
      return res.status(400).json({
        message: `Invalid action. Must be one of: ${validActions.join(', ')}`
      });
    }

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      await t.rollback();
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.currentStatus !== 'appealed') {
      await t.rollback();
      return res.status(400).json({
        message: 'Only appealed complaints can have their appeal status updated'
      });
    }

    if (action === 'approve') {
      // Forward back to authority - keep status as appealed until authority accepts
      await complaint.update({
        currentStatus: 'appealed',
        appealStatus: 'approved',
        forwardedByAdmin: true,
        adminRemarks: adminRemarks || 'Appeal approved by admin - re-investigation required',
        statusNotes: `Admin approved appeal: ${adminRemarks || 'Re-investigation required'}`
      }, { transaction: t });

      await t.commit();
      res.json({
        success: true,
        message: 'Appeal approved and forwarded to authority for review',
        complaint
      });
    } else {
      // Reject appeal - set back to rejected
      await complaint.update({
        currentStatus: 'rejected',
        appealStatus: 'rejected',
        adminRemarks: adminRemarks || 'Appeal rejected by admin',
        statusNotes: `Admin rejected appeal: ${adminRemarks || 'No grounds for re-investigation'}`
      }, { transaction: t });

      await t.commit();
      res.json({
        success: true,
        message: 'Appeal rejected',
        complaint
      });
    }
  } catch (error) {
    await t.rollback();
    console.error('Update Appeal Status Error:', error.message);
    res.status(500).json({
      message: 'Server error while updating appeal status.'
    });
  }
};
