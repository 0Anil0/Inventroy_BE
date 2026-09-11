import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Unhandled Server Error:', err);
  let status = err.status || (err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeValidationError' ? 400 : 500);
  let message = err.message || 'Internal Server Error';

  if (err.name === 'SequelizeUniqueConstraintError' && err.errors && err.errors.length > 0) {
    const errorDetail = err.errors[0];
    const fieldName = (errorDetail.path || 'Field').replace(/_/g, ' ').toUpperCase();
    const val = errorDetail.value || '';
    message = `${fieldName} '${val}' already exists in the system! Please enter a unique value.`;
  } else if (err.name === 'SequelizeValidationError' && err.errors && err.errors.length > 0) {
    message = err.errors.map((e: any) => e.message).join(', ');
  }

  res.status(status).json({ success: false, message });
};
