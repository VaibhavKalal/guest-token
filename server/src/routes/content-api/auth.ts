export default [
  {
    method: 'POST',
    path: '/token',
    handler: 'auth.token',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/refresh-token',
    handler: 'auth.refreshToken',
    config: {
      policies: [],
      auth: false,
    },
  },
];
