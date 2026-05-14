import jwt from "jsonwebtoken";

const protect = async (
  req,
  res,
  next
) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith(
      "Bearer"
    )
  ) {
    try {
      token =
        req.headers.authorization.split(
          " "
        )[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      req.user = decoded.id;

      next();
    } catch (error) {
      res.status(401);

      throw new Error(
        "Not authorized"
      );
    }
  }

  if (!token) {
    res.status(401);

    throw new Error(
      "No token found"
    );
  }
};

export { protect };