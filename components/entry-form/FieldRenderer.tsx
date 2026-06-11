'use client';

import type { FieldBlock, OptionCategory, OptionListRow, RawDataTableMode } from '@/entries/_types';
import type { MatrixInput } from '@/lib/compute/decision-matrix';
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
import { AlternativesBlock } from './blocks/AlternativesBlock';
import { MatrixBlock } from './blocks/MatrixBlock';
import { FmeaBlock } from './blocks/FmeaBlock';
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
  defaults,
}: {
  block: FieldBlock;
  optionsByCategory: Partial<Record<OptionCategory, OptionListRow[]>>;
  error?: string;
  /** Live form values, used to resolve a raw-data-table's `modeField`. */
  values?: Record<string, unknown>;
  /** Stored values when pre-filling (the 2E complete-this-entry flow). */
  defaults?: Record<string, unknown>;
}) {
  const d = defaults?.[block.name];
  const dString = typeof d === 'string' ? d : undefined;
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} defaultValue={dString} error={error} />;
    case 'long-text':
      return <LongTextBlock block={block} defaultValue={dString} error={error} />;
    case 'date':
      return <DateBlock block={block} defaultValue={dString} error={error} />;
    case 'number':
      return <NumberBlock block={block} error={error} />;
    case 'single-select':
      return (
        <SingleSelectBlock
          block={block}
          options={optionsByCategory[block.category] ?? []}
          defaultValue={dString}
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
    case 'alternatives':
      return (
        <AlternativesBlock
          block={block}
          defaultValue={Array.isArray(d) ? (d as Array<Record<string, string>>) : undefined}
          error={error}
        />
      );
    case 'matrix':
      return (
        <MatrixBlock
          block={block}
          defaultValue={d && typeof d === 'object' ? (d as MatrixInput) : undefined}
          error={error}
        />
      );
    case 'fmea':
      return (
        <FmeaBlock
          block={block}
          defaultValue={Array.isArray(d) ? (d as Array<Record<string, string>>) : undefined}
          error={error}
        />
      );
    case 'raw-data-table': {
      const raw = block.modeField ? values?.[block.modeField] : undefined;
      const mode =
        typeof raw === 'string' && RAW_MODES.has(raw) ? (raw as RawDataTableMode) : undefined;
      return <RawDataTableBlock block={block} error={error} mode={mode} />;
    }
    case 'computed-readonly':
      return <ComputedReadonlyBlock block={block} error={error} />;
    case 'choice':
      return <ChoiceBlock block={block} defaultValue={dString} error={error} />;
    case 'checkbox':
      return (
        <CheckboxBlock block={block} defaultChecked={d === true ? true : undefined} error={error} />
      );
    case 'section-header':
      return <SectionHeaderBlock block={block} />;
  }
}
