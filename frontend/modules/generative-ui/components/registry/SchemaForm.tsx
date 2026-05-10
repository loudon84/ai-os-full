"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type DefaultValues, type Path } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function unwrapZod(zod: z.ZodTypeAny): z.ZodTypeAny {
  let cur: z.ZodTypeAny = zod;
  for (;;) {
    if (cur instanceof z.ZodOptional || cur instanceof z.ZodNullable) {
      cur = cur.unwrap();
      continue;
    }
    if (cur instanceof z.ZodDefault) {
      cur = cur.removeDefault();
      continue;
    }
    if (cur instanceof z.ZodEffects) {
      cur = cur.innerType();
      continue;
    }
    break;
  }
  return cur;
}

export type SchemaFormProps<T extends z.ZodObject<Record<string, z.ZodTypeAny>>> = {
  schema: T;
  onSubmit: (values: z.infer<T>) => void;
  submitLabel?: string;
};

export function SchemaForm<T extends z.ZodObject<Record<string, z.ZodTypeAny>>>({
  schema,
  onSubmit,
  submitLabel = "提交",
}: SchemaFormProps<T>) {
  const parsedDefaults = schema.safeParse({});
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: (parsedDefaults.success
      ? parsedDefaults.data
      : {}) as DefaultValues<z.infer<T>>,
  });

  const shape = schema.shape;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {Object.keys(shape).map((key) => {
          const raw = shape[key as keyof typeof shape];
          const inner = unwrapZod(raw);

          if (inner instanceof z.ZodBoolean) {
            return (
              <FormField
                key={key}
                control={form.control}
                name={key as Path<z.infer<T>>}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={Boolean(field.value)}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">{key}</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          }

          if (inner instanceof z.ZodEnum) {
            const values = inner.options as string[];
            return (
              <FormField
                key={key}
                control={form.control}
                name={key as Path<z.infer<T>>}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{key}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={`选择 ${key}`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {values.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          }

          const inputType =
            inner instanceof z.ZodString &&
            inner._def.checks?.some((c) => c.kind === "url")
              ? "url"
              : "text";

          return (
            <FormField
              key={key}
              control={form.control}
              name={key as Path<z.infer<T>>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{key}</FormLabel>
                  <FormControl>
                    <Input type={inputType} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}

        <Button type="submit" color="primary">
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}

/** 使用 schema 内置 default / optional 解析空对象，得到表单初始值 */
export function getSchemaDefaults(
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>,
): Record<string, unknown> {
  const parsed = schema.safeParse({});
  return parsed.success ? parsed.data : {};
}
