import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const validateWorkOrder = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    title: Joi.string().required().min(3).max(255),
    description: Joi.string().optional().max(2000),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    asset_id: Joi.number().integer().positive().optional(),
    site_id: Joi.number().integer().positive().required(),
    type: Joi.string().valid('corrective', 'preventive', 'emergency', 'inspection').optional(),
    scheduled_date: Joi.date().iso().optional(),
    estimated_duration_minutes: Joi.number().integer().positive().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  next();
};

export const validateUserRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    first_name: Joi.string().required().min(2).max(100),
    last_name: Joi.string().required().min(2).max(100),
    role: Joi.string().valid('admin', 'facility_manager', 'technician', 'operations_director').required(),
    phone: Joi.string().optional().max(20),
    organization_name: Joi.string().required().min(2).max(255)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  next();
};

export const validateAsset = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    asset_tag: Joi.string().required().min(3).max(100),
    name: Joi.string().required().min(3).max(255),
    description: Joi.string().optional().max(2000),
    manufacturer: Joi.string().optional().max(100),
    model: Joi.string().optional().max(100),
    serial_number: Joi.string().optional().max(100),
    year_manufactured: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
    install_date: Joi.date().iso().optional(),
    warranty_expiry: Joi.date().iso().optional(),
    location_description: Joi.string().optional().max(500),
    criticality: Joi.string().valid('critical', 'important', 'normal', 'low').optional(),
    asset_category_id: Joi.number().integer().positive().required(),
    site_id: Joi.number().integer().positive().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  next();
};