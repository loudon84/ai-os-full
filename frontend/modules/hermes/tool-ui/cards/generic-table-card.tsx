"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title?: string;
  columns: string[];
  rows: Record<string, unknown>[];
};

export function GenericTableCard({ title = "Table", columns, rows }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              {columns.map((col) => (
                <th key={col} className="py-2 pr-3">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b">
                {columns.map((col) => (
                  <td key={col} className="py-3 pr-3">
                    {String(row[col] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
