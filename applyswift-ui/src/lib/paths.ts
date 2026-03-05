// Resolve ~/.applypilot paths (mirrors config.py)

import { homedir } from "os";
import { join } from "path";

const APP_DIR = process.env.APPLYPILOT_DIR || join(homedir(), ".applypilot");

export const paths = {
  appDir: APP_DIR,
  db: join(APP_DIR, "applypilot.db"),
  profile: join(APP_DIR, "profile.json"),
  resume: join(APP_DIR, "resume.txt"),
  resumePdf: join(APP_DIR, "resume.pdf"),
  searches: join(APP_DIR, "searches.yaml"),
  env: join(APP_DIR, ".env"),
  tailoredDir: join(APP_DIR, "tailored_resumes"),
  coverLetterDir: join(APP_DIR, "cover_letters"),
  logDir: join(APP_DIR, "logs"),
} as const;
