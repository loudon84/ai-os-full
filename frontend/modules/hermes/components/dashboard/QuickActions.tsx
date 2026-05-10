"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Puzzle, RefreshCw } from "lucide-react";

export function QuickActions() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <Card>
      <CardContent className="flex flex-wrap gap-2 p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/hermes/sessions")}
        >
          <MessageSquare className="mr-1.5 h-4 w-4" />
          View All Sessions
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/hermes/skills")}
        >
          <Puzzle className="mr-1.5 h-4 w-4" />
          Manage Skills
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["hermes"] })}
        >
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh Data
        </Button>
      </CardContent>
    </Card>
  );
}
