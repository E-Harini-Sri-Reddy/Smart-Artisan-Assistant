const validateRequiredFields = (
  fields
) => {
  return (req, res, next) => {
    for (const field of fields) {
      if (!req.body[field]) {
        return res.status(400).json({
          message: `${field} is required`,
        });
      }
    }

    next();
  };
};

export {
  validateRequiredFields,
};