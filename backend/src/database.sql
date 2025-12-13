/* =========================================================
   SMART CITY COMPLAINT MANAGEMENT SYSTEM
   CLEAN CONSOLIDATED SQL SCHEMA
   ========================================================= */

-- =========================
-- USERS & ROLES
-- =========================

CREATE TABLE "Users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) CHECK ("role" IN ('admin', 'citizen', 'authority')) NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "last_login" TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

ALTER TABLE "Users" ADD PRIMARY KEY ("id");
ALTER TABLE "Users" ADD CONSTRAINT "users_username_unique" UNIQUE ("username");
ALTER TABLE "Users" ADD CONSTRAINT "users_email_unique" UNIQUE ("email");

-- =========================
-- CATEGORY
-- =========================

CREATE TABLE "Category" (
    "id" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT
);

ALTER TABLE "Category" ADD PRIMARY KEY ("id");
ALTER TABLE "Category" ADD CONSTRAINT "category_name_unique" UNIQUE ("name");

-- =========================
-- AUTHORITY COMPANY
-- =========================

CREATE TABLE "Authority_Company" (
    "id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "latitude" DECIMAL(15,6) NOT NULL,
    "longitude" DECIMAL(15,6) NOT NULL
);

ALTER TABLE "Authority_Company" ADD PRIMARY KEY ("id");
ALTER TABLE "Authority_Company"
ADD CONSTRAINT "authority_company_category_id_foreign"
FOREIGN KEY ("category_id") REFERENCES "Category" ("id");

-- =========================
-- USER SUB-TYPES
-- =========================

CREATE TABLE "Admin" (
    "id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL
);
ALTER TABLE "Admin" ADD PRIMARY KEY ("id");
ALTER TABLE "Admin" ADD CONSTRAINT "admin_user_id_unique" UNIQUE ("user_id");
ALTER TABLE "Admin"
ADD CONSTRAINT "admin_user_id_foreign"
FOREIGN KEY ("user_id") REFERENCES "Users" ("id");

CREATE TABLE "Citizen" (
    "id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "ward" VARCHAR(30) NOT NULL
);
ALTER TABLE "Citizen" ADD PRIMARY KEY ("id");
ALTER TABLE "Citizen" ADD CONSTRAINT "citizen_user_id_unique" UNIQUE ("user_id");
ALTER TABLE "Citizen"
ADD CONSTRAINT "citizen_user_id_foreign"
FOREIGN KEY ("user_id") REFERENCES "Users" ("id");

CREATE TABLE "Authority" (
    "id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "authority_company_id" BIGINT NOT NULL
);
ALTER TABLE "Authority" ADD PRIMARY KEY ("id");
ALTER TABLE "Authority" ADD CONSTRAINT "authority_user_id_unique" UNIQUE ("user_id");
ALTER TABLE "Authority"
ADD CONSTRAINT "authority_user_id_foreign"
FOREIGN KEY ("user_id") REFERENCES "Users" ("id");
ALTER TABLE "Authority"
ADD CONSTRAINT "authority_authority_company_id_foreign"
FOREIGN KEY ("authority_company_id") REFERENCES "Authority_Company" ("id");

-- =========================
-- COMPLAINT
-- =========================

CREATE TABLE "Complaint" (
    "id" BIGINT NOT NULL,
    "citizen_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DECIMAL(15,6) NOT NULL,
    "longitude" DECIMAL(15,6) NOT NULL,
    "current_status" VARCHAR(20) DEFAULT 'pending',
    "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

ALTER TABLE "Complaint" ADD PRIMARY KEY ("id");
ALTER TABLE "Complaint"
ADD CONSTRAINT "complaint_citizen_id_foreign"
FOREIGN KEY ("citizen_id") REFERENCES "Citizen" ("id");
ALTER TABLE "Complaint"
ADD CONSTRAINT "complaint_category_id_foreign"
FOREIGN KEY ("category_id") REFERENCES "Category" ("id");

-- =========================
-- COMPLAINT IMAGES (AI PRIVACY)
-- =========================

CREATE TABLE "Complaint_Images" (
    "id" BIGINT NOT NULL,
    "complaint_id" BIGINT NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "processed_image_url" VARCHAR(255) NOT NULL,
    "ai_confidence" DECIMAL(5,2),
    "detected_category" TEXT
);

ALTER TABLE "Complaint_Images" ADD PRIMARY KEY ("id");
ALTER TABLE "Complaint_Images"
ADD CONSTRAINT "complaint_images_complaint_id_foreign"
FOREIGN KEY ("complaint_id") REFERENCES "Complaint" ("id");

-- =========================
-- COMPLAINT STATUS HISTORY
-- =========================

CREATE TABLE "Complaint_Status" (
    "id" BIGINT NOT NULL,
    "complaint_id" BIGINT NOT NULL,
    "status" VARCHAR(20) CHECK (
        "status" IN ('pending','accepted','resolved','appealed','completed')
    ) NOT NULL,
    "changed_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

ALTER TABLE "Complaint_Status" ADD PRIMARY KEY ("id");
ALTER TABLE "Complaint_Status"
ADD CONSTRAINT "complaint_status_complaint_id_foreign"
FOREIGN KEY ("complaint_id") REFERENCES "Complaint" ("id");

-- =========================
-- ASSIGNMENT
-- =========================

CREATE TABLE "Assignment" (
    "id" BIGINT NOT NULL,
    "complaint_id" BIGINT NOT NULL,
    "authority_id" BIGINT NOT NULL,
    "assigned_by" UUID NOT NULL,
    "assigned_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "due_date" TIMESTAMP WITHOUT TIME ZONE,
    "completed_at" TIMESTAMP WITHOUT TIME ZONE
);

ALTER TABLE "Assignment" ADD PRIMARY KEY ("id");
ALTER TABLE "Assignment"
ADD CONSTRAINT "assignment_complaint_id_foreign"
FOREIGN KEY ("complaint_id") REFERENCES "Complaint" ("id");
ALTER TABLE "Assignment"
ADD CONSTRAINT "assignment_authority_id_foreign"
FOREIGN KEY ("authority_id") REFERENCES "Authority" ("id");
ALTER TABLE "Assignment"
ADD CONSTRAINT "assignment_assigned_by_foreign"
FOREIGN KEY ("assigned_by") REFERENCES "Users" ("id");

-- =========================
-- RESOLUTION
-- =========================

CREATE TABLE "Resolution" (
    "id" BIGINT NOT NULL,
    "authority_id" BIGINT NOT NULL,
    "complaint_id" BIGINT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

ALTER TABLE "Resolution" ADD PRIMARY KEY ("id");
ALTER TABLE "Resolution"
ADD CONSTRAINT "resolution_authority_id_foreign"
FOREIGN KEY ("authority_id") REFERENCES "Authority" ("id");
ALTER TABLE "Resolution"
ADD CONSTRAINT "resolution_complaint_id_foreign"
FOREIGN KEY ("complaint_id") REFERENCES "Complaint" ("id");

-- =========================
-- RESOLUTION IMAGES
-- =========================

CREATE TABLE "Resolution_Images" (
    "id" BIGINT NOT NULL,
    "resolution_id" BIGINT NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "processed_image_url" VARCHAR(255) NOT NULL
);

ALTER TABLE "Resolution_Images" ADD PRIMARY KEY ("id");
ALTER TABLE "Resolution_Images"
ADD CONSTRAINT "resolution_images_resolution_id_foreign"
FOREIGN KEY ("resolution_id") REFERENCES "Resolution" ("id");

-- =========================
-- RESOLUTION STATUS
-- =========================

CREATE TABLE "Resolution_Status" (
    "id" BIGINT NOT NULL,
    "resolution_id" BIGINT NOT NULL,
    "status" VARCHAR(20) CHECK (
        "status" IN ('submitted', 'completed', 'appealed', 'rejected')
    ) NOT NULL,
    "changed_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

ALTER TABLE "Resolution_Status" ADD PRIMARY KEY ("id");

ALTER TABLE "Resolution_Status"
ADD CONSTRAINT "resolution_status_resolution_id_foreign"
FOREIGN KEY ("resolution_id") REFERENCES "Resolution" ("id");


-- =========================
-- UPVOTES (MANY-TO-MANY)
-- =========================

CREATE TABLE "Upvotes" (
    "citizen_id" BIGINT NOT NULL,
    "complaint_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

ALTER TABLE "Upvotes"
ADD PRIMARY KEY ("citizen_id", "complaint_id");
ALTER TABLE "Upvotes"
ADD CONSTRAINT "upvotes_citizen_id_foreign"
FOREIGN KEY ("citizen_id") REFERENCES "Citizen" ("id");
ALTER TABLE "Upvotes"
ADD CONSTRAINT "upvotes_complaint_id_foreign"
FOREIGN KEY ("complaint_id") REFERENCES "Complaint" ("id");

-- =========================
-- APPEAL
-- =========================

CREATE TABLE "Appeal_Resolution" (
    "id" BIGINT NOT NULL,
    "citizen_id" BIGINT NOT NULL,
    "resolution_id" BIGINT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

ALTER TABLE "Appeal_Resolution" ADD PRIMARY KEY ("id");

ALTER TABLE "Appeal_Resolution"
ADD CONSTRAINT "appeal_resolution_citizen_id_foreign"
FOREIGN KEY ("citizen_id") REFERENCES "Citizen" ("id");

ALTER TABLE "Appeal_Resolution"
ADD CONSTRAINT "appeal_resolution_resolution_id_foreign"
FOREIGN KEY ("resolution_id") REFERENCES "Resolution" ("id");

-- =========================
-- APPEAL IMAGES
-- =========================

CREATE TABLE "Appeal_Images" (
    "id" BIGINT NOT NULL,
    "appeal_id" BIGINT NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "processed_image_url" VARCHAR(255) NOT NULL
);

ALTER TABLE "Appeal_Images" ADD PRIMARY KEY ("id");

ALTER TABLE "Appeal_Images"
ADD CONSTRAINT "appeal_images_appeal_id_foreign"
FOREIGN KEY ("appeal_id") REFERENCES "Appeal_Resolution" ("id");

-- =========================
-- APPEAL STATUS
-- =========================

CREATE TABLE "Appeal_Status" (
    "id" BIGINT NOT NULL,
    "appeal_id" BIGINT NOT NULL,
    "status" VARCHAR(20) CHECK (
        "status" IN ('pending','reviewed','resolved','completed')
    ) NOT NULL,
    "changed_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

ALTER TABLE "Appeal_Status" ADD PRIMARY KEY ("id");

ALTER TABLE "Appeal_Status"
ADD CONSTRAINT "appeal_status_appeal_id_foreign"
FOREIGN KEY ("appeal_id") REFERENCES "Appeal_Resolution" ("id");

-- =========================================================
-- END OF SCHEMA
-- =========================================================
