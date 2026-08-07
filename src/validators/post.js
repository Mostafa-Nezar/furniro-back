const Joi = require('joi');
exports.addPostSchema = Joi.object({
  image: Joi.string().uri().max(1000).allow('', null),
  date: Joi.date().iso(),
  category: Joi.string().min(2).max(100).optional(),
  title: Joi.string().min(3).max(200).required(),
  content: Joi.string().min(10).max(10000).required(),
});
