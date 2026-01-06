const Joi = require('joi');

exports.signupSchema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phoneNumber: Joi.string().allow(null, '').optional()
});

exports.editUserSchema = Joi.object({
    name: Joi.string().min(3).optional(),
    email: Joi.string().email().optional(),
    phoneNumber: Joi.string().allow(null, '').optional(),
    location: Joi.string().allow('').optional(),
    isSubscribed: Joi.boolean().optional()
}).min(1); // At least one field must be provided
