/**
 * Formats backend errors into human-readable messages.
 * Handles SequelizeUniqueConstraintError, SequelizeValidationError, and DB errors.
 */
export function formatErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred';

  // Handling Sequelize Validation and Unique Constraint Errors
  if (
    error.name === 'SequelizeUniqueConstraintError' ||
    error.name === 'SequelizeValidationError'
  ) {
    if (Array.isArray(error.errors) && error.errors.length > 0) {
      const messages = error.errors.map((e: any) => {
        const fieldName = e.path ? e.path.replace(/_/g, ' ') : 'field';
        if (e.type === 'unique violation' || e.validatorKey === 'not_unique') {
          return `A record with this ${fieldName} ("${e.value}") already exists.`;
        }
        return e.message || `${fieldName} is invalid`;
      });
      return messages.join('; ');
    }
  }

  // Postgres native duplicate key error (SQL state 23505)
  if (error.code === '23505') {
    if (error.detail) {
      return error.detail;
    }
    return 'A record with this unique value already exists.';
  }

  // Fallback to standard message if message is not generic "Validation error"
  if (error.message && error.message !== 'Validation error') {
    return error.message;
  }

  return 'A database validation error occurred. Please check your inputs.';
}
