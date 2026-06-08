'use client';

import type { FieldBlock, OptionCategory, OptionListRow, RawDataTableMode } from '@/entries/_types';
import { TextBlock } from './blocks/TextBlock';
import { LongTextBlock } from './blocks/LongTextBlock';
import { DateBlock } from './blocks/DateBlock';
import { NumberBlock } from './blocks/NumberBlock';
import { SingleSelectBlock } from './blocks/SingleSelectBlock';
import { MultiSelectBlock } from './blocks/MultiSelectBlock';
import { PersonAttributionBlock } from './blocks/PersonAttributionBlock';
import { ActionItemsBlock } from './blocks/ActionItemsBlock';
import { StoryBlock } from './blocks/StoryBlock';
import { SpecialtyTriggersBlock } from './blocks/SpecialtyTriggersBlock';
import { RepeatingRowsBlock } from './blocks/RepeatingRowsBlock';
import { RawDataTableBlock } from './blocks/RawDataTableBlock';
import { ComputedReadonlyBlock } from './blocks/ComputedReadonlyBlock';
import { ChoiceBlock } from './blocks/ChoiceBlock';
import { CheckboxBlock } from './blocks/CheckboxBlock';
import { SectionHeaderBlock } from './blocks/SectionHeaderBlock';

const RAW_MODES: ReadonlySet<string> = new Set(['pass_fail', 'single_measure', 'custom']);

export function FieldRenderer({
  block,
  optionsByCategory,
  error,
  values,
}: {
  block: FieldBlock;
  optionsByCategory: Partial<Record<OptionCategory, OptionListRow[]>>;
  error?: string;
  /** Live form values, used to resolve a raw-data-table's `modeField`. */
  values?: Record<string, unknown>;
}) {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} error={error} />;
    case 'long-text':
      return <LongTextBlock block={block} error={error} />;
    case 'date':
      return <DateBlock block={block} error={error} />;
    case 'number':
      return <NumberBlock block={block} error={error} />;
    case 'single-select':
      return (
        <SingleSelectBlock
          block={block}
          options={optionsByCategory[block.category] ?? []}
          error={error}
        />
      );
    case 'multi-select':
      return (
        <MultiSelectBlock
          block={block}
          options={optionsByCategory[block.category] ?? []}
          error={error}
        />
      );
    case 'person-attribution':
      return <PersonAttributionBlock block={block} error={error} />;
    case 'action-items':
      return <ActionItemsBlock block={block} error={error} />;
    case 'story-block':
      return <StoryBlock block={block} error={error} />;
    case 'specialty-triggers':
      return <SpecialtyTriggersBlock block={block} error={error} />;
    case 'repeating-rows':
      return <RepeatingRowsBlock block={block} error={error} />;
    case 'raw-data-table': {
      const raw = block.modeField ? values?.[block.modeField] : undefined;
      const mode =
        typeof raw === 'string' && RAW_MODES.has(raw) ? (raw as RawDataTableMode) : undefined;
      return <RawDataTableBlock block={block} error={error} mode={mode} />;
    }
    case 'computed-readonly':
      return <ComputedReadonlyBlock block={block} error={error} />;
    case 'choice':
      return <ChoiceBlock block={block} error={error} />;
    case 'checkbox':
      return <CheckboxBlock block={block} error={error} />;
    case 'section-header':
      return <SectionHeaderBlock block={block} />;
  }
}
