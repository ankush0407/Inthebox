import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  
  // Handle malformed password data
  if (!hashed || !salt) {
    return false;
  }
  
  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    // Ensure buffers are the same length before comparison
    if (hashedBuf.length !== suppliedBuf.length) {
      return false;
    }
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    // Handle any errors in buffer creation or comparison
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !user.password || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists
            let user = await storage.getUserByProviderId("google", profile.id);
            
            if (!user) {
              // Check if user exists with same email
              const existingUser = await storage.getUserByEmail(profile.emails?.[0]?.value || "");
              if (existingUser) {
                // Link existing account
                user = await storage.linkOAuthAccount(existingUser.id, "google", profile.id);
              } else {
                // Create new user
                user = await storage.createUser({
                  username: profile.displayName || profile.emails?.[0]?.value?.split("@")[0] || `google_${profile.id}`,
                  email: profile.emails?.[0]?.value || "",
                  provider: "google",
                  providerId: profile.id,
                  role: "customer",
                  profileComplete: false,
                });
              }
            }
            
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  // Facebook OAuth Strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: "/api/auth/facebook/callback",
          profileFields: ["id", "displayName", "emails"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists
            let user = await storage.getUserByProviderId("facebook", profile.id);
            
            if (!user) {
              // Check if user exists with same email
              const existingUser = await storage.getUserByEmail(profile.emails?.[0]?.value || "");
              if (existingUser) {
                // Link existing account
                user = await storage.linkOAuthAccount(existingUser.id, "facebook", profile.id);
              } else {
                // Create new user
                user = await storage.createUser({
                  username: profile.displayName || profile.emails?.[0]?.value?.split("@")[0] || `facebook_${profile.id}`,
                  email: profile.emails?.[0]?.value || "",
                  provider: "facebook",
                  providerId: profile.id,
                  role: "customer",
                  profileComplete: false,
                });
              }
            }
            
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  app.post("/api/complete-profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { role } = req.body;
      if (!role || !["customer", "restaurant_owner", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role specified" });
      }

      const updatedUser = await storage.completeProfile(req.user.id, role);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update the session user
      req.user.role = role;
      req.user.profileComplete = true;

      res.json(updatedUser);
    } catch (error) {
      console.error("Profile completion error:", error);
      res.status(500).json({ error: "Failed to complete profile" });
    }
  });

  // OAuth Routes
  // Google OAuth
  app.get("/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth?error=google_failed" }),
    (req, res) => {
      // Redirect new users to role selection, existing users to home
      if (req.user && !req.user.profileComplete) {
        res.redirect("/role-selection");
      } else {
        res.redirect("/");
      }
    }
  );

  // Facebook OAuth
  app.get("/api/auth/facebook",
    passport.authenticate("facebook", { scope: ["email"] })
  );

  app.get("/api/auth/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/auth?error=facebook_failed" }),
    (req, res) => {
      // Redirect new users to role selection, existing users to home
      if (req.user && !req.user.profileComplete) {
        res.redirect("/role-selection");
      } else {
        res.redirect("/");
      }
    }
  );
}
