
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Link } from "react-router-dom";

export const Header = () => {
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    setOpen(false);
  };

  const navLinks = state.user?.role === 'barman' 
    ? [
        { name: 'Dashboard', path: '/barman' }
      ]
    : [
        { name: 'Comandă', path: '/order' },
        { name: 'Istoricul comenzilor', path: '/history' },
        { name: 'Check-in', path: '/checkin' }
      ];

  return (
    <header className="w-full bg-black border-b border-white/10 py-4 px-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/7f8228c7-4e7c-4a0e-8699-522a2c37c47a.png" 
            alt="Spontan" 
            className="h-10"
          />
        </Link>
        
        {state.isAuthenticated && (
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-white/70 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Ieșire
              </Button>
            </div>
            
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-black/95 border-white/10">
                <div className="flex flex-col gap-6 mt-12">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.path} 
                      to={link.path}
                      className="text-lg font-medium text-white"
                      onClick={() => setOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <Button 
                    variant="ghost" 
                    className="justify-start px-0 hover:bg-transparent text-white"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Ieșire
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
    </header>
  );
};
