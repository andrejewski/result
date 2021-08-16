import test, {ExecutionContext} from 'ava'
import {ok, err, Result} from './result'

// Ava's `fail` does not return `never` so we need to wrap it
function flunk(t: ExecutionContext<unknown>, message: string): never {
  t.fail(message)
  throw new Error('flunked')
}

test('ok() should return an ok value', t => {
  const result = ok(4)

  t.is(result.type, 'ok')
  t.is(result.isOk, true)
  t.is(result.isErr, false)
})

test('err() should return an err value', t => {
  const result = err(4)

  t.is(result.type, 'err')
  t.is(result.isOk, false)
  t.is(result.isErr, true)
})

test('ok.type should act as a narrow type guard', t => {
  const result = ok(1) as Result<number, never>
  if (result.type === 'err') {
    flunk(t, 'should have been an ok')
  }

  t.is(result.value, 1)
})

test('err.type should act as a narrow type guard', t => {
  const result = err(1) as Result<never, number>
  if (result.type === 'ok') {
    flunk(t, 'should have been an err')
  }

  t.is(result.error, 1)
})

test('ok.isOk should act as a narrow type guard', t => {
  const result = ok(1)
  if (!result.isOk) {
    flunk(t, 'should have been an ok')
  }

  t.is(result.value, 1)
})

test('err.isOk should act as a narrow type guard', t => {
  const result = err(1)
  if (result.isOk) {
    flunk(t, 'should have been an err')
  }

  t.is(result.error, 1)
})

test('ok.isErr should act as a narrow type guard', t => {
  const result = ok(1)
  if (result.isErr) {
    flunk(t, 'should have been an ok')
  }

  t.is(result.value, 1)
})

test('err.isErr should act as a narrow type guard', t => {
  const result = err(1)
  if (!result.isErr) {
    flunk(t, 'should have been an err')
  }

  t.is(result.error, 1)
})

test('ok.match should return the ok value', t => {
  const value = ok(1).match({
    ok (value) {
      t.is(value, 1)
      return value
    },
    err () {
      flunk(t, 'should be ok')
    }
  })

  ok(3).valueOf()

  t.is(value, 1)
})

test('err.match should return the err error', t => {
  const error = err(1).match({
    ok () {
      flunk(t, 'should be err')
    },
    err (error) {
      t.is(error, 1)
      return error
    }
  })

  t.is(error, 1)
})

test('result.andThen should return a new result if ok', t => {
  const foo = ok(1)
  const bar = foo.andThen(value => {
    t.is(value, 1)
    return ok(2)
  })

  if (bar.isErr) {
    flunk(t, 'expected ok')
  }

  t.is(bar.value, 2)
})

test('result.andThen should return the current result if err', t => {
  const foo = err(1)
  const bar = foo.andThen(() => {
    flunk(t, 'should not call fn')
  })

  if (bar.isOk) {
    flunk(t, 'expected err')
  }

  t.is(bar.error, 1)
})

test('result.orElse should return a new result if err', t => {
  const foo = err(1)
  const bar = foo.orElse((error) => {
    t.is(error, 1)
    return err(2)
  })

  if (bar.isOk) {
    flunk(t, 'expected err')
  }

  t.is(bar.error, 2)
})

test('result.orElse should return the current result if ok', t => {
  const foo = ok(1)
  const bar = foo.orElse(() => {
    flunk(t, 'should not call fn')
  })

  if (bar.isErr) {
    flunk(t, 'expected ok')
  }

  t.is(bar.value, 1)
})

test('result.map should return a new result if ok', t => {
  const foo = ok(1)
  const bar = foo.map(value => {
    t.is(value, 1)
    return 2
  })

  if (bar.isErr) {
    flunk(t, 'expected ok')
  }

  t.is(bar.value, 2)
})

test('result.map should return the current result if err', t => {
  const foo = err(1)
  const bar = foo.map(() => {
    flunk(t, 'should not call fn')
  })

  if (bar.isOk) {
    flunk(t, 'expected err')
  }

  t.is(bar.error, 1)
})

test('result.mapErr should return a new result if err', t => {
  const foo = err(1)
  const bar = foo.mapErr((error) => {
    t.is(error, 1)
    return 2
  })

  if (bar.isOk) {
    flunk(t, 'expected err')
  }

  t.is(bar.error, 2)
})

test('result.mapErr should return the current result if ok', t => {
  const foo = ok(1)
  const bar = foo.mapErr(() => {
    flunk(t, 'should not call fn')
  })

  if (bar.isErr) {
    flunk(t, 'expected ok')
  }

  t.is(bar.value, 1)
})