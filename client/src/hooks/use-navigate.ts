import { useLocation } from 'wouter';

/**
 * A wrapper hook around wouter's useLocation to provide a simpler navigation interface.
 * Helps with type checking and provides a more consistent API.
 */
export function useNavigate() {
  const [location, setLocation] = useLocation();

  return {
    location,
    navigate: (path: string) => setLocation(path)
  };
}