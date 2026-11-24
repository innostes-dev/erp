import { ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { IsOptional, IsString, MaxLength, MinLength, ValidateNested, validateSync } from 'class-validator';
import { plainToInstance, Type } from 'class-transformer';
import { AllExceptionsFilter } from './exception.filter';
import { AccountLockedError, ConflictError, InvalidSetupTokenError, UnauthorizedError } from './errors';
import { clientIp } from './http';
import {
  RequestValidationException,
  UuidParamPipe,
  createValidationPipe,
  parseBoolQuery,
  parseIntQuery,
  parseOptionalUuidHeader,
  toValidationItems,
} from './validation';

beforeAll(() => Logger.overrideLogger(false));

function run(exception: unknown): { status: number; body: unknown; headers: Record<string, string> } {
  const headers: Record<string, string> = {};
  let status = 0;
  let body: unknown;
  const res = {
    headersSent: false,
    setHeader: (k: string, v: string) => (headers[k] = v),
    status(s: number) {
      status = s;
      return this;
    },
    json: (b: unknown) => (body = b),
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => res, getRequest: () => ({ path: '/x', method: 'GET' }) }),
  } as unknown as ArgumentsHost;
  new AllExceptionsFilter().catch(exception, host);
  return { status, body, headers };
}

describe('AllExceptionsFilter', () => {
  it('renders ServiceError as {detail, code} with headers', () => {
    const r = run(new AccountLockedError(42));
    expect(r.status).toBe(401);
    expect(r.body).toEqual({ detail: expect.stringContaining('temporarily locked'), code: 'account_locked' });
    expect(r.headers['Retry-After']).toBe('42');
    expect(r.headers['WWW-Authenticate']).toBe('Bearer');
  });
  it('omits code when the error has none', () => {
    expect(run(new ConflictError('x')).body).toEqual({ detail: 'x' });
    expect(run(new UnauthorizedError()).body).toEqual({ detail: 'Not authenticated' });
  });
  it('setup token errors advertise the header', () => {
    expect(run(new InvalidSetupTokenError()).headers['WWW-Authenticate']).toBe('SetupToken header="X-Setup-Token"');
  });
  it('renders validation errors as a 422 list', () => {
    const r = run(new RequestValidationException([{ loc: ['body', 'x'], msg: 'bad', type: 'value_error' }]));
    expect(r).toMatchObject({
      status: 422,
      body: { detail: [{ loc: ['body', 'x'], msg: 'bad', type: 'value_error' }] },
    });
  });
  it('maps throttling to 429 with a code', () => {
    expect(run(new ThrottlerException())).toMatchObject({ status: 429, body: { code: 'rate_limited' } });
  });
  it('maps framework 404s to {"detail":"Not Found"}', () => {
    expect(run(new HttpException('Cannot GET /nope', 404))).toMatchObject({
      status: 404,
      body: { detail: 'Not Found' },
    });
  });
  it('never leaks internals on unexpected errors', () => {
    const r = run(new Error('password=hunter2 failed'));
    expect(r).toMatchObject({ status: 500, body: { detail: 'Internal server error' } });
  });
});

class Inner {
  @IsString() @MinLength(2) name!: string;
}
class Outer {
  @IsString() @MinLength(8) @MaxLength(10) password!: string;
  @IsOptional() @IsString() note?: string;
  @ValidateNested() @Type(() => Inner) inner!: Inner;
}

describe('validation', () => {
  it('converts class-validator errors to FastAPI-style items with locations', () => {
    const errors = validateSync(plainToInstance(Outer, { password: 'x', inner: { name: 'a' } }));
    const items = toValidationItems(errors);
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ loc: ['body', 'password'], type: 'string_too_short' }),
        expect.objectContaining({ loc: ['body', 'inner', 'name'], type: 'string_too_short' }),
      ]),
    );
  });
  it('reports missing fields as "Field required"', () => {
    const items = toValidationItems(validateSync(plainToInstance(Outer, {})));
    expect(items).toContainEqual({ loc: ['body', 'password'], msg: 'Field required', type: 'missing' });
  });
  it('the global pipe throws RequestValidationException and strips unknown fields', async () => {
    const pipe = createValidationPipe();
    await expect(pipe.transform({ password: 'x' }, { type: 'body', metatype: Outer })).rejects.toBeInstanceOf(
      RequestValidationException,
    );
    const ok = await pipe.transform(
      { password: 'longenough', inner: { name: 'ab' }, extra: 1 },
      { type: 'body', metatype: Outer },
    );
    expect(ok).not.toHaveProperty('extra');
  });
  it('UUID path params', () => {
    const pipe = new UuidParamPipe();
    expect(pipe.transform('3F2B1C9E-5D8A-4F6B-9C2E-1A3B5C7D9E0F', { type: 'param', data: 'id' })).toBe(
      '3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f',
    );
    expect(() => pipe.transform('nope', { type: 'param', data: 'user_id' })).toThrow(RequestValidationException);
  });
  it('query helpers enforce bounds', () => {
    expect(parseIntQuery(undefined, 'limit', { def: 50, min: 1, max: 200 })).toBe(50);
    expect(parseIntQuery('200', 'limit', { def: 50, min: 1, max: 200 })).toBe(200);
    expect(() => parseIntQuery('201', 'limit', { def: 50, min: 1, max: 200 })).toThrow(RequestValidationException);
    expect(() => parseIntQuery('0', 'limit', { def: 50, min: 1, max: 200 })).toThrow(RequestValidationException);
    expect(() => parseIntQuery('abc', 'offset', { def: 0, min: 0 })).toThrow(RequestValidationException);
    expect(parseBoolQuery('true', 'b', false)).toBe(true);
    expect(parseBoolQuery(undefined, 'b', true)).toBe(true);
    expect(() => parseBoolQuery('maybe', 'b', false)).toThrow(RequestValidationException);
    expect(parseOptionalUuidHeader(undefined, 'X-Tenant-ID')).toBeUndefined();
    expect(() => parseOptionalUuidHeader('zzz', 'X-Tenant-ID')).toThrow(RequestValidationException);
  });
});

describe('password byte limit', () => {
  const check = async (password: string): Promise<number> => {
    const { validate } = await import('class-validator');
    const { UserCreate } = await import('../users/users.dto');
    return (await validate(Object.assign(new UserCreate(), { first_name: 'A', email: 'a@b.co', password }))).length;
  };
  it('accepts <=72 bytes and rejects longer passwords (bcrypt would truncate them)', async () => {
    expect(await check('a'.repeat(72))).toBe(0);
    expect(await check('a'.repeat(73))).toBe(1);
    expect(await check('é'.repeat(37))).toBe(1); // 74 bytes
    expect(await check('short')).toBe(1);
  });
  it('parseIntQuery rejects absurdly large numbers', () => {
    expect(() => parseIntQuery('9'.repeat(30), 'offset', { def: 0, min: 0, max: 2_147_483_647 })).toThrow(
      RequestValidationException,
    );
  });
});

describe('clientIp', () => {
  const req = (headers: Record<string, string>, ip: string | undefined, remote = '10.0.0.9') =>
    ({ headers, ip, socket: { remoteAddress: remote } }) as never;
  it('ignores a forged X-Forwarded-For: it only trusts the address Express resolved (req.ip)', () => {
    // With TRUST_PROXY=false Express reports the socket address, whatever the header says.
    expect(clientIp(req({ 'x-forwarded-for': '6.6.6.6' }, '10.0.0.9'))).toBe('10.0.0.9');
    expect(clientIp(req({ 'x-forwarded-for': '6.6.6.6' }, '203.0.113.5'))).toBe('203.0.113.5');
  });
  it('falls back to the socket and unwraps IPv4-mapped IPv6 addresses', () => {
    expect(clientIp(req({}, undefined))).toBe('10.0.0.9');
    expect(clientIp(req({}, '::ffff:192.0.2.7'))).toBe('192.0.2.7');
    expect(clientIp(req({}, '2001:db8::1'))).toBe('2001:db8::1');
  });
});
