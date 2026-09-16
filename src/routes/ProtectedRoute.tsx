import { Navigate } from "react-router-dom";
import LoadingScreen from "../components/tsx/LoadingScreen";
import { useAuth } from "../hooks/useAuth";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({
  children,
}: Props) {
  const {
    user,
    isLoading,
    accessDenied,
  } = useAuth();

  if (isLoading) {
    return (
      <LoadingScreen
        message="Loading your workspace..."
      />
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (accessDenied) {
    return (
      <Navigate
        to="/login?denied=1"
        replace
      />
    );
  }

  return <>{children}</>;
}
