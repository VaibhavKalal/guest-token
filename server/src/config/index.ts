export default {
  default: ({env}) => ({
    accessTokenLifetime: 60 * 60 * 24 * 15,
    refreshTokenLifetime: 60 * 60 * 24 * 15,
  }),
  validator() {},
};
