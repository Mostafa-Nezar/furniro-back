const Joi = require('joi');

exports.signinSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

exports.googleSignInSchema = Joi.object({
    token: Joi.string().required()
});

exports.updateLocationSchema = Joi.object({
    location: Joi.string().required()
});

exports.updatePhoneNumberSchema = Joi.object({
    phoneNumber: Joi.string().required()
});

