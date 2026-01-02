const Joi = require('joi');

exports.createOrderSchema = Joi.object({
    userId: Joi.number().integer().required(),
    products: Joi.array().items(
        Joi.object({
            id: Joi.number().integer().required(),
            quantity: Joi.number().integer().min(1).required()
        })
    ).min(1).required(),
    date: Joi.string().required(),
    total: Joi.number().min(0).required(),
    payment: Joi.object().optional(),
    customerInfo: Joi.object().optional(),
    deliveryDate: Joi.string().optional(),
    userlocation: Joi.string().optional()
});

exports.updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid('pending', 'refused', 'shipping', 'delivered', 'cancelled').required()
});

