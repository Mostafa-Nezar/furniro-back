const Joi = require('joi');

exports.addRatingSchema = Joi.object({
    productid: Joi.number().integer().required(),
    rate: Joi.number().integer().min(0).max(5).required(),
    comment: Joi.string().max(1000).allow('', null).optional()
});
