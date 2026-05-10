import { CheckboxWidget } from "../../widgets/checkbox-widget";
import { DateWidget } from "../../widgets/date-widget";
import { MoneyWidget } from "../../widgets/money-widget";
import { NumberWidget } from "../../widgets/number-widget";
import { RadioWidget } from "../../widgets/radio-widget";
import { SelectWidget } from "../../widgets/select-widget";
import { TextWidget } from "../../widgets/text-widget";
import { TextareaWidget } from "../../widgets/textarea-widget";
import { UnsupportedWidget } from "../../widgets/unsupported-widget";

export const rjsfWidgets = {
  TextInput: TextWidget,
  Textarea: TextareaWidget,
  NumberInput: NumberWidget,
  MoneyInput: MoneyWidget,
  Select: SelectWidget,
  Radio: RadioWidget,
  Checkbox: CheckboxWidget,
  DateInput: DateWidget,
  UnsupportedWidget,
};

