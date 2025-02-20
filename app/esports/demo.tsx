"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface ChatPopupProps {
  senderId: string; // publicKey
  receiverId: string; // publicKey
  receiverName: string;
  receiverAvatar: string;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export const ChatPopup: React.FC<ChatPopupProps> = ({
  senderId,
  receiverId,
  receiverName,
  receiverAvatar,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    checkBlockStatus();
    const subscription = supabase
      .channel("chat_1on1")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_1on1" },
        handleNewMessage,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Scroll to bottom whenever messages are updated
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("chat_1on1")
      .select("*")
      .or(
        `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`,
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
  };

  const checkBlockStatus = async () => {
    const { data, error } = await supabase
      .from("blocked_users")
      .select("*")
      .eq("blocker_id", senderId)
      .eq("blocked_id", receiverId)
      .maybeSingle();

    if (error) {
      console.error("Error checking block status:", error);
    } else {
      setIsBlocked(!!data);
    }
  };

  const handleNewMessage = (payload: any) => {
    if (
      (payload.new.sender_id === senderId && payload.new.receiver_id === receiverId) ||
      (payload.new.sender_id === receiverId && payload.new.receiver_id === senderId)
    ) {
      setMessages((prevMessages) => [...prevMessages, payload.new]);
      if (payload.new.sender_id !== senderId) {
        animateChatWindow();
      }
    }
  };

  const animateChatWindow = () => {
    const chatWindow = document.getElementById(`chat-popup-${receiverId}`);
    if (chatWindow) {
      chatWindow.classList.add("animate-bounce");
      setTimeout(() => {
        chatWindow.classList.remove("animate-bounce");
      }, 1000);
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() === "" || isBlocked) return;

    const { error } = await supabase.from("chat_1on1").insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content: newMessage,
    });

    if (error) {
      console.error("Error sending message:", error);
    } else {
      setNewMessage("");
    }
  };

  const handleBlockToggle = async () => {
    if (isBlocked) {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", senderId)
        .eq("blocked_id", receiverId);

      if (error) {
        console.error("Error unblocking user:", error);
      } else {
        setIsBlocked(false);
      }
    } else {
      const { error } = await supabase.from("blocked_users").insert({
        blocker_id: senderId,
        blocked_id: receiverId,
      });

      if (error) {
        console.error("Error blocking user:", error);
      } else {
        setIsBlocked(true);
      }
    }
  };

  return (
    <Card className="w-80 h-96 fixed bottom-4 right-4 flex flex-col" id={`chat-popup-${receiverId}`}>
      <CardHeader className="py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={receiverAvatar} />
                    <AvatarFallback>{receiverName[0]}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex flex-col space-y-2">
                    <Link href={`/profile/${receiverId}`}>
                      <Button variant="ghost" className="w-full">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <CardTitle className="text-sm font-medium">{receiverName}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-2 ${message.sender_id === senderId ? "text-right" : "text-left"}`}
            >
              <span
                className={`inline-block p-2 rounded-lg ${
                  message.sender_id === senderId ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
              >
                {message.content}
              </span>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex w-full space-x-2"
        >
          <Input
            type="text"
            placeholder={isBlocked ? "User is blocked" : "Type a message..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-grow"
            disabled={isBlocked}
          />
          <Button type="submit" disabled={isBlocked}>
            Send
          </Button>
        </form>
      </CardFooter>

      {/* Block User AlertDialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" className="absolute top-2 right-10">
            {isBlocked ? "Unblock" : "Block"} User
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isBlocked ? "Unblock" : "Block"} User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {isBlocked ? "unblock" : "block"} this user?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBlockToggle();
              }}
            >
              {isBlocked ? "Unblock" : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};