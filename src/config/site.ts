export type SiteConfig = typeof siteConfig;

const links = {
  x: "https://dub.sh/twtter",
  github: "https://git.new/ygkr",
  githubAccount: "https://github.com/sadmann7",
  web: "https://dub.sh/ygkr",
};

export const siteConfig = {
  name: "Repligram",
  description: `Create an account or log in to Repligram - Share what you're into with the people who get you.`,
  url: "https://repligram.vercel.app",
  ogImage: `https://repligram.vercel.app/images/opengraph.png`,
  links,
};
