
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page non trouvée</h2>
        <p className="text-muted-foreground mb-6">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Button asChild>
          <Link to="/">Retourner à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
