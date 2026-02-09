const db = require('../config/db');

const auditMiddleware = (action, entityType) => {
  return async (req, res, next) => {
    // We hook into the response finish event to log only successful operations if needed,
    // or log everything. For now, let's log after the operation.
    // However, capturing the "entity_id" might be tricky if it's created during the request.
    // A better approach for audit logs is often within the controller or a service wrapper.
    // But as a middleware, we can log the *attempt* or simpler details.
    
    // For this implementation, we will attach a logger helper to the req object
    // so controllers can call it with specific details (like the created ID).
    
    req.audit = async ({ entityId, oldValues, newValues, notes }) => {
      try {
        if (!req.user) return; // specific for authenticated actions

        const query = `
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const values = [
            req.user.id,
            action,
            entityType,
            entityId || null,
            oldValues ? JSON.stringify(oldValues) : null,
            newValues ? JSON.stringify(newValues) : null,
            req.ip
        ];
        
        await db.query(query, values);
      } catch (err) {
        console.error('Audit logging failed:', err);
        // Don't block the response flow for logging errors
      }
    };

    next();
  };
};

module.exports = auditMiddleware;
