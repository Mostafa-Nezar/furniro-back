const Joi = require('joi');

const productValidationSchema = Joi.object({
  name: Joi.string().required().messages({'string.empty': 'Name is required','any.required': 'Name is required'}),
  price: Joi.number().required().messages({'number.base': 'Price must be a valid number', 'any.required': 'Price is required'}),
  key: Joi.string().allow('', null).optional(),
  salePrice: Joi.number().less(Joi.ref('price')).allow(null).optional().messages({'number.less': 'Sale price must be strictly less than the regular price'}),
  category: Joi.string().allow('', null).optional(),
  colors: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  sizes: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  quantity: Joi.number().default(0).optional(),
  sale: Joi.number().default(0).optional(),
  des: Joi.string().allow('', null).optional(),
  general: Joi.object({
    salespackage: Joi.string().allow('', null).optional(),
    model: Joi.string().allow('', null).optional(),
    secondary: Joi.string().allow('', null).optional(),
    configuration: Joi.string().allow('', null).optional(),
    upholsterymaterial: Joi.string().allow('', null).optional(),
    upholsterycolor: Joi.string().allow('', null).optional()
  }).unknown(true).optional(),
  
  myproduct: Joi.object({
    fillingmaterial: Joi.string().allow('', null).optional(),
    finishtype: Joi.string().allow('', null).optional(),
    adjustableheadrest: Joi.string().allow('', null).optional(),
    maximumloadcapacity: Joi.string().allow('', null).optional(),
    originalofmanufacture: Joi.string().allow('', null).optional()
  }).unknown(true).optional(),
  
  dimensions: Joi.object({
    width: Joi.string().allow('', null).optional(),
    height: Joi.string().allow('', null).optional(),
    depth: Joi.string().allow('', null).optional(),
    weight: Joi.string().allow('', null).optional(),
    seatheight: Joi.string().allow('', null).optional(),
    legheight: Joi.string().allow('', null).optional()
  }).unknown(true).optional(),
  
  warranty: Joi.object({
    summary: Joi.string().allow('', null).optional(),
    servicetype: Joi.string().allow('', null).optional(),
    dominstic: Joi.string().allow('', null).optional(),
    covered: Joi.string().allow('', null).optional(),
    notcovered: Joi.string().allow('', null).optional()
  }).unknown(true).optional(),
  
  customAttributes: Joi.object().unknown(true).optional()
});

const validateProduct = (req, res, next) => {
  const { error } = productValidationSchema.validate(req.body, { abortEarly: false, allowUnknown: true });
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: error.details.map(err => err.message)
    });
  }
  
  next();
};

module.exports = {
  productValidationSchema,
  validateProduct
};