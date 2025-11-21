import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const useScrollRestore = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(`scroll-${pathname}`);
    if (savedScroll) {
      window.scrollTo(0, parseInt(savedScroll));
    }
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(`scroll-${pathname}`, window.scrollY.toString());
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);
};