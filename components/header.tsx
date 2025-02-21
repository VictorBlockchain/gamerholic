"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bell, User, ChevronDown, Menu, LogOut } from "lucide-react"; // Added LogOut icon
import Image from "next/image";
import { WalletDisplay } from "@/components/wallet-display";
import { AuthButton } from "@/components/auth-button";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react"; // Import useWallet
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { publicKey, disconnect }: any = useWallet(); // Added disconnect
  const [userData, setUserData]: any = useState();

  useEffect(() => {
    if (publicKey) {
      fetchUser();
    }
  }, [publicKey]);

  const fetchUser = async () => {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("username, avatar_url")
      .eq("publicKey", publicKey.toBase58())
      .single();
    if (user) {
      setUserData(user);
    }
  };

  // Logout function
  const handleLogout = () => {
    disconnect(); // Disconnect the Solana wallet
    // Optionally, you can also clear any local state or Supabase session here
  };

  const ProfileMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          {userData?.avatar_url ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image
                src={userData.avatar_url}
                alt="User Avatar"
                layout="fill"
                objectFit="cover"
              />
            </div>
          ) : (
            <User className="h-5 w-5" />
          )}
          <ChevronDown className="h-3 w-3 absolute bottom-0 right-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {userData?.username && (
          <DropdownMenuItem className="flex items-center gap-2">
            <span className="font-semibold">{userData.username}</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/profile/${publicKey}`}>Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-support-tickets">Support Tickets</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Logout Button */}
        <DropdownMenuItem onClick={handleLogout}>
          <div className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <AuthButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const MainMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Menu className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/">Home</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/esports">Esports</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/arcade-discover">Arcade</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/grabbit">Grabbit</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/about">About Us</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/support">Support</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image
                src="/logo.png"
                alt="Gamerholic Logo"
                layout="fill"
                objectFit="cover"
              />
            </div>
            <span className="text-xl font-bold text-primary neon-glow sm:block hidden">
              Gamerholic
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {publicKey && (
              <>
                <WalletDisplay />
                <ProfileMenu />
                <MainMenu />
              </>
            )}
            {!publicKey && <AuthButton />}
          </div>
        </div>
        {mobileMenuOpen && publicKey && (
          <div className="py-4 space-y-4 sm:hidden">
            <WalletDisplay />
            <AuthButton />
          </div>
        )}
      </div>
    </header>
  );
}