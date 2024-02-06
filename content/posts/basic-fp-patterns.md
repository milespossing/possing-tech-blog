---
title: "Basic FP Patterns: A code review"
tags:
    - Code Review
    - Code Patterns
    - Functional Programming
date: 2024-02-06
author: Miles Possing
---

I recently put in a PR on my team in the Microsoft Royalties system and,
as the content of the code was _highly_ FP oriented, I've received a lot
of questions on it. I'll use this space to review a few of the patterns
I find myself using on a daily basis.

For more specific api documentation, I also encourage readers to review
some of the basics of [fp-ts](https://gcanti.github.io/fp-ts/), I'd say
that's a wonderful place for the functionally inclined to start, and
just pick out a couple of helpful types and functions.

## The Pipe

A "Pipe" in most functional languages will be familiar to most UNIX
practitioners, it's effectively an operator which specifies that the
outputs of one function should be fed into another. For example (in bash):

```bash
❯ ls | rg .json | xargs wc
   14    25   288 host.json
    9    15   235 local.settings.json
  945  1729 34891 package-lock.json
   22    53   509 package.json
    9    17   162 tsconfig.json
  999  1839 36085 total
```

The above simply articulates that one should:

1. List the files in a directory
2. Use [ripgrep](https://github.com/BurntSushi/ripgrep) to find all .json files
3. pass each file into wc (word count) using xargs

Well it turns out that all the time I've spent in CLIs has paid off
in a few ways. fp-ts provides a couple of important pipes, I'll show
some basic examples now:

```typescript
pipe(
    withContracts,
    A.filterMap(O.fromEither), // filterMap :: (f :: A -> Option<B>) -> A[] -> B[]
    A.map(sendPayments), // map :: (f :: A -> B) -> A[] -> B[]
    T.sequenceSeqArray,  // sequenceSeqArray :: Task<A>[] -> Task<A[]> (and performed in sequence)
);
```

The above, similarly, takes the value `withContracts`, pushes it through something
called a `filterMap` (more on this later), then the output of that into another
`map`, then the output of _that_ into something called a `sequenceSeqArray`.

Let's not worry about the types or actions for now, just the concept that if you
have functions A, B, C and pipe data X through them, it's the **same as the following
composition**:

```typescript
const a = pipe(x, A, B, C);
const b = C(B(A(x)));
assert(a === b);
```

Note that the `pipe` function/operator (and similar such as `flow`) are really just ways
to make "function composition" more *readable*. Nothing is really enabled by it.

## Maps, Flat Maps, Bindings

Pipes out of the way, it's time for likely the most important concept we get from Monads.
A **Map** is something which takes some type in space A, and moves it to space B. Now
anyone with a math education (particularly one with some linear algebra) might recognize
this more generally, but there is an interesting property of maps when they apply to a
Monad: **you can map functions as well**. So if you have some function with the following
type signature:

```haskell
f :: A -> B
```

You could also articulate it within a map. This is best seen in the following javascript

```javascript
const a = [1,2,3];
const b = a.map(i => i * 2);
```

So we are using the **map** aspect of the array to process individual items in the array.
We're finally ready to be slightly more formal:

```typescript
const arrayMap = <A,B>(f: (a: A) => B): A[] => B[]
```

Or in plain English: "If I know how to change an A into a B, I also know how to change
an **Array** of A into an **Array** of B". It's also important to note that the data
doesn't stop being an array just because it's been mapped, it's always an array.

### Flat Maps

Now let's say that we have a function `g` which maps from `A -> B[]`. What then? What if we mapped?

Well we would get the following:

```typescript
const g_a = arrayMap(g);
const b: B[][] = g_a(a);
```

Well if we wanted the result to actually be `B[]`, you might already know how, one would want
to use the `flatten` function on the array. Well that is actually something which applies to
*any Monad*:

```
flatten<M> = (a: M<M<A>>) => M<A>
```

And therefore the `flatMap` api similarly takes any function `<M,A>(a: A) => M<B>` and flattens
it by one level.

### Just a couple more examples

There is the `Option` type which can be mapped. The `Option` is either `None` or `Some<T>` and
it's useful when not returning null. As a type it represents the ability for something to be
undefined explicitly. Say I have a function like so:

```typescript
import * as O from 'fp-ts/Option';

const config = process.env.CONF; // type string | undefined
const opt = O.fromNullable(config); // type Option<string>

const toInt = O.map<string, number>(s => parseInt(s, 10)); // Option<string> -> Option<number>

const times2 = a => a * 2; // number -> number

const optAsInt = toInt(opt); // Option<number> - could be null, could be a number

const optTimes2 = O.map(times2)(optAsInt);

// alternatively in a pipe:
pipe(
    process.env.CONF, // string | undefined
    O.fromNullable, // Option<string>
    O.map(s => parseInt(s, 10)), // Option<number>
    O.map(times2), // Option<number>
);
```

Note that the important part here is that we're keeping our eyes on this idea that we
can "move" our processing of Monads into more conventional or convenient articulations.
It's also helpful to notice that we would not run `parseInt` on a null value from the
configuration. In that way you can think of the map of `Option` short circuiting the
computation entirely (much the same as `[].map(a => { throw new Error() }))` wouldn't
actually throw).

There is also the `Either<E,A>` monad, which can be either `Left<E>` or `Right<A>`. By
convention, the `Left` value is considered an error, the right value is considered a
value. When you map over an either you're getting the right side, or passing the error
on, so you could say something like this:

```typescript
import * as E from 'fp-ts/Either';
import { curry, pipe, flip } from 'fp-ts/function';

const divide = (a: number, b: number): E.Either<Error, number> => {
    if (b === 0) return E.left(new Error('cannot divide by zero'));
    return E.right(a / b);
}

// a basic currying of the above
const divideBy = (b: number) => (a: number) => divide(a,b);
// same as divide by, curry2 takes 2-arity functions and makes them into a -> b -> c
// flip takes any function a -> b -> c and flips a,b: b -> a -> c
const divideByC = pipe(divide, curry2, flip);

const percentage = (a: number, b: number) => pipe(
    divide(a,b), // Either<Error, number>
    E.flatMap(divideBy(100)), // Either<Error, number>
)
```

Here we see the flatMap in action, we don't want to have the data come out as
`Either<Error, Either<Error, number>>`, so we flatten the structure as we go.

Every monad maps effectively the same (with some minor differences), so I'll leave the
Task mapping to the reader with one hint: What does the `Promise.then` function do
in javascript and typescript? Can you see how that might be considered a map?

## Aux Functions

This is a somewhat common pattern to me. When I want to set up a recursive function,
but not have the call to the function be totally annoying, I'll set it up with an
aux function. Here is an example:

```typescript
export const checkFieldExists =
  (fieldName: string) =>
  (contract: Contract): O.Option<DirectPayError> => {
    const path = fieldName.split('.');
    const aux = ([head, ...tail]: string[], value: any): boolean => {
      if (!value) {
        return false;
      }
      if (!head) {
        return true;
      }
      if (typeof value !== 'object') {
        return false;
      }
      return aux(tail, value[head]);
    };
    return aux(path, contract) ? O.none : O.some(`Field ${fieldName} does not exist in contract`);
  };
```

Here the aux function obfuscates the recursive nature of the function. It also lets me
do a couple other things:

1. Tail Call Recursion (though that doesn't actually have any impact in node)
2. "Global context" to the function. In the above I didn't use it, but I could have referenced the `contract` directly in the aux function if I needed to

## Filter Map

This is actually something I suggest [going to the docs for](https://gcanti.github.io/fp-ts/modules/Array.ts.html#filtermap).
The long and the short of it though is that you give it a function `f :: A -> Option<B>` and the filter map
gives you back an array of `B` where the members are filtered to only those which are `Some`.

## Task, Task Either

Task is a simple abstraction of a function with the following signature: `f :: () -> Promise<A>`.
This on its own isn't particularly helpful, but it does make one stipulation: **A `Task` should *never*
fail**. It is called by adding an extra `()` at the reference, and that returns a Promise.

TaskEither is significantly more helpful. The thing with Task is that they don't really capture all the
semantics of the `Promise` object. A Promise *can* reject. So what we do is we map that promise into
this new type `TaskEither<E, A>`, which when ran, returns an `Promise<Either<E, A>>`. These are great
for mapping over:

```typescript
import * as TE from 'fp-ts/TaskEither';

export const emitForStatement =
  (producer: EventHubProducerClient, context: Context, debugLogging: boolean = false) =>
  (contract: Contract, statement: Statement): TE.TaskEither<Error, void> =>
    pipe(
      // TaskEither<Error, DirectPayMessage[]>
      getDirectPayEvents(contract, statement.statementEndDate),
      // TaskEither<Error, EventHubMessage[]>
      TE.map(A.map(body => ({ body }))),
      // Log, and flatten that IO into a TaskEither
      TE.map(debugTap(debugLogging, context, 5)),
      TE.flatMap(TE.fromIO),
      // TaskEither<Error, void>
      TE.flatMap(sendToEventHubs(producer, context)),
      // TaskEither<Error, void>
      TE.flatMap(() => updateStatementStatus(statement.statementEndDate, contract.contractId)),
    );
```

The above might not look it, but it is reasonably simple:

1. Build the events *
2. If right, then turn them into event hub messages
3. If right, then potentially write to Console (an IO op) and flatten with a conversion
4. If right, send to event hubs *
5. If right, update statement status *

I've added * to denote the places the operation might fail. You'll also notice that those
are the primary places we find `TE.flatMap`.

Perhaps the best way to think of TaskEither, though is like so:

```typescript
const SimulateTE: Right<B> | Left<Error> = await f()
    // right
    .then(a => Right(b))
    // left
    .catch(e => Left(e));
```

## Conclusion

There are certainly other ideas you might find in my PRs, but they will almost always
follow patters like the above, with some slightly more advanced concepts (such as increasingly
subtle category theory), but most of these concepts can be looked up pretty quickly.
