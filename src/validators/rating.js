const Joi = require('joi');

exports.addRatingSchema = Joi.object({
    userid: Joi.number().integer().required(),
    productid: Joi.number().integer().required(),
    rateid: Joi.string().required(),
    rate: Joi.number().integer().min(0).max(5).optional(),
    comment: Joi.string().max(1000).optional()
});

