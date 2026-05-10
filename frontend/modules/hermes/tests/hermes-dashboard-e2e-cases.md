# Hermes Dashboard E2E Cases

## Case 1: Finance KPI Card Render
- Given toolName = `finance.kpi.summary`
- And payload passes FinanceToolResultSchema
- Then HermesToolRenderer should render 3 KPI cards
- And clicking one KPI card should patch dashboard context:
  - `selectedMetricKey`
  - `filters.injectedFrom = tool-ui-card`

## Case 2: Receivable Aging Table Render
- Given toolName = `finance.receivable.aging`
- Then aging table rows are visible
- Clicking row `90+` should inject `agingBucket = "90+"`

## Case 3: Risk Alert Summary Render
- Given toolName = `risk.alert.summary`
- Then risk alert card should render:
  - level
  - topic
  - recommendation
- Clicking card should inject:
  - `riskTopic`
  - `riskLevel`

## Case 4: Forecast Summary Render
- Given toolName = `forecast.summary`
- Then forecast summary card should render
- Clicking card should inject:
  - `forecastPeriod`

## Case 5: Mock Mode Fallback
- Given `NEXT_PUBLIC_HERMES_MOCK_MODE=true`
- And tool payload is null
- Then renderer should use mock factory payload

## Case 6: Schema Failure
- Given malformed payload missing required fields
- Then schema parse must fail
- And HermesToolRenderer should render generic error card
