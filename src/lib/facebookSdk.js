// Loads Facebook's JS SDK once (idempotent across every VideoModal open) so
// XFBML `<div class="fb-video">` embeds can auto-size themselves to each
// video's real aspect ratio via postMessage — a plain `<iframe
// src=".../plugins/video.php">` can't do that, it only ever fills whatever
// fixed CSS box it's given, leaving black bars above/below the actual player
// whenever the video's own aspect ratio doesn't match that box.
let sdkPromise = null;

export function loadFacebookSdk() {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve) => {
    if (window.FB) {
      resolve(window.FB);
      return;
    }

    if (!document.getElementById("fb-root")) {
      const root = document.createElement("div");
      root.id = "fb-root";
      document.body.prepend(root);
    }

    const previousInit = window.fbAsyncInit;
    window.fbAsyncInit = () => {
      previousInit?.();
      // xfbml: false — parsing is triggered manually per-embed (via
      // FB.XFBML.parse(container)) instead of scanning the whole document,
      // since embeds are added dynamically by React rather than present in
      // the initial page HTML.
      window.FB.init({ xfbml: false, version: "v21.0" });
      resolve(window.FB);
    };

    if (document.getElementById("facebook-jssdk")) return;
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/de_DE/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);
  });

  return sdkPromise;
}
