/**
 * REIGN API - Goals Routes
 * CRUD operations for goals and reviews
 */

const express = require('express');
const router = express.Router();
const auth = require('../lib/auth');
const db = require('../lib/database');
const {
    createGoalValidation,
    updateGoalValidation,
    goalIdValidation,
    GOAL_CATEGORIES,
    GOAL_TYPES,
    GOAL_STATUSES
} = require('../middleware/validators');

// Review types constant (not in validators)
const REVIEW_TYPES = ['weekly', 'monthly'];

// ==========================================
// GOALS ROUTES
// ==========================================

/**
 * GET /api/goals
 * Get all goals for user, optionally filtered by type
 */
router.get('/', auth.authMiddleware, async (req, res) => {
    try {
        const { type, status, category } = req.query;

        let query = `
            SELECT id, title, description, category, type, parent_goal_id as "parentGoalId",
                   progress, target_date as "targetDate", status, notes,
                   created_at as "createdAt", updated_at as "updatedAt"
            FROM goals
            WHERE user_id = $1
        `;
        const params = [req.user.id];
        let paramIndex = 2;

        if (type && GOAL_TYPES.includes(type)) {
            query += ` AND type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        if (status && GOAL_STATUSES.includes(status)) {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (category && GOAL_CATEGORIES.includes(category)) {
            query += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC`;

        const result = await db.query(query, params);

        res.json({
            goals: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({ error: 'Failed to get goals' });
    }
});

/**
 * GET /api/goals/stats
 * Get goal completion statistics
 */
router.get('/stats', auth.authMiddleware, async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                type,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) FILTER (WHERE status = 'active') as active,
                ROUND(AVG(progress)) as avg_progress
            FROM goals
            WHERE user_id = $1
            GROUP BY type
        `;

        const categoryQuery = `
            SELECT 
                category,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'completed') as completed
            FROM goals
            WHERE user_id = $1
            GROUP BY category
        `;

        const [statsResult, categoryResult] = await Promise.all([
            db.query(statsQuery, [req.user.id]),
            db.query(categoryQuery, [req.user.id])
        ]);

        const stats = {
            byType: {},
            byCategory: {},
            overall: {
                total: 0,
                completed: 0,
                active: 0,
                avgProgress: 0
            }
        };

        // Process type stats
        statsResult.rows.forEach(row => {
            stats.byType[row.type] = {
                total: parseInt(row.total),
                completed: parseInt(row.completed),
                active: parseInt(row.active),
                avgProgress: parseInt(row.avg_progress) || 0
            };
            stats.overall.total += parseInt(row.total);
            stats.overall.completed += parseInt(row.completed);
            stats.overall.active += parseInt(row.active);
        });

        // Calculate overall average
        if (stats.overall.total > 0) {
            const totalProgress = statsResult.rows.reduce((sum, row) => {
                return sum + (parseInt(row.avg_progress) || 0) * parseInt(row.total);
            }, 0);
            stats.overall.avgProgress = Math.round(totalProgress / stats.overall.total);
        }

        // Process category stats
        categoryResult.rows.forEach(row => {
            stats.byCategory[row.category] = {
                total: parseInt(row.total),
                completed: parseInt(row.completed)
            };
        });

        res.json(stats);
    } catch (error) {
        console.error('Get goal stats error:', error);
        res.status(500).json({ error: 'Failed to get goal statistics' });
    }
});

/**
 * GET /api/goals/:id
 * Get single goal by ID
 */
router.get('/:id', auth.authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, title, description, category, type, parent_goal_id as "parentGoalId",
                    progress, target_date as "targetDate", status, notes,
                    created_at as "createdAt", updated_at as "updatedAt"
             FROM goals
             WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get goal error:', error);
        res.status(500).json({ error: 'Failed to get goal' });
    }
});

/**
 * POST /api/goals
 * Create new goal
 */
router.post('/', auth.authMiddleware, createGoalValidation, async (req, res) => {
    try {
        const { title, description, category, type, parentGoalId, targetDate, notes } = req.body;

        // Validation done by middleware
        const result = await db.query(
            `INSERT INTO goals (user_id, title, description, category, type, parent_goal_id, target_date, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, title, description, category, type, parent_goal_id as "parentGoalId",
                       progress, target_date as "targetDate", status, notes,
                       created_at as "createdAt", updated_at as "updatedAt"`,
            [req.user.id, title.trim(), description || null, category, type, parentGoalId || null, targetDate || null, notes || null]
        );

        // Log audit
        await auth.logAudit(req.user.id, 'GOAL_CREATE', { goalId: result.rows[0].id, type, category });

        res.status(201).json({
            message: 'Goal created successfully',
            goal: result.rows[0]
        });
    } catch (error) {
        console.error('Create goal error:', error);
        res.status(500).json({ error: 'Failed to create goal' });
    }
});

/**
 * PUT /api/goals/:id
 * Update goal
 */
router.put('/:id', auth.authMiddleware, updateGoalValidation, async (req, res) => {
    try {
        const { title, description, category, type, parentGoalId, progress, targetDate, status, notes } = req.body;

        // Check goal exists and belongs to user
        const existing = await db.query(
            'SELECT id FROM goals WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        // Build update query dynamically
        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (title !== undefined) {
            updates.push(`title = $${paramIndex}`);
            params.push(title.trim());
            paramIndex++;
        }
        if (description !== undefined) {
            updates.push(`description = $${paramIndex}`);
            params.push(description);
            paramIndex++;
        }
        if (category !== undefined) {
            if (!GOAL_CATEGORIES.includes(category)) {
                return res.status(400).json({ error: 'Invalid category' });
            }
            updates.push(`category = $${paramIndex}`);
            params.push(category);
            paramIndex++;
        }
        if (type !== undefined) {
            if (!GOAL_TYPES.includes(type)) {
                return res.status(400).json({ error: 'Invalid type' });
            }
            updates.push(`type = $${paramIndex}`);
            params.push(type);
            paramIndex++;
        }
        if (parentGoalId !== undefined) {
            updates.push(`parent_goal_id = $${paramIndex}`);
            params.push(parentGoalId);
            paramIndex++;
        }
        if (progress !== undefined) {
            if (progress < 0 || progress > 100) {
                return res.status(400).json({ error: 'Progress must be between 0 and 100' });
            }
            updates.push(`progress = $${paramIndex}`);
            params.push(progress);
            paramIndex++;
        }
        if (targetDate !== undefined) {
            updates.push(`target_date = $${paramIndex}`);
            params.push(targetDate);
            paramIndex++;
        }
        if (status !== undefined) {
            if (!GOAL_STATUSES.includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }
            updates.push(`status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }
        if (notes !== undefined) {
            updates.push(`notes = $${paramIndex}`);
            params.push(notes);
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push(`updated_at = now()`);
        params.push(req.params.id);
        params.push(req.user.id);

        const result = await db.query(
            `UPDATE goals SET ${updates.join(', ')}
             WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
             RETURNING id, title, description, category, type, parent_goal_id as "parentGoalId",
                       progress, target_date as "targetDate", status, notes,
                       created_at as "createdAt", updated_at as "updatedAt"`,
            params
        );

        res.json({
            message: 'Goal updated successfully',
            goal: result.rows[0]
        });
    } catch (error) {
        console.error('Update goal error:', error);
        res.status(500).json({ error: 'Failed to update goal' });
    }
});

/**
 * POST /api/goals/:id/progress
 * Quick update goal progress
 */
router.post('/:id/progress', auth.authMiddleware, async (req, res) => {
    try {
        const { progress } = req.body;

        if (progress === undefined || progress < 0 || progress > 100) {
            return res.status(400).json({ error: 'Progress must be between 0 and 100' });
        }

        // Determine status based on progress
        const status = progress >= 100 ? 'completed' : 'active';

        const result = await db.query(
            `UPDATE goals SET progress = $1, status = $2, updated_at = now()
             WHERE id = $3 AND user_id = $4
             RETURNING id, title, progress, status`,
            [progress, status, req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json({
            message: progress >= 100 ? 'Goal completed! 🎉' : 'Progress updated',
            goal: result.rows[0]
        });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

/**
 * DELETE /api/goals/:id
 * Delete goal
 */
router.delete('/:id', auth.authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id, title',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        await auth.logAudit(req.user.id, 'GOAL_DELETE', { goalId: req.params.id });

        res.json({
            message: 'Goal deleted successfully',
            deleted: result.rows[0]
        });
    } catch (error) {
        console.error('Delete goal error:', error);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});

// ==========================================
// REVIEWS ROUTES
// ==========================================

/**
 * GET /api/goals/reviews
 * Get review history
 */
router.get('/reviews/list', auth.authMiddleware, async (req, res) => {
    try {
        const { type, limit = 10 } = req.query;

        let query = `
            SELECT id, review_type as "reviewType", period_start as "periodStart",
                   period_end as "periodEnd", goals_completed as "goalsCompleted",
                   goals_total as "goalsTotal", wins, challenges, lessons,
                   next_focus as "nextFocus", mood, created_at as "createdAt"
            FROM goal_reviews
            WHERE user_id = $1
        `;
        const params = [req.user.id];

        if (type && REVIEW_TYPES.includes(type)) {
            query += ` AND review_type = $2`;
            params.push(type);
        }

        query += ` ORDER BY period_end DESC LIMIT $${params.length + 1}`;
        params.push(parseInt(limit));

        const result = await db.query(query, params);

        res.json({
            reviews: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: 'Failed to get reviews' });
    }
});

/**
 * POST /api/goals/reviews
 * Submit weekly/monthly review
 */
router.post('/reviews', auth.authMiddleware, async (req, res) => {
    try {
        const { reviewType, periodStart, periodEnd, goalsCompleted, goalsTotal, wins, challenges, lessons, nextFocus, mood } = req.body;

        // Validate
        if (!REVIEW_TYPES.includes(reviewType)) {
            return res.status(400).json({ error: 'Invalid review type' });
        }
        if (!periodStart || !periodEnd) {
            return res.status(400).json({ error: 'Period start and end dates are required' });
        }

        const result = await db.query(
            `INSERT INTO goal_reviews (user_id, review_type, period_start, period_end, goals_completed, goals_total, wins, challenges, lessons, next_focus, mood)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING id, review_type as "reviewType", period_start as "periodStart",
                       period_end as "periodEnd", goals_completed as "goalsCompleted",
                       goals_total as "goalsTotal", wins, challenges, lessons,
                       next_focus as "nextFocus", mood, created_at as "createdAt"`,
            [req.user.id, reviewType, periodStart, periodEnd, goalsCompleted || 0, goalsTotal || 0, wins || null, challenges || null, lessons || null, nextFocus || null, mood || null]
        );

        await auth.logAudit(req.user.id, 'REVIEW_SUBMIT', { reviewType, periodEnd });

        res.status(201).json({
            message: `${reviewType.charAt(0).toUpperCase() + reviewType.slice(1)} review submitted! 📝`,
            review: result.rows[0]
        });
    } catch (error) {
        console.error('Submit review error:', error);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

module.exports = router;
