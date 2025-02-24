import * as s from "superstruct";
import type { Infer } from "superstruct";
import { TABS_CARD_TAG_NAME } from "./constants";
import { HaFormSchema } from "../../utils/ha-form/ha-form";

export const lovelaceCardConfigStruct = s.object({
  index: s.optional(s.number()),
  view_index: s.optional(s.number()),
  view_layout: s.any(),
  type: s.string(),
  layout_options: s.any(),
  grid_options: s.any(),
  visibility: s.any(),
  show_warning: s.optional(s.boolean()),
  show_error: s.optional(s.boolean()),
  test_gui: s.optional(s.boolean()),
});

type LovelaceCardConfig = Infer<typeof lovelaceCardConfigStruct>;

export const layoutStruct = s.union([
  s.literal("horizontal"),
  s.literal("vertical"),
  s.literal("default"),
]);

export const appearanceSharedConfigStruct = s.object({
  layout: s.optional(layoutStruct),
  fill_container: s.optional(s.boolean()),
});

export type AppearanceSharedConfig = Infer<typeof appearanceSharedConfigStruct>;

const tabStruct = s.object({
  id: s.string(),
  label: s.string(),
  card: s.type({ type: s.string() }),
});

export type Tab = Infer<typeof tabStruct>;
export type Tabs = ReadonlyArray<Tab>;

export const tabsCardConfigStruct = s.assign(
  lovelaceCardConfigStruct,
  appearanceSharedConfigStruct,
  s.object({
    tabs: s.array(tabStruct)
  })
);

export type TabsCardConfig =
  & LovelaceCardConfig
  & AppearanceSharedConfig
  & Infer<typeof tabsCardConfigStruct>;

export const getInitialConfig = (): TabsCardConfig => {
  return {
    type: `custom:${TABS_CARD_TAG_NAME}`,
    tabs: [],
    layout: 'horizontal'
  };
}

export const tabFormSchema = [
  { name: "id", selector: { text: {} }, disabled: true },
  { name: "label", selector: { text: {} } },
] as const satisfies readonly HaFormSchema[];