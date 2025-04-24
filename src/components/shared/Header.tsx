
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X, User, PlusCircle, History, QrCode, LogOut, Settings } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { TokenDisplay } from "./TokenDisplay";

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const isAuthenticated = state.isAuthenticated;
  const isBarman = state.user?.role === 'barman';

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/auth');
  };

  const menuItems = isAuthenticated
    ? [
        isBarman
          ? { label: "Dashboard Barman", href: "/barman", icon: <User size={16} /> }
          : { label: "Comandă", href: "/", icon: <PlusCircle size={16} /> },
        !isBarman && { label: "Check-in", href: "/checkin", icon: <QrCode size={16} /> },
        !isBarman && { label: "Istoric", href: "/history", icon: <History size={16} /> },
        !isBarman && { label: "Tokenuri", href: "/tokens", icon: <Settings size={16} /> },
        { label: "Logout", onClick: handleLogout, icon: <LogOut size={16} /> },
      ].filter(Boolean)
    : [{ label: "Autentificare", href: "/auth", icon: <User size={16} /> }];

  return (
    <header className="py-4 px-4 border-b border-gray-800 bg-black">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <img src="/lovable-uploads/7f8228c7-4e7c-4a0e-8699-522a2c37c47a.png" alt="Spontan" className="h-10" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          {isAuthenticated && <TokenDisplay />}
          
          {menuItems.map((item, idx) =>
            item.href ? (
              <Button
                key={idx}
                variant="ghost"
                size="sm"
                asChild
                className="flex items-center gap-2"
              >
                <Link to={item.href}>
                  {item.icon}
                  {item.label}
                </Link>
              </Button>
            ) : (
              <Button
                key={idx}
                variant="ghost"
                size="sm"
                onClick={item.onClick}
                className="flex items-center gap-2"
              >
                {item.icon}
                {item.label}
              </Button>
            )
          )}
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              {isOpen ? <X /> : <Menu />}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-black text-white">
            <div className="flex flex-col gap-4 pt-8">
              {isAuthenticated && (
                <div className="flex justify-between items-center mb-4">
                  <div className="font-bold">{state.user?.name}</div>
                  <TokenDisplay />
                </div>
              )}
              
              {menuItems.map((item, idx) =>
                item.href ? (
                  <Button
                    key={idx}
                    variant="ghost"
                    asChild
                    className="justify-start"
                    onClick={() => setIsOpen(false)}
                  >
                    <Link to={item.href} className="flex items-center gap-3">
                      {item.icon}
                      {item.label}
                    </Link>
                  </Button>
                ) : (
                  <Button
                    key={idx}
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      item.onClick?.();
                      setIsOpen(false);
                    }}
                  >
                    <span className="flex items-center gap-3">
                      {item.icon}
                      {item.label}
                    </span>
                  </Button>
                )
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
