/**
 * To prevent sub-classing or other funky inheritance,
 * we restrict construction of Result types to this module.
 */
type PrivateConstructorMarker = {}
const constructorMarker: PrivateConstructorMarker = {}

function assertPrivateConstructor(marker: PrivateConstructorMarker) {
  if (marker !== constructorMarker) {
    throw new Error(`This function can only be called by Result internals.`)
  }
}

/**
 * To prevent values from being mutated at run-time,
 * we freeze properties and seal the objects from extension.
 */
function preventAbuse(obj: Object): void {
  Object.freeze(obj)
  Object.seal(obj)
}

interface IResult<V, E> {
  /**
   * The type of the result.
   * If the result is ok, this is `"ok"`.
   * If the result is err, this is `"err"`.
   * */
  readonly type: 'ok' | 'err';

  /**
   * Whether the result is ok.
   * If the result is ok, this is true.
   * If the result is err, this is false.
   * */
  readonly isOk: boolean;

  /**
   * Whether the result is err.
   * If the result is ok, this is false.
   * If the result is err, this is true.
   * */
  readonly isErr: boolean;

  /**
   * Match on the type of the result.
   * If the result is ok, the `ok` method will be called with the value.
   * If the result is err, the `err` method will be called with the error.
   */
  match<A, B> ({ok, err} : {
    ok: (value: V) => A,
    err: (error: E) => B
  }): A | B

  /**
   * Build a new result using the ok value.
   * If the result is ok, the result of `fn` function called with the value is returned.
   * If the result is err, the result is returned.
   */
  andThen<A, B> (fn: (value: V) => Result<A, B>): Result<A, B> | Err<never, E>

  /**
   * Build a new result using the err error.
   * If the result is ok, the result is returned.
   * If the result is err, the result of `fn` function called with the error is returned.
   */
  orElse<A, B> (fn: (error: E) => Result<A, B>): Result<A, B> | Ok<V, never>

  /**
   * Map from one ok value to another.
   * If the result is ok, the return of `fn` is returned as an ok result.
   * If the result is err, the result is returned.
   */
  map<T> (fn: (value: V) => T): Result<T, E>

  /**
   * Map from one err error to another.
   * If the result is ok, the result is returned.
   * If the result is err, the return of `fn` is returned as an err result.
   */
  mapErr<T> (fn: (value: E) => T): Result<V, T>
}

class Ok<V, E> implements IResult<V, E> {
  readonly type = 'ok' as const
  readonly isOk = true as const
  readonly isErr = false as const
  readonly value: V

  constructor (value: V, marker: PrivateConstructorMarker) {
    assertPrivateConstructor(marker)
    this.value = value
    preventAbuse(this)
  }

  match<A, B> ({ok, err: _err} : {
    ok: (value: V) => A,
    err: (error: never) => B
  }): A {
    return ok(this.value)
  }

  andThen<A, B> (fn: (value: V) => Result<A, B>): Result<A, B> {
    return fn(this.value)
  }

  orElse (_fn: (error: never) => never): Ok<V, never> {
    return this
  }

  map<T> (fn: (value: V) => T): Ok<T, never> {
    return ok(fn(this.value))
  }

  mapErr (_fn: (error: never) => never): Ok<V, never> {
    return this
  }
}

class Err<V, E> implements IResult<V, E> {
  readonly type = 'err' as const
  readonly isOk = false as const
  readonly isErr = true as const
  readonly error: E

  constructor (error: E, marker: PrivateConstructorMarker) {
    assertPrivateConstructor(marker)
    this.error = error
    preventAbuse(this)
  }

  match<A, B> ({ok: _ok, err} : {
    ok: (value: never) => A,
    err: (error: E) => B
  }): B {
    return err(this.error)
  }

  andThen (_fn: (value: never) => never): Err<never, E> {
    return this
  }

  orElse<A, B> (fn: (error: E) => Result<A, B>): Result<A, B> {
    return fn(this.error)
  }

  map (_fn: (value: never) => never): Err<never, E> {
    return this
  }

  mapErr<T> (fn: (error: E) => T): Err<never, T> {
    return err(fn(this.error))
  }
}

/**
 * A result containing either an `ok` value or an `err` error.
 * Results can be constructed via `ok(value)` or `err(error)`.
 */
export type Result<V, E> = Ok<V, E> | Err<V, E>

/**
 * Create an ok result type containing `value`.
 */
export function ok<V> (value: V): Ok<V, never> {
  return new Ok(value, constructorMarker)
}

/**
 * Create an err result type containing `error`.
 */
export function err<E> (error: E): Err<never, E> {
  return new Err(error, constructorMarker)
}