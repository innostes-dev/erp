import {
  ArgumentMetadata,
  PipeTransform,
  Injectable,
  ValidationError,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';

export interface ValidationItem {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/** Thrown for any request validation failure; rendered as FastAPI-style `422 {"detail":[{loc,msg,type}]}`. */
export class RequestValidationException extends Error {
  constructor(readonly items: ValidationItem[]) {
    super('Request validation failed');
  }
}

const TYPE_BY_CONSTRAINT: Record<string, string> = {
  isDefined: 'missing',
  isNotEmpty: 'string_too_short',
  isString: 'string_type',
  isEmail: 'value_error',
  minLength: 'string_too_short',
  maxLength: 'string_too_long',
  maxBytes: 'string_too_long',
  length: 'string_too_short',
  matches: 'string_pattern_mismatch',
  isEnum: 'enum',
  isIn: 'enum',
  isInt: 'int_parsing',
  isBoolean: 'bool_parsing',
  isUUID: 'uuid_parsing',
  min: 'greater_than_equal',
  max: 'less_than_equal',
  isArray: 'list_type',
  isObject: 'model_attributes_type',
  nestedValidation: 'model_attributes_type',
};

function flatten(errors: ValidationError[], loc: (string | number)[], out: ValidationItem[]): void {
  for (const err of errors) {
    const here = [...loc, err.property];
    if (err.constraints) {
      if (err.value === undefined || err.value === null) {
        const missing = err.value === undefined;
        const key = Object.keys(err.constraints)[0];
        out.push(
          missing
            ? { loc: here, msg: 'Field required', type: 'missing' }
            : { loc: here, msg: Object.values(err.constraints)[0], type: TYPE_BY_CONSTRAINT[key] ?? 'value_error' },
        );
      } else {
        for (const [key, msg] of Object.entries(err.constraints)) {
          out.push({ loc: here, msg, type: TYPE_BY_CONSTRAINT[key] ?? 'value_error' });
        }
      }
    }
    if (err.children?.length) flatten(err.children, here, out);
  }
}

export function toValidationItems(errors: ValidationError[]): ValidationItem[] {
  const out: ValidationItem[] = [];
  flatten(errors, ['body'], out);
  return out;
}

export function createValidationPipe(extra: ValidationPipeOptions = {}): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidUnknownValues: false,
    exceptionFactory: (errors) => new RequestValidationException(toValidationItems(errors)),
    ...extra,
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

/** Validates a UUID path parameter (422 with loc ["path", name]). */
@Injectable()
export class UuidParamPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!isUuid(value)) {
      throw new RequestValidationException([
        {
          loc: ['path', metadata.data ?? 'id'],
          msg: 'Input should be a valid UUID, invalid character or length',
          type: 'uuid_parsing',
        },
      ]);
    }
    return value.toLowerCase();
  }
}

/** Optional UUID header (e.g. X-Tenant-ID). Returns undefined when absent. */
export function parseOptionalUuidHeader(value: string | string[] | undefined, name: string): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === undefined || v === '') return undefined;
  if (!isUuid(v)) {
    throw new RequestValidationException([
      { loc: ['header', name], msg: 'Input should be a valid UUID, invalid character or length', type: 'uuid_parsing' },
    ]);
  }
  return v.toLowerCase();
}

export function parseIntQuery(raw: unknown, name: string, opts: { def: number; min: number; max?: number }): number {
  if (raw === undefined || raw === '') return opts.def;
  const s = Array.isArray(raw) ? String(raw[0]) : String(raw);
  const bad = (msg: string, type: string): never => {
    throw new RequestValidationException([{ loc: ['query', name], msg, type }]);
  };
  if (!/^-?\d{1,15}$/.test(s))
    return bad('Input should be a valid integer, unable to parse string as an integer', 'int_parsing');
  const n = Number(s);
  if (n < opts.min) return bad(`Input should be greater than or equal to ${opts.min}`, 'greater_than_equal');
  if (opts.max !== undefined && n > opts.max)
    return bad(`Input should be less than or equal to ${opts.max}`, 'less_than_equal');
  return n;
}

export function parseBoolQuery(raw: unknown, name: string, def: boolean): boolean {
  if (raw === undefined || raw === '') return def;
  const s = (Array.isArray(raw) ? String(raw[0]) : String(raw)).toLowerCase();
  if (['true', '1', 'yes', 'on', 't', 'y'].includes(s)) return true;
  if (['false', '0', 'no', 'off', 'f', 'n'].includes(s)) return false;
  throw new RequestValidationException([
    { loc: ['query', name], msg: 'Input should be a valid boolean, unable to interpret input', type: 'bool_parsing' },
  ]);
}
