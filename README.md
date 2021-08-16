# @andrejewski/result

A result type written in TypeScript

```sh
npm install @andrejewski/result
```

```ts
import { Result, ok, err } from '@andrejewski/result'

function parseJSON (json: string): Result<unknown, SyntaxError> {
  try {
    return ok(JSON.parse(json))
  } catch (error) {
    if (error instanceof SyntaxError) {
      return err(error)
    }

    throw error
  }
}

const parseResult = parseJSON('{"foo": "bar"}')
const fooResult = parseResult.andThen(value => {
  if (!(value && value.foo && typeof value.foo === 'string')) {
    err(new Error('Field `foo` must be of type string'))
  }

  return ok(value.foo)
})

const foo = fooResult.match({
  ok (value) {
    return value
  },
  err (error) {
    throw error
  }
})
```

## Documentation

See the type definitions and code comments for detailed documentation.

## Cool features

### Limited constructors

There's only two ways to create result types: `ok` and `err`.
Nice and short: no need to use `new Result(x, y)`, `new Ok(x)`, etc.

### Type narrowing

To let Typescript help us, we enable type guards via discriminated unions on multiple fields, so we can write clean branches:

```ts
import { Result, ok } from '@andrejewski/result'

const result = ok(1) as Result<number, never>

// Type guard using `type` property
if (result.type === 'ok') {
  // We can now access `value`
  console.log(result.value)
} else {
  // We can now access `error`
  console.log(result.error)
}

// Type guard using `isOk` property
if (result.isOk) {
  // We can now access `value`
  console.log(result.value)
} else {
  // We can now access `error`
  console.log(result.error)
}

// Type guard using `isErr` property
if (result.isErr) {
  // We can now access `error`
  console.log(result.error)
} else {
  // We can now access `value`
  console.log(result.value)
}
```

### A lack of features

Hey now, lack of features is totally a feature!

#### No `unwrap`

You'll notice I didn't add some "niceties" like `Result#unwrap`, which throws the err component and returns the ok component of a result.
Including those methods makes it too easy to use them internally whereas they should really only be used, if at all, at the edges of a system.
Folks can build there own on top but the friction of doing so is a feature.

#### No `toJSON`

We don't provide any common mechanism for JSON de/serialization because it has many quirks. These can be built on top but don't need to be in this package.

#### No `try` sugar

If you are coming from Rust, you'll have loved the `result?` unwrapping sugar. Unfortunately that type of sugar, even as written as `unwrap(result)` instead of a macro, is not going to be helped by TypeScript. Simply put, there's no good way to have a good error type derived from successive calls of a function:

```ts
const result = Result.try(unwrap => {
  const a = unwrap(fnErrorsA())
  const b = unwrap(fnErrorsB(a))
  return ok(nonResultFn(b))
})
```

Here, the best we could do is `result` having type `Result<typeof b, unknown>` but that's not good enough!
I don't wanna have to re-check for all the potential errors.  
So we don't include any syntactic sugar to make this easier, preferring correctness and precise types.

## Why not use X?

There are alternatives to this package's take on result type.
Here are some and why I'm not using them:

### [`result`](https://www.npmjs.com/package/result):

- Large surface area: tons of methods that aren't necessary
- `.then` and `.node` smatter against Promise and callback asynchrony
- No TypeScript types

### [`result-js`](https://www.npmjs.com/package/result-js)

- No TypeScript types
- Verbose methods for checking type e.g. `result.isOk()` that can't type guard
- Verbose constructors `fromSuccess` and `fromError` which mismatch `ok`/`err` naming
- Many `unwrap*` methods which make it too easy to use exceptions

### [`typescript-result`](https://www.npmjs.com/package/typescript-result)

- Poor Typescript types
- Couples the `err` type to `Error` which need not be the case
- Puts the `err` type on the leftmost type parameter which is very confusing to read
- Provides weird `Result.safe` method

### [`ts-results`](https://www.npmjs.com/package/ts-results)

- Includes an `Option` type which isn't needed in JavaScript/Typescript
- Member `ok.val` is the same in `err.val` meaning you don't need to narrow the type to access the value, and you might forget to do that
- Includes `expect` and `unwrap` methods which encourage exceptions
