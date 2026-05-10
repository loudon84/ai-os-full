"use client";

import type { ObjectFieldTemplateProps } from "@rjsf/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DefaultObjectFieldTemplate(props: ObjectFieldTemplateProps) {
  return (
    <div className="space-y-4">
      {props.title ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{props.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">{props.properties.map((p) => p.content)}</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">{props.properties.map((p) => p.content)}</div>
      )}
    </div>
  );
}

export const rjsfTemplates = {
  ObjectFieldTemplate: DefaultObjectFieldTemplate
};

