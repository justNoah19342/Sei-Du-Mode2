import { useEffect, useState } from "react";
import { getConsent, setConsent, subscribeConsent } from "../lib/cookieConsentStore";

export function useCookieConsent() {
  const [consent, setConsentState] = useState(getConsent);

  useEffect(() => subscribeConsent(setConsentState), []);

  return {
    consent,
    accept: () => setConsent("accepted"),
    decline: () => setConsent("declined"),
  };
}
