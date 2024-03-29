// JWT
const jwt = require("jsonwebtoken");

module.exports = {
  jwtSign: (admin,serverType) => {
    const token = jwt.sign(
      {
        adminId: admin._id,
        user_type: admin.user_type,
        user_name: admin.user_name,
        profile: admin.profile,
        email: admin.email,
        location: admin.cpc,
        name: admin.name,
        warehouse: admin.warehouse,
        cpc_type: admin.cpc_type,
        serverType:serverType,
      },
      "prexoprojectv1jwttokenaccessf9933one"
    );
    return token;
  },
  jwtVerfiy: ({ req, res }) => {
    try {
      let token = req.headers["x-access-token"];
      const tokenCheck = jwt.verify(
        token,
        "prexoprojectv1jwttokenaccessf9933one"
      );
      if (tokenCheck) {
        return { status: true, message: "Valid Token" };
      } else {
        res.status(401).json({ message: "UnAuthorized" });
      }
    } catch (error) {
      return error;
    }
  },
};
