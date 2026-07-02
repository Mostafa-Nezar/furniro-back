const Joi = require('joi');

exports.createOrderSchema = Joi.object({
    userId: Joi.number().integer().required(),
    products: Joi.array().items(
        Joi.object({
            id: Joi.number().integer().required(),
            productId: Joi.string().optional(),
            name: Joi.string().required(),
            price: Joi.number().min(0).required(),
            quantity: Joi.number().integer().min(1).required(),
            image: Joi.string().optional(),
            size: Joi.string().optional(),
            color: Joi.string().optional(),
            variant: Joi.object().optional()
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

