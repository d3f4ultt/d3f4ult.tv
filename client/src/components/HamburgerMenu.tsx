import { useState, useRef, useEffect } from "react";
import { Menu, Tv, Home, Film, TrendingUp, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const menuItems: MenuItem[] = [
    {
      label: "Dashboard",
      icon: <Home className="h-4 w-4" />,
      onClick: () => {
        window.location.href = "/";
        setIsOpen(false);
      },
    },
    {
      label: "Copy Trading",
      icon: <Copy className="h-4 w-4" />,
      onClick: () => {
        window.location.href = "/copy-trading";
        setIsOpen(false);
      },
    },
    {
      label: "Netflix",
      icon: <Tv className="h-4 w-4" />,
      onClick: () => {
        window.open("/netflix.html", "_blank");
        setIsOpen(false);
      },
    },
    {
      label: "Movies",
      icon: <Film className="h-4 w-4" />,
      onClick: () => {
        // Add your movies page route here
        setIsOpen(false);
      },
    },
    {
      label: "Trending",
      icon: <TrendingUp className="h-4 w-4" />,
      onClick: () => {
        // Add your trending page route here
        setIsOpen(false);
      },
    },
  ];

  return (
    <div className="relative z-[100]" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          console.log("Hamburger clicked, isOpen:", !isOpen);
          setIsOpen(!isOpen);
        }}
        className="h-9 w-9"
        data-testid="hamburger-menu-button"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div
          className="fixed top-[60px] left-4 w-56 bg-background border-2 border-primary rounded-md shadow-2xl overflow-hidden z-[100]"
          data-testid="hamburger-menu-dropdown"
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
