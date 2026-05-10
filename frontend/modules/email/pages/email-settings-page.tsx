import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * 独立「邮箱设置」挂载占位：账号绑定/编辑/测试/删除已整合在邮箱工作区侧栏。
 * 若后续增加 `/[lang]/email/settings` 路由，可在此扩展表单或深链。
 */
export function EmailSettingsPage() {
  return (
    <Card className="m-6 max-w-xl">
      <CardHeader>
        <CardTitle>邮箱设置</CardTitle>
        <CardDescription>
          请在「邮箱」应用工作区完成账号绑定、编辑、连接测试与删除；发信与同步也在同一工作区操作。
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        侧栏提供「编辑配置」「测试连接」「删除绑定」(与手动「同步」按钮)。
      </CardContent>
    </Card>
  );
}
