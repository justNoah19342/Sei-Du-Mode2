// Facebook videos now come from the Meta Graph API via useFacebookVideos()
// (see functions/api/facebook-videos.js). Instagram is still a placeholder.
export const instagramVideos = Array.from({ length: 5 }, (_, i) => ({
  id: `ig-${i + 1}`,
  title: `Instagram Video ${i + 1}`,
}));
