/** Resolve the authenticated user's id from stored session payload. */
export const getUserId = (userInfo = null) => {
  const info =
    userInfo ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem("userInfo"));
      } catch {
        return null;
      }
    })();

  return info?._id || info?.id || null;
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userInfo"));
  } catch {
    return null;
  }
};
