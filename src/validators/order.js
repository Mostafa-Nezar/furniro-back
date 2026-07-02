const Joi = require('joi');

exports.createOrderSchema = Joi.object({
    userId: Joi.number().integer().required(),
    products: Joi.array().items(
        Joi.object({
            id: Joi.number().integer().required(),
            productId: Joi.string().allow(null, '').optional(),
            name: Joi.string().required(),
            price: Joi.number().min(0).required(),
            quantity: Joi.number().integer().min(1).required(),
            image: Joi.string().allow(null, '').optional(),
            size: Joi.string().allow(null, '').optional(),
            color: Joi.string().allow(null, '').optional(),
            variant: Joi.object().optional()
        })
    ).min(1).required(),
    date: Joi.string().required(),
    total: Joi.number().min(0).required(),
    payment: Joi.object({
        method: Joi.string().allow(null, '').optional(),
        status: Joi.string().allow(null, '').optional()
    }).unknown(true).optional(),
    customerInfo: Joi.object({
        fullName: Joi.string().allow(null, '').optional(),
        email: Joi.string().allow(null, '').optional(),
        address: Joi.string().allow(null, '').optional(),
        city: Joi.string().allow(null, '').optional(),
        state: Joi.string().allow(null, '').optional(),
        zipCode: Joi.string().allow(null, '').optional(),
        phoneNumber: Joi.any().optional()
    }).unknown(true).optional(),
    deliveryDate: Joi.string().allow(null, '').optional(),
    userlocation: Joi.string().allow(null, '').optional()
});

exports.updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid('pending', 'refused', 'shipping', 'delivered', 'cancelled').required()
});

