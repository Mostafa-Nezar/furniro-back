const Joi = require('joi');

exports.addRatingSchema = Joi.object({
    userid: Joi.number().integer().required(),
    userref: Joi.string().optional(),
    productid: Joi.number().integer().required(),
    productref: Joi.string().optional(),
    rateid: Joi.string().required(),
    rate: Joi.number().integer().min(0).max(5).required(),
    comment: Joi.string().max(1000).optional()
});

