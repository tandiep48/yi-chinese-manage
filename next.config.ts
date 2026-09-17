import type { NextConfig } from "next";

/* The learner pages used to sit at the root ("/", "/vocab", "/hsk/3"); they now
   live under the "/learner" segment, alongside the admin app at "/manage".
   These keep the old links working. They are 307s, NOT 308s, on purpose: a
   permanent redirect is cached by browsers indefinitely, and the paths are
   still moving while the Flask port finishes. Switch to permanent at launch. */
const LEARNER_PREFIXES = [
  "books",
  "exam",
  "grammar",
  "hsk",
  "learn-together",
  "lesson",
  "lesson-learning",
  "lesson-training",
  "login",
  "practice",
  "profile",
  "recommend",
  "register",
  "translation",
  "vocab",
  "vocab-learning",
  "vocab-review",
  "vocab-training-batch",
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/", destination: "/learner", permanent: false },
      ...LEARNER_PREFIXES.map((prefix) => ({
        source: `/${prefix}/:path*`,
        destination: `/learner/${prefix}/:path*`,
        permanent: false,
      })),
    ];
  },
};

export default nextConfig;
