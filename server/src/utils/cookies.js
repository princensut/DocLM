const env = require("../config/env");

// httpOnly + Secure (in prod) + SameSite=Lax on both cookies.
// See EXCEPTION_HANDLING_AND_SECURITY.md §1.2.
const baseCookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: "lax",
  path: "/",
};

function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000, // matches JWT_ACCESS_EXPIRY default; cookie expiry is a UX nicety, JWT exp is the real boundary
  });
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth", // only sent to auth endpoints, reducing exposure surface
  });
}

function clearAuthCookies(res) {
  res.clearCookie("accessToken", { ...baseCookieOptions });
  res.clearCookie("refreshToken", { ...baseCookieOptions, path: "/api/auth" });
}

module.exports = { setAuthCookies, clearAuthCookies };
