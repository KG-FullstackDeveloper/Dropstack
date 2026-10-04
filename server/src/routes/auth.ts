import { Hono } from "hono";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { db } from "../database/db";
import {
  authMiddleware,
  type AuthVariables,
} from "../middleware/auth";

interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string | null;
  two_factor_enabled: number;
  created_at: string;
  updated_at: string;
}

interface AuthCode {
  id: string;
  admin_id: string;
  code_hash: string;
  purpose: string;
  expires_at: string;
  attempts: number;
  max_attempts: number;
  used_at: string | null;
  created_at: string;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is required. Configure it in server/.env before starting the API."
  );
}

const auth = new Hono<{
  Variables: AuthVariables;
}>();

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;

const CODE_MAX_ATTEMPTS = 5;
const CODE_EXPIRY_MINUTES = 10;

const PASSWORD_MIN_LENGTH = 12;

function nowIso(): string {
  return new Date().toISOString();
}

function addMinutes(minutes: number): string {
  return new Date(
    Date.now() + minutes * 60 * 1000
  ).toISOString();
}

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function generateSixDigitCode(): string {
  return String(
    crypto.randomInt(100000, 1000000)
  );
}

function hashCode(code: string): string {
  return crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
}

function getClientIp(c: any): string | null {
  const forwarded =
    c.req.header("x-forwarded-for");

  if (forwarded) {
    return (
      forwarded
        .split(",")[0]
        ?.trim() || null
    );
  }

  return (
    c.req.header("x-real-ip") ||
    null
  );
}

function getUserAgent(c: any): string | null {
  return (
    c.req.header("user-agent") ||
    null
  );
}

function createJwt(admin: AdminUser): string {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    },
    JWT_SECRET as string,
    {
      expiresIn: "7d",
    }
  );
}

function publicAdmin(admin: AdminUser) {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
    twoFactorEnabled:
      admin.two_factor_enabled === 1,
    createdAt: admin.created_at,
    updatedAt: admin.updated_at,
  };
}

function recordLoginEvent(
  adminId: string | null,
  email: string,
  eventType: string,
  ipAddress: string | null,
  userAgent: string | null
) {
  db.prepare(`
    INSERT INTO login_events (
      id,
      admin_id,
      email,
      event_type,
      ip_address,
      user_agent,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId("login"),
    adminId,
    email,
    eventType,
    ipAddress,
    userAgent,
    nowIso()
  );
}

function getRateLimit(
  key: string,
  action: string
) {
  return db
    .prepare(`
      SELECT
        id,
        key,
        action,
        attempts,
        window_started_at,
        locked_until,
        created_at,
        updated_at
      FROM auth_rate_limits
      WHERE key = ?
        AND action = ?
      LIMIT 1
    `)
    .get(
      key,
      action
    ) as
    | {
        id: string;
        key: string;
        action: string;
        attempts: number;
        window_started_at: string;
        locked_until: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;
}

function isLocked(
  limit:
    | {
        locked_until: string | null;
      }
    | undefined
): boolean {
  if (!limit?.locked_until) {
    return false;
  }

  return (
    new Date(
      limit.locked_until
    ).getTime() > Date.now()
  );
}

function checkRateLimit(
  key: string,
  action: string,
  maxAttempts: number,
  windowMinutes: number,
  lockMinutes: number
): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const current = nowIso();

  const existing =
    getRateLimit(
      key,
      action
    );

  if (!existing) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (isLocked(existing)) {
    const retryAfterSeconds =
      Math.max(
        1,
        Math.ceil(
          (
            new Date(
              existing.locked_until as string
            ).getTime() -
            Date.now()
          ) / 1000
        )
      );

    return {
      allowed: false,
      retryAfterSeconds,
    };
  }

  const windowStarted =
    new Date(
      existing.window_started_at
    ).getTime();

  const windowExpired =
    Date.now() - windowStarted >
    windowMinutes * 60 * 1000;

  if (windowExpired) {
    db.prepare(`
      UPDATE auth_rate_limits
      SET
        attempts = 0,
        window_started_at = ?,
        locked_until = NULL,
        updated_at = ?
      WHERE id = ?
    `).run(
      current,
      current,
      existing.id
    );

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (
    existing.attempts >=
    maxAttempts
  ) {
    const lockedUntil =
      addMinutes(lockMinutes);

    db.prepare(`
      UPDATE auth_rate_limits
      SET
        locked_until = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      lockedUntil,
      current,
      existing.id
    );

    return {
      allowed: false,
      retryAfterSeconds:
        lockMinutes * 60,
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

function recordRateLimitAttempt(
  key: string,
  action: string
) {
  const current = nowIso();

  const existing =
    getRateLimit(
      key,
      action
    );

  if (!existing) {
    db.prepare(`
      INSERT INTO auth_rate_limits (
        id,
        key,
        action,
        attempts,
        window_started_at,
        locked_until,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId("rate"),
      key,
      action,
      1,
      current,
      null,
      current,
      current
    );

    return;
  }

  db.prepare(`
    UPDATE auth_rate_limits
    SET
      attempts = attempts + 1,
      updated_at = ?
    WHERE id = ?
  `).run(
    current,
    existing.id
  );
}

function resetRateLimit(
  key: string,
  action: string
) {
  db.prepare(`
    DELETE FROM auth_rate_limits
    WHERE key = ?
      AND action = ?
  `).run(
    key,
    action
  );
}

function createAuthCode(
  adminId: string,
  purpose: string,
  expiryMinutes: number
): string {
  db.prepare(`
    UPDATE auth_codes
    SET used_at = ?
    WHERE admin_id = ?
      AND purpose = ?
      AND used_at IS NULL
  `).run(
    nowIso(),
    adminId,
    purpose
  );

  const code =
    generateSixDigitCode();

  db.prepare(`
    INSERT INTO auth_codes (
      id,
      admin_id,
      code_hash,
      purpose,
      expires_at,
      attempts,
      max_attempts,
      used_at,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId("code"),
    adminId,
    hashCode(code),
    purpose,
    addMinutes(expiryMinutes),
    0,
    CODE_MAX_ATTEMPTS,
    null,
    nowIso()
  );

  return code;
}

function verifyAuthCode(
  adminId: string,
  purpose: string,
  code: string
): {
  success: boolean;
  error?: string;
} {
  const record =
    db.prepare(`
      SELECT
        id,
        admin_id,
        code_hash,
        purpose,
        expires_at,
        attempts,
        max_attempts,
        used_at,
        created_at
      FROM auth_codes
      WHERE admin_id = ?
        AND purpose = ?
        AND used_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `).get(
      adminId,
      purpose
    ) as AuthCode | undefined;

  if (!record) {
    return {
      success: false,
      error:
        "No active verification code exists.",
    };
  }

  if (
    new Date(
      record.expires_at
    ).getTime() <= Date.now()
  ) {
    return {
      success: false,
      error:
        "Verification code has expired.",
    };
  }

  if (
    record.attempts >=
    record.max_attempts
  ) {
    return {
      success: false,
      error:
        "Too many verification attempts. Request a new code.",
    };
  }

  const valid =
    hashCode(code) ===
    record.code_hash;

  if (!valid) {
    db.prepare(`
      UPDATE auth_codes
      SET attempts = attempts + 1
      WHERE id = ?
    `).run(record.id);

    const remaining =
      record.max_attempts -
      (record.attempts + 1);

    if (remaining <= 0) {
      return {
        success: false,
        error:
          "Too many verification attempts. Request a new code.",
      };
    }

    return {
      success: false,
      error:
        `Invalid verification code. ${remaining} attempts remaining.`,
    };
  }

  db.prepare(`
    UPDATE auth_codes
    SET used_at = ?
    WHERE id = ?
  `).run(
    nowIso(),
    record.id
  );

  return {
    success: true,
  };
}

function getAdminById(
  adminId: string
): AdminUser | undefined {
  return db.prepare(`
    SELECT
      id,
      email,
      password_hash,
      name,
      phone,
      two_factor_enabled,
      created_at,
      updated_at
    FROM admin_users
    WHERE id = ?
    LIMIT 1
  `).get(
    adminId
  ) as AdminUser | undefined;
}

function getAdminByEmail(
  email: string
): AdminUser | undefined {
  return db.prepare(`
    SELECT
      id,
      email,
      password_hash,
      name,
      phone,
      two_factor_enabled,
      created_at,
      updated_at
    FROM admin_users
    WHERE email = ?
    LIMIT 1
  `).get(
    email
  ) as AdminUser | undefined;
}

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
|
| Normal login is:
|
| email + password -> JWT -> dashboard
|
| 2FA is NOT forced by this login flow.
| It can be enabled later as an optional security setting.
|--------------------------------------------------------------------------
*/

auth.post(
  "/login",
  async (c) => {
    try {
      const body =
        await c.req.json<{
          email?: string;
          password?: string;
        }>();

      const email = String(
        body.email || ""
      )
        .trim()
        .toLowerCase();

      const password = String(
        body.password || ""
      );

      const ipAddress =
        getClientIp(c);

      const userAgent =
        getUserAgent(c);

      if (
        !email ||
        !password
      ) {
        return c.json(
          {
            success: false,
            error:
              "Email and password are required.",
          },
          400
        );
      }

      const rateKey =
        `${ipAddress || "unknown"}:${email}`;

      const rate =
        checkRateLimit(
          rateKey,
          "login",
          LOGIN_MAX_ATTEMPTS,
          15,
          LOGIN_LOCK_MINUTES
        );

      if (!rate.allowed) {
        return c.json(
          {
            success: false,
            error:
              "Too many login attempts. Please try again later.",
            retryAfterSeconds:
              rate.retryAfterSeconds,
          },
          429
        );
      }

      const admin =
        getAdminByEmail(email);

      if (!admin) {
        recordRateLimitAttempt(
          rateKey,
          "login"
        );

        recordLoginEvent(
          null,
          email,
          "login_failed",
          ipAddress,
          userAgent
        );

        return c.json(
          {
            success: false,
            error:
              "Invalid credentials.",
          },
          401
        );
      }

      const passwordValid =
        await bcryptjs.compare(
          password,
          admin.password_hash
        );

      if (!passwordValid) {
        recordRateLimitAttempt(
          rateKey,
          "login"
        );

        recordLoginEvent(
          admin.id,
          admin.email,
          "login_failed",
          ipAddress,
          userAgent
        );

        return c.json(
          {
            success: false,
            error:
              "Invalid credentials.",
          },
          401
        );
      }

      resetRateLimit(
        rateKey,
        "login"
      );

      const token =
        createJwt(admin);

      recordLoginEvent(
        admin.id,
        admin.email,
        "login_success",
        ipAddress,
        userAgent
      );

      return c.json({
        success: true,
        data: {
          token,
          admin:
            publicAdmin(admin),
        },
      });
    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      return c.json(
        {
          success: false,
          error:
            "Login failed.",
        },
        500
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| OPTIONAL 2FA ENDPOINTS
|--------------------------------------------------------------------------
|
| These remain available for future account-security settings.
| They are NOT part of normal login.
|--------------------------------------------------------------------------
*/

auth.post(
  "/login/verify",
  async (c) => {
    return c.json(
      {
        success: false,
        error:
          "Two-factor authentication is not required for normal login.",
      },
      400
    );
  }
);

auth.post(
  "/login/resend",
  async (c) => {
    return c.json(
      {
        success: false,
        error:
          "Two-factor authentication is not required for normal login.",
      },
      400
    );
  }
);

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

auth.post(
  "/logout",
  (c) => {
    return c.json({
      success: true,
      data: {
        message:
          "Logged out successfully.",
      },
    });
  }
);

/*
|--------------------------------------------------------------------------
| CURRENT ADMIN
|--------------------------------------------------------------------------
*/

auth.get(
  "/me",
  authMiddleware,
  (c) => {
    const adminId =
      c.get("adminId");

    const admin =
      getAdminById(adminId);

    if (!admin) {
      return c.json(
        {
          success: false,
          error:
            "Admin user not found.",
        },
        404
      );
    }

    return c.json({
      success: true,
      data:
        publicAdmin(admin),
    });
  }
);

/*
|--------------------------------------------------------------------------
| CHANGE PASSWORD
|--------------------------------------------------------------------------
*/

auth.post(
  "/change-password",
  authMiddleware,
  async (c) => {
    try {
      const adminId =
        c.get("adminId");

      const body =
        await c.req.json<{
          currentPassword?: string;
          newPassword?: string;
        }>();

      const currentPassword =
        String(
          body.currentPassword || ""
        );

      const newPassword =
        String(
          body.newPassword || ""
        );

      if (
        !currentPassword ||
        !newPassword
      ) {
        return c.json(
          {
            success: false,
            error:
              "Current password and new password are required.",
          },
          400
        );
      }

      if (
        newPassword.length <
        PASSWORD_MIN_LENGTH
      ) {
        return c.json(
          {
            success: false,
            error:
              "New password must contain at least 12 characters.",
          },
          400
        );
      }

      if (
        currentPassword ===
        newPassword
      ) {
        return c.json(
          {
            success: false,
            error:
              "New password must be different from your current password.",
          },
          400
        );
      }

      const admin =
        getAdminById(adminId);

      if (!admin) {
        return c.json(
          {
            success: false,
            error:
              "Admin user not found.",
          },
          404
        );
      }

      const valid =
        await bcryptjs.compare(
          currentPassword,
          admin.password_hash
        );

      if (!valid) {
        return c.json(
          {
            success: false,
            error:
              "Current password is incorrect.",
          },
          401
        );
      }

      const passwordHash =
        await bcryptjs.hash(
          newPassword,
          12
        );

      db.prepare(`
        UPDATE admin_users
        SET
          password_hash = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        passwordHash,
        nowIso(),
        admin.id
      );

      db.prepare(`
        UPDATE auth_codes
        SET used_at = ?
        WHERE admin_id = ?
          AND used_at IS NULL
      `).run(
        nowIso(),
        admin.id
      );

      recordLoginEvent(
        admin.id,
        admin.email,
        "password_changed",
        getClientIp(c),
        getUserAgent(c)
      );

      return c.json({
        success: true,
        data: {
          message:
            "Password changed successfully. Please sign in again.",
        },
      });
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      return c.json(
        {
          success: false,
          error:
            "Unable to change password.",
        },
        500
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD - REQUEST
|--------------------------------------------------------------------------
*/

auth.post(
  "/forgot-password",
  async (c) => {
    try {
      const body =
        await c.req.json<{
          email?: string;
        }>();

      const email =
        String(
          body.email || ""
        )
          .trim()
          .toLowerCase();

      if (!email) {
        return c.json(
          {
            success: false,
            error:
              "Email is required.",
          },
          400
        );
      }

      const rateKey =
        `${getClientIp(c) || "unknown"}:${email}`;

      const rate =
        checkRateLimit(
          rateKey,
          "forgot_password",
          3,
          30,
          30
        );

      if (!rate.allowed) {
        return c.json(
          {
            success: false,
            error:
              "Too many password reset requests. Please try again later.",
            retryAfterSeconds:
              rate.retryAfterSeconds,
          },
          429
        );
      }

      recordRateLimitAttempt(
        rateKey,
        "forgot_password"
      );

      const admin =
        getAdminByEmail(email);

      if (!admin) {
        return c.json({
          success: true,
          data: {
            message:
              "If an account exists for that email, a verification code will be sent.",
          },
        });
      }

      createAuthCode(
        admin.id,
        "password_reset",
        CODE_EXPIRY_MINUTES
      );

      recordLoginEvent(
        admin.id,
        admin.email,
        "password_reset_requested",
        getClientIp(c),
        getUserAgent(c)
      );

      /*
       * IMPORTANT:
       * The code is stored hashed and is never returned to the browser.
       *
       * A real email provider must be configured before the code can
       * actually be delivered to the owner.
       */

      return c.json({
        success: true,
        data: {
          message:
            "If an account exists for that email, a verification code will be sent.",
          expiresInSeconds:
            CODE_EXPIRY_MINUTES * 60,
        },
      });
    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      return c.json(
        {
          success: false,
          error:
            "Unable to process password reset request.",
        },
        500
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD - VERIFY CODE
|--------------------------------------------------------------------------
*/

auth.post(
  "/forgot-password/verify",
  async (c) => {
    try {
      const body =
        await c.req.json<{
          email?: string;
          code?: string;
        }>();

      const email =
        String(
          body.email || ""
        )
          .trim()
          .toLowerCase();

      const code =
        String(
          body.code || ""
        ).trim();

      if (
        !email ||
        !/^\d{6}$/.test(code)
      ) {
        return c.json(
          {
            success: false,
            error:
              "Email and a valid 6-digit verification code are required.",
          },
          400
        );
      }

      const admin =
        getAdminByEmail(email);

      if (!admin) {
        return c.json(
          {
            success: false,
            error:
              "Invalid verification request.",
          },
          401
        );
      }

      const rateKey =
        `${getClientIp(c) || "unknown"}:${admin.id}`;

      const rate =
        checkRateLimit(
          rateKey,
          "password_reset_verify",
          5,
          10,
          15
        );

      if (!rate.allowed) {
        return c.json(
          {
            success: false,
            error:
              "Too many verification attempts. Please request a new code later.",
            retryAfterSeconds:
              rate.retryAfterSeconds,
          },
          429
        );
      }

      recordRateLimitAttempt(
        rateKey,
        "password_reset_verify"
      );

      const verification =
        verifyAuthCode(
          admin.id,
          "password_reset",
          code
        );

      if (!verification.success) {
        return c.json(
          {
            success: false,
            error:
              verification.error ||
              "Invalid verification code.",
          },
          401
        );
      }

      resetRateLimit(
        rateKey,
        "password_reset_verify"
      );

      /*
       * The verified reset session is represented by a short-lived,
       * single-use random token stored in auth_codes.
       */

      const resetToken =
        crypto.randomBytes(32).toString("hex");

      db.prepare(`
        INSERT INTO auth_codes (
          id,
          admin_id,
          code_hash,
          purpose,
          expires_at,
          attempts,
          max_attempts,
          used_at,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        resetToken,
        admin.id,
        hashCode(resetToken),
        "password_reset_session",
        addMinutes(10),
        0,
        1,
        null,
        nowIso()
      );

      return c.json({
        success: true,
        data: {
          resetToken,
          expiresInSeconds: 600,
        },
      });
    } catch (error) {
      console.error(
        "Password reset verification error:",
        error
      );

      return c.json(
        {
          success: false,
          error:
            "Unable to verify the password reset code.",
        },
        500
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD - RESET PASSWORD
|--------------------------------------------------------------------------
*/

auth.post(
  "/forgot-password/reset",
  async (c) => {
    try {
      const body =
        await c.req.json<{
          resetToken?: string;
          newPassword?: string;
        }>();

      const resetToken =
        String(
          body.resetToken || ""
        ).trim();

      const newPassword =
        String(
          body.newPassword || ""
        );

      if (
        !resetToken ||
        !newPassword
      ) {
        return c.json(
          {
            success: false,
            error:
              "Reset token and new password are required.",
          },
          400
        );
      }

      if (
        newPassword.length <
        PASSWORD_MIN_LENGTH
      ) {
        return c.json(
          {
            success: false,
            error:
              "New password must contain at least 12 characters.",
          },
          400
        );
      }

      const resetRecord =
        db.prepare(`
          SELECT
            id,
            admin_id,
            code_hash,
            purpose,
            expires_at,
            attempts,
            max_attempts,
            used_at,
            created_at
          FROM auth_codes
          WHERE id = ?
            AND purpose = 'password_reset_session'
            AND used_at IS NULL
          LIMIT 1
        `).get(
          resetToken
        ) as AuthCode | undefined;

      if (!resetRecord) {
        return c.json(
          {
            success: false,
            error:
              "Password reset session is invalid or has already been used.",
          },
          401
        );
      }

      if (
        new Date(
          resetRecord.expires_at
        ).getTime() <= Date.now()
      ) {
        return c.json(
          {
            success: false,
            error:
              "Password reset session has expired. Please start again.",
          },
          401
        );
      }

      if (
        hashCode(resetToken) !==
        resetRecord.code_hash
      ) {
        return c.json(
          {
            success: false,
            error:
              "Password reset session is invalid.",
          },
          401
        );
      }

      const admin =
        getAdminById(
          resetRecord.admin_id
        );

      if (!admin) {
        return c.json(
          {
            success: false,
            error:
              "Admin user not found.",
          },
          404
        );
      }

      const passwordHash =
        await bcryptjs.hash(
          newPassword,
          12
        );

      const currentTime =
        nowIso();

      db.prepare(`
        UPDATE admin_users
        SET
          password_hash = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        passwordHash,
        currentTime,
        admin.id
      );

      db.prepare(`
        UPDATE auth_codes
        SET used_at = ?
        WHERE admin_id = ?
          AND used_at IS NULL
      `).run(
        currentTime,
        admin.id
      );

      recordLoginEvent(
        admin.id,
        admin.email,
        "password_reset_completed",
        getClientIp(c),
        getUserAgent(c)
      );

      return c.json({
        success: true,
        data: {
          message:
            "Password reset successfully. You can now sign in with your new password.",
        },
      });
    } catch (error) {
      console.error(
        "Password reset error:",
        error
      );

      return c.json(
        {
          success: false,
          error:
            "Unable to reset password.",
        },
        500
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| CHANGE EMAIL
|--------------------------------------------------------------------------
*/

auth.post(
  "/change-email",
  authMiddleware,
  async (c) => {
    try {
      const adminId =
        c.get("adminId");

      const body =
        await c.req.json<{
          currentPassword?: string;
          newEmail?: string;
        }>();

      const currentPassword =
        String(
          body.currentPassword || ""
        );

      const newEmail =
        String(
          body.newEmail || ""
        )
          .trim()
          .toLowerCase();

      if (
        !currentPassword ||
        !newEmail
      ) {
        return c.json(
          {
            success: false,
            error:
              "Current password and new email are required.",
          },
          400
        );
      }

      const emailValid =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          newEmail
        );

      if (!emailValid) {
        return c.json(
          {
            success: false,
            error:
              "Please provide a valid email address.",
          },
          400
        );
      }

      const admin =
        getAdminById(adminId);

      if (!admin) {
        return c.json(
          {
            success: false,
            error:
              "Admin user not found.",
          },
          404
        );
      }

      const passwordValid =
        await bcryptjs.compare(
          currentPassword,
          admin.password_hash
        );

      if (!passwordValid) {
        return c.json(
          {
            success: false,
            error:
              "Current password is incorrect.",
          },
          401
        );
      }

      const existing =
        db.prepare(`
          SELECT id
          FROM admin_users
          WHERE email = ?
            AND id != ?
          LIMIT 1
        `).get(
          newEmail,
          admin.id
        );

      if (existing) {
        return c.json(
          {
            success: false,
            error:
              "That email address is already in use.",
          },
          409
        );
      }

      db.prepare(`
        UPDATE admin_users
        SET
          email = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        newEmail,
        nowIso(),
        admin.id
      );

      recordLoginEvent(
        admin.id,
        newEmail,
        "email_changed",
        getClientIp(c),
        getUserAgent(c)
      );

      return c.json({
        success: true,
        data: {
          message:
            "Email address changed successfully. Please sign in again using the new email.",
          email: newEmail,
        },
      });
    } catch (error) {
      console.error(
        "Change email error:",
        error
      );

      return c.json(
        {
          success: false,
          error:
            "Unable to change email address.",
        },
        500
      );
    }
  }
);

export default auth;