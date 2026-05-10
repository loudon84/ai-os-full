"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title?: string;
  message: string;
};

export function ToolErrorCard({ title = "Error", message }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-red-600">{message}</div>
      </CardContent>
    </Card>
  );
}
