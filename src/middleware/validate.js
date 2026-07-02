module.exports = (schema, property = 'body') => (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        console.error("❌ Validation Error Details:", JSON.stringify(error.details, null, 2));
        return res.status(400).json({
            msg: 'middleware: Validation error',
            details: error.details.map(d => ({ message: d.message, path: d.path })),
        });
    }
    req[property] = value;
    next();
};
