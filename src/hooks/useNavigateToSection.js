import { useNavigate, useLocation } from "react-router-dom";

// Nav items (Start, Über uns, ...) must work from any page, not just the
// home page — e.g. clicking "Start" while on /sortiment/schuhe should
// navigate back home and then scroll to the right section.
export function useNavigateToSection() {
  const navigate = useNavigate();
  const location = useLocation();

  return (id) => {
    if (location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(`/#${id}`);
    }
  };
}
