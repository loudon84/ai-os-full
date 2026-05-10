# Acceptance Tests

## AC-01：选区分析

```gherkin
Given 用户打开 workbook
And 用户选中 A1:D20
When 用户点击 AI 并输入 "分析异常数据"
Then 前端生成 SheetRangeContext
And 调用 Facade 创建 interaction
And 面板展示 task running
And 最终展示 analysis.summary
```

## AC-02：公式生成 + Patch Preview + Apply

```gherkin
Given 用户选中 E2:E20
When 用户输入 "根据销售额和成本生成毛利率公式"
Then Agent 返回 set_cell_formulas patch
And 前端展示 Patch Preview
And 用户点击 Apply 后公式写入 Univer
And patch decision 被记录到 Facade
```

## AC-03：禁止直接写入

```gherkin
Given Agent 返回 patch
When 用户未点击 Apply
Then Univer workbook 不发生任何变更
```

## AC-04：版本保存（追溯字段）

```gherkin
Given 用户已 apply patch
When 用户点击保存
Then 当前 workbook snapshot 上传 MinIO
And PostgreSQL 写入新 version index
And version index 关联 patch_id / interaction_id
```

## AC-05：上下文限制

```gherkin
Given 用户选中超过 3000 个单元格
When 用户提交 AI 请求
Then 前端阻止提交
And 提示用户缩小选区
```

