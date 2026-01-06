import type { NoteContext, FilterGroup, FilterItem } from './types.js';

export interface FilterEvalResult {
  matches: boolean;
  warnings: string[];
}

export class FilterParser {
  private warnings: string[] = [];

  evaluateFilterGroup(group: FilterGroup | undefined, ctx: NoteContext): FilterEvalResult {
    this.warnings = [];
    
    if (!group) {
      return { matches: true, warnings: [] };
    }

    const matches = this.evalGroup(group, ctx);
    return { matches, warnings: this.warnings };
  }

  private evalGroup(group: FilterGroup, ctx: NoteContext): boolean {
    if (group.and) {
      return group.and.every(item => this.evalItem(item, ctx));
    }
    if (group.or) {
      return group.or.some(item => this.evalItem(item, ctx));
    }
    return true;
  }

  private evalItem(item: FilterItem, ctx: NoteContext): boolean {
    if (typeof item === 'string') {
      return this.evalExpression(item, ctx);
    }
    return this.evalGroup(item, ctx);
  }

  private evalExpression(expr: string, ctx: NoteContext): boolean {
    const trimmed = expr.trim();

    // file.hasTag("x")
    const hasTagMatch = trimmed.match(/^file\.hasTag\(["'](.+?)["']\)$/);
    if (hasTagMatch && hasTagMatch[1]) {
      return this.hasTag(ctx, hasTagMatch[1]);
    }

    // tags.contains("x") or file.tags.contains("x")
    const tagsContainsMatch = trimmed.match(/^(?:file\.)?tags\.contains\(["'](.+?)["']\)$/);
    if (tagsContainsMatch && tagsContainsMatch[1]) {
      return this.tagsContains(ctx, tagsContainsMatch[1]);
    }

    // file.path.startsWith("x")
    const pathStartsMatch = trimmed.match(/^file\.path\.startsWith\(["'](.+?)["']\)$/);
    if (pathStartsMatch && pathStartsMatch[1]) {
      return ctx.filePath.startsWith(pathStartsMatch[1]);
    }

    // property.startsWith("x")
    const propStartsMatch = trimmed.match(/^(\w+)\.startsWith\(["'](.+?)["']\)$/);
    if (propStartsMatch && propStartsMatch[1] && propStartsMatch[2] && propStartsMatch[1] !== 'file') {
      const val = ctx.frontmatter[propStartsMatch[1]];
      return typeof val === 'string' && val.startsWith(propStartsMatch[2]);
    }

    // property.contains("x")
    const propContainsMatch = trimmed.match(/^(\w+)\.contains\(["'](.+?)["']\)$/);
    if (propContainsMatch && propContainsMatch[1] && propContainsMatch[2]) {
      return this.propertyContains(ctx, propContainsMatch[1], propContainsMatch[2]);
    }

    // property.containsAny("x", "y", ...)
    const containsAnyMatch = trimmed.match(/^(\w+)\.containsAny\((.+)\)$/);
    if (containsAnyMatch && containsAnyMatch[1] && containsAnyMatch[2]) {
      const values = this.parseStringArgs(containsAnyMatch[2]);
      return this.propertyContainsAny(ctx, containsAnyMatch[1], values);
    }

    // property.isEmpty()
    const isEmptyMatch = trimmed.match(/^(\w+)\.isEmpty\(\)$/);
    if (isEmptyMatch && isEmptyMatch[1]) {
      return this.isEmpty(ctx, isEmptyMatch[1]);
    }

    // file.ctime/file.mtime comparisons with today()
    const fileDateMatch = trimmed.match(/^file\.(ctime|mtime)\s*(>|<|>=|<=|==|!=)\s*today\(\)\s*-\s*["'](\d+)d["']$/);
    if (fileDateMatch && fileDateMatch[1] && fileDateMatch[2] && fileDateMatch[3]) {
      const field = fileDateMatch[1] as 'ctime' | 'mtime';
      const op = fileDateMatch[2];
      const days = parseInt(fileDateMatch[3], 10);
      const compareDate = this.daysAgo(days);
      const fileDate = ctx[field];
      return this.compareDates(fileDate, op, compareDate);
    }

    // frontmatter date property comparisons with today()
    const datePropMatch = trimmed.match(/^(\w+)\s*(>|<|>=|<=|==|!=)\s*today\(\)\s*-\s*["'](\d+)d["']$/);
    if (datePropMatch && datePropMatch[1] && datePropMatch[2] && datePropMatch[3]) {
      const prop = datePropMatch[1];
      const op = datePropMatch[2];
      const days = parseInt(datePropMatch[3], 10);
      const compareDate = this.daysAgo(days);
      const propValue = ctx.frontmatter[prop];
      if (!propValue) return false;
      const propDate = new Date(propValue);
      if (isNaN(propDate.getTime())) return false;
      return this.compareDates(propDate, op, compareDate);
    }

    // property == "value" or property == value
    const eqMatch = trimmed.match(/^(\w+(?:\.\w+)?)\s*==\s*["']?(.+?)["']?$/);
    if (eqMatch && eqMatch[1] && eqMatch[2]) {
      return this.propertyEquals(ctx, eqMatch[1], eqMatch[2]);
    }

    // property != "value" or property != value
    const neqMatch = trimmed.match(/^(\w+(?:\.\w+)?)\s*!=\s*["']?(.+?)["']?$/);
    if (neqMatch && neqMatch[1] && neqMatch[2]) {
      return !this.propertyEquals(ctx, neqMatch[1], neqMatch[2]);
    }

    // Unsupported expression - warn and return true (graceful degradation)
    this.warnings.push(`Unsupported filter: ${trimmed}`);
    return true;
  }

  private hasTag(ctx: NoteContext, tag: string): boolean {
    const normalizedTag = tag.startsWith('#') ? tag.slice(1) : tag;
    return ctx.tags.some(t => {
      if (typeof t !== 'string') return false;
      return t === normalizedTag || t === `#${normalizedTag}`;
    });
  }

  private tagsContains(ctx: NoteContext, substring: string): boolean {
    const normalized = substring.startsWith('#') ? substring.slice(1) : substring;
    return ctx.tags.some(t => {
      if (typeof t !== 'string') return false;
      const tagNorm = t.startsWith('#') ? t.slice(1) : t;
      return tagNorm.includes(normalized);
    });
  }

  private propertyContains(ctx: NoteContext, prop: string, substring: string): boolean {
    const val = this.getPropertyValue(ctx, prop);
    if (typeof val === 'string') {
      return val.includes(substring);
    }
    if (Array.isArray(val)) {
      return val.some(v => typeof v === 'string' && v.includes(substring));
    }
    return false;
  }

  private propertyContainsAny(ctx: NoteContext, prop: string, values: string[]): boolean {
    const val = this.getPropertyValue(ctx, prop);
    if (typeof val === 'string') {
      return values.some(v => val.includes(v));
    }
    if (Array.isArray(val)) {
      return val.some(item => 
        typeof item === 'string' && values.some(v => item.includes(v))
      );
    }
    return false;
  }

  private isEmpty(ctx: NoteContext, prop: string): boolean {
    const val = this.getPropertyValue(ctx, prop);
    if (val === undefined || val === null) return true;
    if (typeof val === 'string') return val.trim() === '';
    if (Array.isArray(val)) return val.length === 0;
    return false;
  }

  private propertyEquals(ctx: NoteContext, prop: string, value: string): boolean {
    const val = this.getPropertyValue(ctx, prop);
    if (val === undefined || val === null) return false;
    
    if (typeof val === 'string') {
      return val === value;
    }
    if (typeof val === 'number') {
      return val === Number(value);
    }
    if (typeof val === 'boolean') {
      return val === (value === 'true');
    }
    if (Array.isArray(val)) {
      return val.includes(value);
    }
    return String(val) === value;
  }

  private getPropertyValue(ctx: NoteContext, prop: string): unknown {
    if (prop.startsWith('file.')) {
      const field = prop.slice(5);
      switch (field) {
        case 'name': return ctx.fileName;
        case 'path': return ctx.filePath;
        case 'ctime': return ctx.ctime;
        case 'mtime': return ctx.mtime;
        case 'tags': return ctx.tags;
      }
    }
    return ctx.frontmatter[prop];
  }

  private daysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private compareDates(date: Date, op: string, compareDate: Date): boolean {
    const t1 = date.getTime();
    const t2 = compareDate.getTime();
    switch (op) {
      case '>': return t1 > t2;
      case '<': return t1 < t2;
      case '>=': return t1 >= t2;
      case '<=': return t1 <= t2;
      case '==': return t1 === t2;
      case '!=': return t1 !== t2;
      default: return false;
    }
  }

  private parseStringArgs(argsStr: string): string[] {
    const results: string[] = [];
    const regex = /["']([^"']+)["']/g;
    let match;
    while ((match = regex.exec(argsStr)) !== null) {
      if (match[1]) {
        results.push(match[1]);
      }
    }
    return results;
  }
}
