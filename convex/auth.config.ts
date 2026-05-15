export default {
  providers: [
    {
      domain: process.env.SUPABASE_AUTH_ISSUER,
      applicationID: "authenticated",
    },
  ],
};
