const { z } = require("zod");

const validate = (schema) => (req, res, next) => {
    try {
        // Check if the schema is an object (Zod schema) or a function
        if (typeof schema.parse === "function") {
            schema.parse(req.body);
        } else {
            // Fallback if not a Zod schema object
            return res.status(500).json({ error: "Invalid validation schema" });
        }
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Format Zod errors into a readable object or array
            // const formattedErrors = error.errors.map((err) => ({
            //   field: err.path.join("."),
            //   message: err.message,
            // }));

            // Return the first error message for simplicity or full object
            return res.status(400).json({
                error: error.errors[0].message,
                details: error.errors
            });
        }
        next(error);
    }
};

module.exports = validate;
