/**
 * REIGN API - Input Validation Middleware
 * Uses express-validator for robust input validation
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 * Returns standardized error response
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// ==========================================
// AUTH VALIDATORS
// ==========================================

const registerValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
        .escape(),
    handleValidationErrors
];

const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    body('rememberMe')
        .optional()
        .isBoolean().withMessage('rememberMe must be a boolean'),
    handleValidationErrors
];

const passwordChangeValidation = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
        .matches(/[a-zA-Z]/).withMessage('New password must contain at least one letter')
        .matches(/[0-9]/).withMessage('New password must contain at least one number'),
    handleValidationErrors
];

const profileUpdateValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
        .escape(),
    handleValidationErrors
];

const passwordResetRequestValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    handleValidationErrors
];

const passwordResetValidation = [
    body('token')
        .notEmpty().withMessage('Reset token is required')
        .isLength({ min: 32 }).withMessage('Invalid reset token'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    handleValidationErrors
];

const securityQuestionValidation = [
    body('question')
        .trim()
        .notEmpty().withMessage('Security question is required')
        .isLength({ min: 10, max: 255 }).withMessage('Question must be 10-255 characters'),
    body('answer')
        .trim()
        .notEmpty().withMessage('Security answer is required')
        .isLength({ min: 2, max: 100 }).withMessage('Answer must be 2-100 characters'),
    handleValidationErrors
];

// ==========================================
// GOALS VALIDATORS
// ==========================================

const GOAL_CATEGORIES = ['health', 'career', 'finance', 'relationships', 'growth', 'passion', 'spiritual'];
const GOAL_TYPES = ['yearly', 'monthly', 'weekly'];
const GOAL_STATUSES = ['active', 'completed', 'abandoned'];

const createGoalValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 1, max: 255 }).withMessage('Title must be 1-255 characters')
        .escape(),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Description must be under 2000 characters'),
    body('category')
        .notEmpty().withMessage('Category is required')
        .isIn(GOAL_CATEGORIES).withMessage(`Category must be one of: ${GOAL_CATEGORIES.join(', ')}`),
    body('type')
        .notEmpty().withMessage('Type is required')
        .isIn(GOAL_TYPES).withMessage(`Type must be one of: ${GOAL_TYPES.join(', ')}`),
    body('progress')
        .optional()
        .isInt({ min: 0, max: 100 }).withMessage('Progress must be 0-100'),
    body('targetDate')
        .optional()
        .isISO8601().withMessage('Invalid date format'),
    body('parentGoalId')
        .optional()
        .isUUID().withMessage('Invalid parent goal ID'),
    handleValidationErrors
];

const updateGoalValidation = [
    param('id')
        .isUUID().withMessage('Invalid goal ID'),
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 }).withMessage('Title must be 1-255 characters')
        .escape(),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Description must be under 2000 characters'),
    body('category')
        .optional()
        .isIn(GOAL_CATEGORIES).withMessage(`Category must be one of: ${GOAL_CATEGORIES.join(', ')}`),
    body('status')
        .optional()
        .isIn(GOAL_STATUSES).withMessage(`Status must be one of: ${GOAL_STATUSES.join(', ')}`),
    body('progress')
        .optional()
        .isInt({ min: 0, max: 100 }).withMessage('Progress must be 0-100'),
    handleValidationErrors
];

const goalIdValidation = [
    param('id')
        .isUUID().withMessage('Invalid goal ID'),
    handleValidationErrors
];

// ==========================================
// FEEDBACK VALIDATORS
// ==========================================

const feedbackValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Name must be 2-255 characters')
        .escape(),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('message')
        .trim()
        .notEmpty().withMessage('Message is required')
        .isLength({ min: 10, max: 5000 }).withMessage('Message must be 10-5000 characters'),
    body('rating')
        .optional()
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('persona')
        .optional()
        .isIn(['king', 'queen']).withMessage('Persona must be king or queen'),
    handleValidationErrors
];

// ==========================================
// SYNC VALIDATORS
// ==========================================

const syncDataValidation = [
    body('data')
        .notEmpty().withMessage('Data is required')
        .isObject().withMessage('Data must be an object'),
    body('data.lastUpdated')
        .optional()
        .isISO8601().withMessage('Invalid lastUpdated format'),
    handleValidationErrors
];

// ==========================================
// ADMIN VALIDATORS
// ==========================================

const userIdValidation = [
    param('userId')
        .isUUID().withMessage('Invalid user ID'),
    handleValidationErrors
];

const updateUserStatusValidation = [
    param('userId')
        .isUUID().withMessage('Invalid user ID'),
    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['active', 'suspended', 'banned']).withMessage('Invalid status'),
    handleValidationErrors
];

const updateUserRoleValidation = [
    param('userId')
        .isUUID().withMessage('Invalid user ID'),
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
    handleValidationErrors
];

const announcementValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 1, max: 255 }).withMessage('Title must be 1-255 characters')
        .escape(),
    body('message')
        .trim()
        .notEmpty().withMessage('Message is required')
        .isLength({ min: 1, max: 5000 }).withMessage('Message must be 1-5000 characters'),
    body('target')
        .optional()
        .isIn(['all', 'users', 'admins']).withMessage('Invalid target'),
    handleValidationErrors
];

// ==========================================
// RELATIONSHIPS VALIDATORS
// ==========================================

const PURPOSE_TYPES = ['family', 'friend', 'mentor', 'romantic', 'colleague', 'other'];
const CLASSIFICATION_TYPES = ['burden_bearer', 'divine_connector', 'influential', 'talented'];

const createRelationshipValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters')
        .escape(),
    body('gender')
        .notEmpty().withMessage('Gender is required')
        .isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('purpose')
        .notEmpty().withMessage('Purpose is required')
        .isIn(PURPOSE_TYPES).withMessage(`Purpose must be one of: ${PURPOSE_TYPES.join(', ')}`),
    body('classification')
        .optional()
        .isIn(CLASSIFICATION_TYPES).withMessage(`Classification must be one of: ${CLASSIFICATION_TYPES.join(', ')}`),
    body('whatTheyDid')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Description must be under 2000 characters'),
    handleValidationErrors
];

const updateRelationshipValidation = [
    param('id')
        .isUUID().withMessage('Invalid relationship ID'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters')
        .escape(),
    body('classification')
        .optional()
        .isIn([...CLASSIFICATION_TYPES, null]).withMessage('Invalid classification'),
    handleValidationErrors
];

const relationshipIdValidation = [
    param('id')
        .isUUID().withMessage('Invalid relationship ID'),
    handleValidationErrors
];

module.exports = {
    // Auth
    registerValidation,
    loginValidation,
    passwordChangeValidation,
    profileUpdateValidation,
    passwordResetRequestValidation,
    passwordResetValidation,
    securityQuestionValidation,
    
    // Goals
    createGoalValidation,
    updateGoalValidation,
    goalIdValidation,
    
    // Feedback
    feedbackValidation,
    
    // Sync
    syncDataValidation,
    
    // Admin
    userIdValidation,
    updateUserStatusValidation,
    updateUserRoleValidation,
    announcementValidation,
    
    // Relationships
    createRelationshipValidation,
    updateRelationshipValidation,
    relationshipIdValidation,
    
    // Constants for reuse
    GOAL_CATEGORIES,
    GOAL_TYPES,
    GOAL_STATUSES,
    PURPOSE_TYPES,
    CLASSIFICATION_TYPES
};
