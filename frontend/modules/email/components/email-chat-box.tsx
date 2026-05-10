"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ChevronDown, SendHorizontal } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import avatar1 from "@/public/images/avatar/avatar-1.jpg";
import avatar2 from "@/public/images/avatar/avatar-2.jpg";

interface EmailChatBoxProps {
  onClose: () => void;
}

export function EmailChatBox({ onClose }: EmailChatBoxProps) {
  const [minimize, setMinimize] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${event.target.scrollHeight - 15}px`;
  };

  return (
    <Card className="fixed bottom-0 z-[9999] w-[200px] rounded-b-none rounded-t-md dark:border dark:border-default-200 dark:border-t-0 ltr:right-4 rtl:left-4 md:[250px] lg:w-[360px]">
      <CardHeader
        className={cn("flex-row items-center rounded-t-md bg-primary py-2", {
          "mb-0": minimize,
        })}
      >
        <div className="flex flex-1 items-center gap-3">
          <div className="relative inline-block">
            <Avatar className="h-9 w-9 ring-1 ring-secondary">
              <AvatarImage src={avatar1.src} />
              <AvatarFallback>SN</AvatarFallback>
            </Avatar>
            <Badge
              color="success"
              className="absolute top-[calc(100%-8px)] h-2 w-2 items-center justify-center p-0 ltr:left-[calc(100%-8px)] rtl:right-[calc(100%-8px)]"
            />
          </div>
          <div className="relative w-[50px] truncate text-base font-medium text-primary-foreground md:w-fit">
            Jenifer Jenny
            <ChevronDown className="absolute top-1 h-3.5 w-3.5 text-primary-foreground ltr:-right-4 rtl:-left-4" />
          </div>
        </div>
        <Button type="button" size="icon">
          <Icon icon="heroicons:phone" className="h-5 w-5" />
        </Button>
        <Button type="button" size="icon">
          <Icon icon="heroicons:video-camera" className="h-5 w-5" />
        </Button>
        <Button type="button" size="icon" onClick={() => setMinimize((value) => !value)}>
          <Icon icon="heroicons:minus" className="h-5 w-5" />
        </Button>
        <Button type="button" size="icon" onClick={onClose}>
          <Icon icon="heroicons:x-mark" className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className={cn("px-0", { hidden: minimize })}>
        <div className="h-[200px] lg:h-[346px]">
          <ScrollArea className="h-full">
            <div className="block px-4 md:px-6">
              <div className="group mb-4 flex items-start gap-x-2">
                <div className="flex-none self-end -translate-y-5">
                  <Image
                    src={avatar1}
                    alt="/images/avatar/avatar-1.jpg"
                    className="block h-8 w-8 rounded-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <div className="whitespace-pre-wrap break-all">
                        <div className="flex-1 rounded-2xl bg-default-200 px-3 py-2 text-sm">
                          Hello. How can I help You?
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-default-500">01:45 PM</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="block px-4 md:px-6">
              <div className="group mb-4 flex w-full items-start justify-end gap-x-2">
                <div className="flex flex-col gap-1">
                  <div className="whitespace-pre-wrap break-all">
                    <div className="flex-1 rounded-2xl bg-primary/70 px-3 py-2 text-sm text-primary-foreground">
                      Can I get details of my last transaction I made last month?
                    </div>
                  </div>
                  <span className="text-end text-xs text-default-500">01:46 PM</span>
                </div>
                <Image
                  src={avatar2}
                  alt="/images/avatar/avatar-2.jpg"
                  className="block h-8 w-8 self-end rounded-full object-cover"
                />
              </div>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
      <CardFooter className={cn("px-0", { hidden: minimize })}>
        <div className="flex w-full items-end gap-4 lg:px-4">
          <form className="flex-1">
            <div className="relative flex gap-1">
              <textarea
                value={message}
                onChange={handleChange}
                placeholder="Type your message..."
                className="h-10 max-h-[70px] min-h-10 flex-1 resize-none break-words rounded-xl border bg-default-200 px-3 pt-2 outline-none hover:border-primary"
              />
              <Button
                type="button"
                className="h-[42px] w-[42px] self-end rounded-full bg-default-100 p-0 hover:bg-default-100"
              >
                <SendHorizontal className="h-8 w-5 text-primary rtl:rotate-180" />
              </Button>
            </div>
          </form>
        </div>
      </CardFooter>
    </Card>
  );
}
