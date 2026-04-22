import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import bcrypt from "bcryptjs";

// Custom Password provider: uses bcryptjs (cost 12) so we remain compatible
// with password hashes created by the previous Better-Auth setup.
const CustomPassword = Password({
  crypto: {
    async hashSecret(password: string) {
      return bcrypt.hash(password, 12);
    },
    async verifySecret(password: string, hash: string) {
      return bcrypt.compare(password, hash);
    },
  },
  profile(params) {
    return {
      email: params.email as string,
      name: (params.name as string | undefined) ?? "",
      isActive: true,
      isSuperAdmin: false,
    };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [CustomPassword],
});
