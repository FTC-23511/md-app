/**
 * Pure evaluator for VisibilityCondition objects. See docs/phase1/03-forms.md §2.5.
 *
 * Inputs:
 *   - cond: the condition (or undefined → always visible)
 *   - values: { fieldName → current value }. For select fields, value is the option_lists.id UUID.
 *   - optionsByCategory: { category → OptionListRow[] }. Used by equalsOptionValue to
 *     resolve human values like 'individual' to the option's UUID at runtime.
 */

import type { OptionCategory, OptionListRow, VisibilityCondition } from '@/entries/_types';

export function isVisible(
  cond: VisibilityCondition | undefined,
  values: Record<string, unknown>,
  optionsByCategory: Partial<Record<OptionCategory, OptionListRow[]>>,
): boolean {
  if (!cond) return true;

  if ('all' in cond) return cond.all.every((c) => isVisible(c, values, optionsByCategory));
  if ('any' in cond) return cond.any.some((c) => isVisible(c, values, optionsByCategory));

  const fieldValue = values[cond.field];

  if ('equalsOptionValue' in cond) {
    const opts = optionsByCategory[cond.category] ?? [];
    const target = opts.find((o) => o.value === cond.equalsOptionValue);
    return target ? fieldValue === target.id : false;
  }
  if ('equals' in cond) return fieldValue === cond.equals;
  if ('truthy' in cond) return Boolean(fieldValue);
  if ('in' in cond) return cond.in.includes(fieldValue);
  return true;
}
