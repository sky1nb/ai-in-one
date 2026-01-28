import { useState, useEffect } from 'react';

export function useLocation() {
  const [location, setLocation] = useState({
    hash: window.location.hash,
    pathname: window.location.pathname,
  });

  useEffect(() => {
    const handleHashChange = () => {
      setLocation({
        hash: window.location.hash,
        pathname: window.location.pathname,
      });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return location;
}
